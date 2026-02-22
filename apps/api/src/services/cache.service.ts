import { LRUCache } from 'lru-cache';
import {
  CACHE_TTL_MATCH,
  CACHE_TTL_METADATA,
  CACHE_MAX_ENTRIES,
} from '../config/constants.js';

/**
 * Two-tier LRU cache to reduce Stash DB pressure.
 *
 * - matchCache:    TTL  5 min  — search/match results
 * - metadataCache: TTL 30 min  — single-item metadata
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
class CacheService {
  private matchCache: LRUCache<string, any>;
  private metadataCache: LRUCache<string, any>;

  constructor() {
    this.matchCache = new LRUCache<string, any>({
      max: CACHE_MAX_ENTRIES,
      ttl: CACHE_TTL_MATCH,
    });

    this.metadataCache = new LRUCache<string, any>({
      max: CACHE_MAX_ENTRIES,
      ttl: CACHE_TTL_METADATA,
    });
  }

  // ---- match cache ----

  matchKey(stashId: string, title: string, year?: number): string {
    return `match:${stashId}:${title.toLowerCase().trim()}:${year ?? ''}`;
  }

  getMatch(key: string): any | undefined {
    return this.matchCache.get(key);
  }

  setMatch(key: string, value: any): void {
    this.matchCache.set(key, value);
  }

  // ---- metadata cache ----

  metadataKey(stashId: string, itemId: string): string {
    return `metadata:${stashId}:${itemId}`;
  }

  getMetadata(key: string): any | undefined {
    return this.metadataCache.get(key);
  }

  setMetadata(key: string, value: any): void {
    this.metadataCache.set(key, value);
  }

  // ---- stats / admin ----

  stats() {
    return {
      match: { size: this.matchCache.size, max: CACHE_MAX_ENTRIES, ttlMs: CACHE_TTL_MATCH },
      metadata: { size: this.metadataCache.size, max: CACHE_MAX_ENTRIES, ttlMs: CACHE_TTL_METADATA },
    };
  }

  clear() {
    this.matchCache.clear();
    this.metadataCache.clear();
  }
}

export const cacheService = new CacheService();
