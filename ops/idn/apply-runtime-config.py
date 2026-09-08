#!/usr/bin/env python3
"""Apply ops/idn/runtime-config.json to the Indonesian Supabase project.

Reads credentials from .local-idn/bootstrap.env. Does not print secrets.
"""

from __future__ import annotations

import json
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "ops/idn/runtime-config.json"
PATCH_SQL_PATH = ROOT / "ops/idn/patch-invite-registered.sql"
ENV_PATH = ROOT / ".local-idn/bootstrap.env"
IDN_REF = "bklxvrrtccphrtnpqulh"
CN_PUBLIC_AVATAR = (
    "https://zoqelpfhurwehlvypryl.supabase.co/storage/v1/object/public/"
    "miniapp-user-avatars/default_user_avatar/default-user-avatar-20260713.png"
)
AVATAR_OBJECT = "default_user_avatar/default-user-avatar-20260713.png"
# 与 030 用户上传上限一致；054 把桶抬到 5 MiB 只为塞进默认图。
# 印尼桶建库时用了 2 MiB，原图 2.3MB 会被拒。头像展示不需要 1254px，压到 512 再传。
AVATAR_MAX_EDGE = 512
AVATAR_BUCKET_LIMIT = 2 * 1024 * 1024
CTX = ssl.create_default_context()


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:]
        match = re.match(r"^([A-Z0-9_]+)\s*=\s*(.*)$", line)
        if not match:
            continue
        key, value = match.group(1), match.group(2)
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        env[key] = value
    return env


def request(method: str, url: str, headers: dict[str, str], data: bytes | None = None, timeout: int = 60):
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers), exc.read()


def upsert_entry(base_url: str, key_token: str, entry: dict) -> None:
    status, _headers, body = request(
        "GET",
        f"{base_url}/rest/v1/runtime_config?select=key,version&key=eq.{entry['key']}",
        {
            "apikey": key_token,
            "Authorization": f"Bearer {key_token}",
            "Accept-Profile": "app_core",
        },
    )
    if status != 200:
        raise RuntimeError(f"read {entry['key']} failed HTTP {status}: {body[:300]!r}")
    rows = json.loads(body.decode() or "[]")
    current_version = rows[0]["version"] if rows else 0
    payload = {
        "key": entry["key"],
        "value": entry["value"],
        "text_value": entry["text_value"],
        "description": entry.get("description") or "",
        "version": current_version + 1,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    status, _headers, body = request(
        "POST",
        f"{base_url}/rest/v1/runtime_config",
        {
            "apikey": key_token,
            "Authorization": f"Bearer {key_token}",
            "Content-Type": "application/json",
            "Accept-Profile": "app_core",
            "Content-Profile": "app_core",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    )
    if status not in (200, 201, 204):
        raise RuntimeError(f"upsert {entry['key']} failed HTTP {status}: {body[:400]!r}")
    print(f"  {entry['key']} v{payload['version']}")


def compress_png(raw: bytes, max_edge: int = AVATAR_MAX_EDGE) -> bytes:
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "src.png"
        dst = Path(tmp) / "out.png"
        src.write_bytes(raw)
        result = subprocess.run(
            ["sips", "-Z", str(max_edge), str(src), "--out", str(dst)],
            capture_output=True,
        )
        if result.returncode != 0 or not dst.exists():
            sys.stderr.write(result.stderr.decode("utf-8", errors="replace"))
            raise RuntimeError("sips failed to resize default avatar")
        out = dst.read_bytes()
    if len(out) > AVATAR_BUCKET_LIMIT:
        raise RuntimeError(f"resized avatar still too large: {len(out)} bytes")
    return out


def copy_default_avatar(idn_url: str, idn_key: str) -> None:
    status, _headers, body = request("GET", CN_PUBLIC_AVATAR, {}, timeout=60)
    if status != 200 or not body:
        print(f"  skip default avatar copy (download HTTP {status})")
        return
    original = len(body)
    if original > AVATAR_BUCKET_LIMIT:
        body = compress_png(body)
        print(f"  resized default avatar {original} -> {len(body)} bytes")
    upload_url = f"{idn_url}/storage/v1/object/miniapp-user-avatars/{AVATAR_OBJECT}"
    status, _headers, resp = request(
        "POST",
        upload_url,
        {
            "apikey": idn_key,
            "Authorization": f"Bearer {idn_key}",
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
        data=body,
        timeout=60,
    )
    if status not in (200, 201):
        raise RuntimeError(f"upload default avatar failed HTTP {status}: {resp[:200]!r}")
    print(f"  default avatar {len(body)} bytes -> miniapp-user-avatars/{AVATAR_OBJECT}")


def apply_sql(direct_url: str) -> None:
    sql = PATCH_SQL_PATH.read_text()
    cmd = ["psql", direct_url, "-v", "ON_ERROR_STOP=1", "-f", "-"]
    result = subprocess.run(cmd, input=sql.encode("utf-8"), capture_output=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr.decode("utf-8", errors="replace"))
        raise RuntimeError("patch-invite-registered.sql failed")
    print("  patched bind_invite + check_invite_chat_rounds_reward")


def main() -> int:
    if not ENV_PATH.exists():
        raise SystemExit(f"missing {ENV_PATH}")
    env = parse_env(ENV_PATH)
    idn_url = env["TEST_SUPABASE_URL"]
    if IDN_REF not in idn_url:
        raise SystemExit("refusing to write: TEST_SUPABASE_URL is not the Indonesian project")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    direct_url = env.get("TEST_DIRECT_URL") or env.get("DIRECT_URL")
    if not direct_url:
        raise SystemExit("missing TEST_DIRECT_URL")
    if IDN_REF not in direct_url:
        raise SystemExit("refusing to write: database URL is not the Indonesian project")

    pack = json.loads(CONFIG_PATH.read_text())
    entries = pack["entries"]
    sql_only = "--sql-only" in sys.argv
    avatar_only = "--avatar-only" in sys.argv
    if avatar_only:
        print("copying default user avatar")
        copy_default_avatar(idn_url, key)
        print("ok")
        return 0
    if not sql_only:
        print(f"upserting {len(entries)} runtime_config keys")
        for entry in entries:
            upsert_entry(idn_url, key, entry)

        print("copying default user avatar")
        copy_default_avatar(idn_url, key)
    else:
        print("sql-only: skipping config upsert and avatar copy")

    print("applying invite RPC patch")
    apply_sql(direct_url)

    status, _headers, body = request(
        "GET",
        f"{idn_url}/rest/v1/runtime_config?select=key,version&order=key",
        {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept-Profile": "app_core",
            "Prefer": "count=exact",
        },
    )
    if status not in (200, 206):
        raise RuntimeError(f"verify failed HTTP {status}: {body[:200]!r}")
    rows = json.loads(body.decode() or "[]")
    print(f"runtime_config rows={len(rows)}")
    wanted = {entry["key"] for entry in entries}
    have = {row["key"] for row in rows}
    missing = sorted(wanted - have)
    if missing:
        raise RuntimeError(f"missing keys after upsert: {missing}")
    print("ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
