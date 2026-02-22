import path from 'node:path';

/** Base data directory for persistent storage */
export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');

/** Config file path */
export const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

/** Log directory — daily log files written here */
export const LOG_DIR = path.join(DATA_DIR, 'log');

/** Default fieldSync — all fields enabled */
export const DEFAULT_FIELD_SYNC = {
  title: true,
  summary: true,
  date: true,
  studio: true,
  tags: true,
  performers: true,
  poster: true,
  background: true,
} as const;

/** Default config */
export const DEFAULT_CONFIG = {
  stashes: [
    {
      id: 'default',
      name: 'Default Stash',
      endpoint: 'http://localhost:9999',
      apiKey: '',
      enabled: true,
      priority: 0,
      fieldSync: DEFAULT_FIELD_SYNC,
    },
  ],
};

/** Provider identifier prefix */
export const PROVIDER_ID_PREFIX = 'tv.plex.agents.custom.plex2stash';

/** Provider version string reported to Plex */
export const PROVIDER_VERSION = '1.0.0';

/** Cache TTL — match results (milliseconds) */
export const CACHE_TTL_MATCH = 5 * 60 * 1000;

/** Cache TTL — metadata results (milliseconds) */
export const CACHE_TTL_METADATA = 30 * 60 * 1000;

/** Cache max entries */
export const CACHE_MAX_ENTRIES = 500;

/** Stash GraphQL request timeout (milliseconds) */
export const STASH_REQUEST_TIMEOUT = 10_000;
