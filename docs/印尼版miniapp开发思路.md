# 印尼版 MiniApp 开发思路（已锁定）

> 2026-09-04 修订。工期不再按「一周上线」约束；工时重估见 `docs/印尼版miniapp开发计划.md`。
>
> 开发口令：**copy 独立副本 → 明确不做的 UI 入口全部 mock 掉 → 其余做印尼语适配。**

---

## 1. 背景与目标

中文 MiniApp 是 Telegram 上的 AI 角色扮演产品：大厅选卡、自研聊天、星尘账本、充值、签到、邀请裂变。现在要面向印尼市场做一版语言与投放向产品，用来验证印尼用户会不会留下来聊。

不上中文站完全态。核心功能、业务逻辑与要做的那部分产品形态保持同一套，不另做产品。

---

## 2. 已锁定决策

| 项 | 结论 |
| --- | --- |
| 代码策略 | **从中文站 copy 一份独立副本开发**，不在中文仓库里加 locale / 市场开关 |
| 做法 | 不做的能力 **mock 掉 UI 入口**（不接真链路，也不在副本里删引擎）；剩下用户能走到的表面做印尼语适配 |
| 部署 | 独立 Bot、独立前端、独立后端、独立上线，与中文站完全隔离 |
| 数据库 | 仍用 Supabase，**必须是另一个 project** |
| 角色卡 | 与中文站同一批卡；**数据侧做印尼语适配**后写入印尼库 |
| 运营台 | **界面继续中文**；写入印尼库、对用户生效的配置内容是印尼语（不做运行时中→印翻译） |
| 支付 / 充值 / 订单 | 本期不做 → **入口 mock** |
| 创作 / 许愿池 | 本期不做 → **入口 mock** |
| 语音 | 本期不做 → **入口 mock**（代码保留，不调 TTS） |
| 邀请裂变、每日签到 | **要做**，印尼语适配 |
| 站内客服、消息中心 | **要做**，印尼语适配 |

独立副本换来的是中文主线不被污染；试水失败可以整套停掉。它就是一份 fork。本期按「可能放弃」来建。

### 2.1 「mock 掉」指什么

不是在中文仓库接 mock-registry，也不是把路由/后端删掉。

在**副本前端**把明确不做的入口挡住：用户可以仍看到壳（例如创作 Tab、充值入口、语音按钮），点进去是占位态（即将开放 / 暂不可用），**不发起支付、不写许愿、不调语音**。不是仅处理「我的」页：

- 聊天发送 / 重生成、模型切换、语音生成遇到余额不足时，均不得再 `push` 到真实 `/profile/recharge`；改为页内印尼语提示，可引导用户签到或邀请。
- `/profile/recharge`、订单页和支付回跳即使被直接访问，也只能展示占位 / 禁用态，不创建订单。
- `/create` 与 `/create/wish` 不调用 `/api/wishes`；语音气泡、工具箱语音设置和自定义台词页不调用 voice API。
- 当前底部导航为四列。优先保留「创作」Tab 并落到占位页，避免为试水修改导航布局；若决定删 Tab，必须同步改为三列，并兜住直接访问创作路由的情形。

后端支付 / 许愿 / 语音代码可以留着；`PAYMENT_ENABLED=false`；印尼 Railway 不部署支付对账 Worker 与订单过期 Cron。以后要加回这些能力，拆掉占位即可。

---

## 3. 部署方式

```text
中文现网（不动）
  Bot-CN  →  Vercel-CN  →  Railway-CN  →  Supabase project 中文

印尼试水（全新一套）
  Bot-ID  →  Vercel-ID  →  Railway-ID  →  Supabase project 印尼
                 ↑ 从当前中文 dev 打 tag 后 copy 出的独立 Git 仓库
```

1. 新 GitHub 仓库，印尼 commit 不回中文仓库。
2. 独立 Telegram Bot + Mini App。邀请深链挂印尼 Bot；Bot 名称、`/start` 文案、菜单按钮、命令说明与隐私政策链接均使用印尼语。
3. 独立 Vercel + Railway。`FRONTEND_URL` / `NEXT_PUBLIC_API_URL` 成对指向印尼域名。
4. 独立 Supabase project。禁止运行时连两个 project；从中文环境导出**结构基线**（表、RPC、extension、grant）后以空数据建库，不从迁移目录的 `001` 开始重放，也不迁用户、订单、会话。
5. Admin / CS 各一份指向印尼库的部署，界面中文。
6. 副本里用户可见中文直接改成印尼文，不上 i18n 框架；角色图等资源默认上传印尼 Storage，只有确认跨环境公开 URL 可长期稳定访问时才复用中文 bucket URL。

失败：停印尼 Bot / Vercel / Railway，归档印尼 GitHub 与 Supabase。中文仓库从未被改过。

---

## 4. 印尼版预期形态

壳可以仍接近中文站（四 Tab 也可保留），但真能用的只有下面这些。

| 表面 | 状态 |
| --- | --- |
| 大厅 | 真做：印尼语角色卡、搜索、进房、收藏 |
| 聊天 | 真做：多会话、流式、重生成、模型 / 生成偏好 |
| 创作 / 许愿 | mock：占位，不接许愿 API |
| 我的 | 真做：资料、签到、星尘余额、邀请、客服、消息、消费明细 |
| 充值 / 订单 | mock：入口占位或禁用，不接下单 |
| 语音 / 图片设置 | mock：不调 TTS |
| 运营台 / CS | 中文界面，连印尼库 |

- 鉴权仍走 `X-Init-Data`。
- 卡片文案与开场白来自印尼库，不是前端翻译。
- 模型用印尼语回复：靠印尼 `system_instructions` + 印尼语 `system_prompt`。
- 没有充值，印尼库必须配置足够的免费/奖励星尘，确保用户不会因无法购买而卡死。
- 邀请只发注册 / 聊天轮次奖励；`invitee_first_paid` 关掉。

---

## 5. 复用与适配

原则：**复制 → mock 不做的入口 → 换文案 / 换环境 / 换内容；不改引擎。**

| 功能 | 策略 |
| --- | --- |
| 对话引擎、SSE、计费出口、邀请 bind/发奖 | 原样复用 |
| 大厅、聊天、签到、邀请、客服、消息、钱包展示 | 复用逻辑，用户可见文案改印尼语 |
| 支付、许愿、语音 | 入口 mock，不接真能力 |
| 角色卡、平台规则、邀请海报/文案 | 印尼库内容新做（数据适配，不是改代码） |
| Admin / CS UI | 不翻成印尼语 |

语言与内容适配至少包括：

- 角色卡的名称、简介、标签、开场白、`creator_notes` 与 `system_prompt`；未适配完成的卡设为 `enabled=false`，印尼大厅不得露出中文卡。
- 印尼 `system_instructions`、`interaction_mode_blocks`、`pref_word_count_tiers`、模型 catalog / 价格提示。字数档位按 kata 配，不要搬「300–500 字」；平台规则去掉「仅使用简体中文」。
- 前端硬编码和 API 返回给用户的错误/状态信息，包括聊天、个人页、邀请、客服、消息、支付提示及相对时间文案。`layout.tsx` 和 `global-error.tsx` 的 `lang` 改为 `id`；时间展示按 `Asia/Jakarta`，角色名截断不能沿用中文的 7 字符限制。
- Bot 侧全部用户可见文案，以及消息中心公告、客服开场白和自动回复。

---

## 6. 上线前必须齐的适配面

1. 独立基础设施（仓库 / Bot / Vercel / Railway / 印尼 Supabase / 印尼 admin·CS）；印尼环境不部署支付 Worker / Cron。
2. 用户可见文案（前端硬编码 + 后端返回给用户的 message）。
3. 角色卡印尼语（展示字段 + `system_prompt`）；未适配卡不在大厅出现。
4. 平台规则印尼语。
5. 签到、邀请（海报与文案、注册/聊天轮次奖励开启、首次付费规则关闭）。
6. 无充值时的星尘策略：同时确定新用户赠送、每卡免费额度、免费模型、每日签到与邀请奖励。
7. 支付 / 许愿 / 语音入口已 mock；支付页直接访问、所有 402 分支与工具箱均走不到真链路。
8. Telegram 真机验证：打开、SSE、邀请深链 `?startapp=inv_`、签到、客服与消息中心均可用。

「星尘」译名在翻译开始前锁死。

### 6.1 印尼库的最低配置

- `system_instructions`、`interaction_mode_blocks`、`pref_word_count_tiers`
- `miniapp_new_user_signup_bonus_credits`、`miniapp_character_free_chat_quota_limit`、`miniapp_daily_checkin_bonus_credits`
- `miniapp_free_quota_exhausted_dialog_config`、`insufficient_credits_notice`：均为印尼语，且不再引导充值
- `llm_model_catalog`、`llm_pricing_config`：确保无充值时仍有可聊天的免费/低成本策略
- `miniapp_invite_entry_enabled`、`miniapp_invite_reward_rules`、`miniapp_invite_center_config`：显式开启 `invitee_registered` 与 `invitee_chat_rounds`，关闭 `invitee_first_paid`
- `lobby_pinned_characters`：只配置已印尼语化且启用的角色

邀请中心的奖励数字不得写死。中文页现有「2200 星尘」来自包含首次付费奖励的旧配置；印尼版关闭首次付费后，角标、摘要和分享文案必须从印尼库实际规则生成，或使用不含具体金额的文案。

---

## 7. 一句话

印尼版 = 中文站副本，**支付 / 许愿 / 语音入口 mock 掉**，其余 C 端做印尼语；数据和部署全部独立。
