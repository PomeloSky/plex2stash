// ============================================================
// Plex Metadata Provider Types — v3.4.0
// Based on Plex OpenAPI specification
// ============================================================

/** Plex metadata type integers */
export enum PlexMetadataType {
  Movie = 1,
  Show = 2,
  Season = 3,
  Episode = 4,
}

/** Item "kind" used internally for ID routing */
export type ItemKind = 'movie' | 'show' | 'season' | 'episode';

// ============================================================
// Provider Root Types
// ============================================================

/** Feature types supported by a provider */
export type ProviderFeatureType = 'match' | 'metadata' | 'images';

/** A provider feature declaration */
export interface ProviderFeature {
  type: ProviderFeatureType;
  key: string;
}

/**
 * A supported media-type declaration in the Types[] array.
 *
 * Per Plex's official custom-provider spec (plexinc/tmdb-example-provider,
 * docs/MediaProvider.md), each entry uses a `type` field (numeric):
 *   1 = Movie, 2 = Show, 3 = Season, 4 = Episode
 * Scheme[].scheme must exactly equal the provider identifier.
 */
export interface PlexTypeEntry {
  type: number;
  Scheme: { scheme: string }[];
}

/**
 * MediaProvider object returned at the provider root.
 *
 * Required structure:
 *   { MediaProvider: { identifier, title, version, protocols, Types, Feature } }
 *
 * Rules:
 *   • MediaProvider is a single OBJECT (never an array)
 *   • No MediaContainer wrapper
 *   • `Types` (plural) uses PlexTypeEntry[] with `type` field
 *   • `protocols` should be 'metadata'
 *   • identifier must be [a-zA-Z0-9.] only, starting with tv.plex.agents.custom.
 */
export interface MediaProvider {
  identifier: string;
  title: string;
  version: string;
  protocols?: string;
  Types?: PlexTypeEntry[];
  Feature: ProviderFeature[];
}

/** Provider root response — { MediaProvider: { ... } } */
export interface ProviderRootResponse {
  MediaProvider: MediaProvider;
}

// ============================================================
// Match Types
// ============================================================

/** A single match candidate returned by the match endpoint */
export interface MatchResult {
  guid: string;
  ratingKey: string;
  key: string;
  title: string;
  year: number;
  score: number;
  type: string;

  // Optional rich fields — populated whenever the candidate's score clears
  // Plex's positive-match threshold, since Plex does not reliably follow up
  // a match with a separate GET /library/metadata/{id} call.
  summary?: string;
  studio?: string;
  Genre?: { tag: string }[];
  Role?: { tag: string; role?: string; thumb?: string }[];
  thumb?: string;
  art?: string;
  originallyAvailableAt?: string;
}

/** Match response */
export interface MatchResponse {
  MediaContainer: {
    offset: number;
    totalSize: number;
    identifier?: string;
    size: number;
    Metadata: MatchResult[];
  };
}

// ============================================================
// Metadata Types
// ============================================================

/**
 * Unified metadata item for Movie (1), Show (2), Season (3), and Episode (4).
 * Fields are optional depending on the item type.
 */
export interface MetadataItem {
  ratingKey: string;
  key: string;
  guid: string;
  type: string;           // 'movie' | 'show' | 'season' | 'episode'
  title: string;
  summary: string;
  year: number;

  // Movie / Show common
  studio?: string;
  Genre?: { tag: string }[];
  Role?: { tag: string; role?: string; thumb?: string }[];
  thumb?: string;
  art?: string;
  originallyAvailableAt?: string;
  addedAt?: number;
  updatedAt?: number;

  // Show-level aggregates
  childCount?: number;
  leafCount?: number;

  // Season / Episode — parent references
  parentRatingKey?: string;
  parentKey?: string;
  parentGuid?: string;
  parentType?: string;
  parentTitle?: string;
  parentThumb?: string;
  parentIndex?: number;

  // Episode — grandparent references
  grandparentRatingKey?: string;
  grandparentKey?: string;
  grandparentGuid?: string;
  grandparentType?: string;
  grandparentTitle?: string;
  grandparentThumb?: string;

  // Episode / Season ordering
  index?: number;
}

/** Standard metadata response */
export interface MetadataResponse {
  MediaContainer: {
    offset: number;
    totalSize: number;
    identifier?: string;
    size: number;
    Metadata: MetadataItem[];
  };
}

/**
 * Children response — used by Plex to traverse Show → Season → Episode.
 *   • Show children  → Seasons
 *   • Season children → Episodes
 */
export interface ChildrenResponse {
  MediaContainer: {
    offset: number;
    totalSize: number;
    identifier?: string;
    size: number;
    key: string;
    parentRatingKey?: string;
    parentTitle?: string;
    Metadata: MetadataItem[];
  };
}

// ============================================================
// Images Types
// ============================================================

/** Image item */
export interface ImageItem {
  type: string;
  url: string;
  provider: string;
  ratingKey: string;
}

/** Images response */
export interface ImagesResponse {
  MediaContainer: {
    offset: number;
    totalSize: number;
    identifier?: string;
    size: number;
    Image: ImageItem[];
  };
}

// ============================================================
// Stash Configuration Types
// ============================================================

/**
 * Controls which metadata fields are synced from Stash to Plex.
 * When a field is false, it is excluded from the Plex metadata response.
 */
export interface FieldSync {
  title: boolean;
  summary: boolean;
  date: boolean;
  studio: boolean;
  tags: boolean;
  performers: boolean;
  poster: boolean;
  background: boolean;
}

/** Default FieldSync — all fields enabled */
export const DEFAULT_FIELD_SYNC: FieldSync = {
  title: true,
  summary: true,
  date: true,
  studio: true,
  tags: true,
  performers: true,
  poster: true,
  background: true,
};

/** A single Stash instance configuration */
export interface StashConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  fieldSync: FieldSync;
}

/** Root config file structure */
export interface AppConfig {
  stashes: StashConfig[];
}

// ============================================================
// Stash GraphQL Response Types
// ============================================================

export interface StashPerformer {
  id: string;
  name: string;
  image_path?: string;
}

export interface StashTag {
  id: string;
  name: string;
}

export interface StashStudio {
  id: string;
  name: string;
  image_path?: string;
}

export interface StashScenePaths {
  screenshot?: string;
  preview?: string;
  stream?: string;
}

export interface StashScene {
  id: string;
  title: string;
  details?: string;
  date?: string;
  rating100?: number;
  organized?: boolean;
  studio?: StashStudio;
  tags: StashTag[];
  performers: StashPerformer[];
  paths: StashScenePaths;
  created_at?: string;
  updated_at?: string;
}

export interface StashFindScenesResult {
  count: number;
  scenes: StashScene[];
}

// ============================================================
// Logger Types
// ============================================================

export type LogLevel = 'trace' | 'debug' | 'info' | 'warning' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  stashId?: string;
  message: string;
}

// ============================================================
// API Request / Response Types
// ============================================================

/** Match request body from Plex */
export interface MatchRequest {
  title: string;
  year?: number;
  /** 1 = Movie, 2 = Show */
  type?: number;
  /**
   * When set (1) and the best match scores above Plex's positive-match
   * threshold (85), Plex expects the full rich Metadata object to be
   * embedded directly in the match response instead of following up with
   * a separate GET /library/metadata/{id} call.
   */
  includeFullMetadata?: number;
  manual?: number;
}

/** Common X-Plex-* headers */
export interface PlexHeaders {
  'x-plex-token'?: string;
  'x-plex-client-identifier'?: string;
  'x-plex-product'?: string;
  'x-plex-version'?: string;
  'x-plex-platform'?: string;
}