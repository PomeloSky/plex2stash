import type {
  StashConfig,
  StashScene,
  StashFindScenesResult,
} from '@plex2stash/plex-types';
import { STASH_REQUEST_TIMEOUT } from '../config/constants.js';

// ============================================================
// GraphQL Queries
// ============================================================

const SCENE_FRAGMENT = `
  fragment SceneData on Scene {
    id
    title
    details
    date
    rating100
    organized
    studio { id name image_path }
    tags { id name }
    performers { id name image_path }
    paths { screenshot preview stream }
    created_at
    updated_at
  }
`;

const FIND_SCENES_QUERY = `
  ${SCENE_FRAGMENT}
  query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType) {
    findScenes(filter: $filter, scene_filter: $scene_filter) {
      count
      scenes { ...SceneData }
    }
  }
`;

const FIND_SCENE_QUERY = `
  ${SCENE_FRAGMENT}
  query FindScene($id: ID!) {
    findScene(id: $id) { ...SceneData }
  }
`;

const SYSTEM_STATUS_QUERY = `
  query SystemStatus {
    systemStatus {
      appSchema
      status
      databasePath
    }
  }
`;

// ============================================================
// GraphQL Client
// ============================================================

class StashService {
  /**
   * Execute a GraphQL query against a Stash instance.
   */
  private async graphql<T>(
    stash: StashConfig,
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `${stash.endpoint.replace(/\/$/, '')}/graphql`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (stash.apiKey) {
      headers['ApiKey'] = stash.apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STASH_REQUEST_TIMEOUT);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Stash API ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = await res.json() as { data?: T; errors?: { message: string }[] };
      if (json.errors?.length) {
        throw new Error(`Stash GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
      }
      if (!json.data) {
        throw new Error('Stash GraphQL: empty response data');
      }
      return json.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Search scenes by title (and optionally year).
   */
  async findScenes(
    stash: StashConfig,
    title: string,
    year?: number,
    limit = 10,
  ): Promise<StashScene[]> {
    const variables: Record<string, unknown> = {
      filter: {
        q: title,
        per_page: limit,
        sort: 'date',
        direction: 'DESC',
      },
    };

    const data = await this.graphql<{ findScenes: StashFindScenesResult }>(
      stash,
      FIND_SCENES_QUERY,
      variables,
    );

    let scenes = data.findScenes.scenes;

    if (year) {
      const yearStr = String(year);
      const withYear = scenes.filter((s) => s.date?.startsWith(yearStr));
      if (withYear.length > 0) scenes = withYear;
    }

    return scenes;
  }

  /**
   * Get a single scene by ID.
   */
  async findScene(
    stash: StashConfig,
    sceneId: string,
  ): Promise<StashScene | null> {
    try {
      const data = await this.graphql<{ findScene: StashScene | null }>(
        stash,
        FIND_SCENE_QUERY,
        { id: sceneId },
      );
      return data.findScene;
    } catch {
      return null;
    }
  }

  /**
   * Ping / test connection to a Stash instance.
   * Returns { ok, latencyMs, error? }
   */
  async ping(stash: StashConfig): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.graphql<{ systemStatus: unknown }>(stash, SYSTEM_STATUS_QUERY);
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}

export const stashService = new StashService();
