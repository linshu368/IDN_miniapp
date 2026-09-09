import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db.js';
import { config } from '../platform/config.js';
import { ok, fail, parseLobbySort } from '@miniapp/shared';
import type {
  GetCharactersData,
  GetCharacterByIdData,
  CharacterSummary,
  CharacterDetail,
  LobbyLatestBadgeData,
} from '@miniapp/shared';
import { isLobbyFeatured } from '../features/lobby/featured.js';
import { hasNewLobbyCharacters } from '../lib/lobby-latest-badge.js';
import { MiniappUserSettingsRepository } from '../infrastructure/repositories/MiniappUserSettingsRepository.js';
import { getOrCreateDbUser } from '../lib/user.js';
import { requireTelegramAuth } from '../middleware/auth.js';

const CHARACTER_STORAGE_BUCKET = process.env.CHARACTER_STORAGE_BUCKET || 'character-assets';

export function resolveCharacterAvatarUrl(
  characterId: string,
  avatarUrl: string | null | undefined
): string {
  const existing = avatarUrl?.trim();
  if (existing) return existing;
  if (!config.supabase.url) return '';

  const storagePath = `characters/platform_${characterId}.png`;
  return `${config.supabase.url}/storage/v1/object/public/${CHARACTER_STORAGE_BUCKET}/${storagePath}`;
}

export default async function characterRoutes(app: FastifyInstance) {
  const userSettings = new MiniappUserSettingsRepository();

  // 与首页列表用同一套可见性过滤：用户看不到的角色卡不该点亮 New。
  async function findLatestListedAt(): Promise<Date | null> {
    const listed = await prisma.character.aggregate({
      where: { enabled: true, archived_at: null },
      _max: { last_listed_at: true },
    });
    return listed._max.last_listed_at ?? null;
  }

  // @frontend-ready: true
  app.get('/api/characters', async (request, reply) => {
    const sort = parseLobbySort((request.query as { sort?: unknown } | undefined)?.sort);

    const characters = await prisma.character.findMany({
      where: { enabled: true, archived_at: null },
      // 「最新」只看最后上架时间；「推荐」只按运营 sort_order，同分用创建时间兜底，保证稳定。
      orderBy:
        sort === 'latest'
          ? [{ last_listed_at: 'desc' }, { created_at: 'desc' }]
          : [{ sort_order: 'asc' }, { created_at: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        avatar_url: true,
        tags: true,
        creator: true,
        sort_order: true,
      },
    });

    const charactersSummary: CharacterSummary[] = characters.map(
      (c: (typeof characters)[number]) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        avatar_url: resolveCharacterAvatarUrl(c.id, c.avatar_url),
        personality_tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
        author_name: c.creator,
        // 「最新」页不残留热门金框；推荐页只给 sort_order 0–7。
        is_featured: sort === 'recommended' && isLobbyFeatured(c.sort_order),
      })
    );

    reply.header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=60');
    return reply.send(ok<GetCharactersData>({ characters: charactersSummary }));
  });

  // 首页「最新」入口的 New 提醒。判定全在服务端，用户换端进出算出的结果一致。
  // @frontend-ready: true
  app.get(
    '/api/characters/latest-badge',
    { preHandler: [requireTelegramAuth] },
    async (request, reply) => {
      if (!request.user) return reply.status(401).send(fail('UNAUTHORIZED', 'Unauthorized'));
      const user = await getOrCreateDbUser(request.user);
      const [latestListedAt, lastSeenAt] = await Promise.all([
        findLatestListedAt(),
        userSettings.getCharactersLastSeenAt(user.id),
      ]);

      reply.header('Cache-Control', 'no-store');
      return reply.send(
        ok<LobbyLatestBadgeData>({ has_new: hasNewLobbyCharacters(latestListedAt, lastSeenAt) })
      );
    }
  );

  // 点进「最新」即算看过本轮上新，列表为空也算；下一批角色卡上架后 New 自然恢复。
  // @frontend-ready: true
  app.post(
    '/api/characters/latest-seen',
    { preHandler: [requireTelegramAuth] },
    async (request, reply) => {
      if (!request.user) return reply.status(401).send(fail('UNAUTHORIZED', 'Unauthorized'));
      const user = await getOrCreateDbUser(request.user);
      await userSettings.markCharactersSeen(user.id, request.user);

      reply.header('Cache-Control', 'no-store');
      return reply.send(ok<LobbyLatestBadgeData>({ has_new: false }));
    }
  );

  // @frontend-ready: true
  app.get('/api/characters/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const character = await prisma.character.findFirst({
      where: { id, enabled: true, archived_at: null },
    });

    if (!character) {
      return reply.status(404).send(fail('NOT_FOUND', 'Character not found'));
    }

    const characterDetail: CharacterDetail = {
      id: character.id,
      name: character.name,
      description: character.description,
      avatar_url: resolveCharacterAvatarUrl(character.id, character.avatar_url),
      personality_tags: Array.isArray(character.tags) ? (character.tags as string[]) : [],
      author_name: character.creator,
      is_featured: isLobbyFeatured(character.sort_order),
      greeting: character.first_mes,
      creator_notes: character.creator_notes,
    };

    return reply.send(ok<GetCharacterByIdData>({ character: characterDetail }));
  });
}
