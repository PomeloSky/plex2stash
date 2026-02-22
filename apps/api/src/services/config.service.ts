import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig, StashConfig } from '@plex2stash/plex-types';
import { AppConfigSchema } from '../schemas/config.schema.js';
import { CONFIG_PATH, DATA_DIR, DEFAULT_CONFIG } from '../config/constants.js';

class ConfigService {
  private config: AppConfig | null = null;

  /** Ensure config file and data directory exist */
  async ensureConfig(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
      // directory exists
    }

    try {
      await fs.access(CONFIG_PATH);
      await this.load();
    } catch {
      // File doesn't exist, create default
      this.config = DEFAULT_CONFIG;
      await this.save();
    }
  }

  /** Load config from disk */
  async load(): Promise<AppConfig> {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    this.config = AppConfigSchema.parse(parsed);
    return this.config;
  }

  /** Save current config to disk */
  async save(): Promise<void> {
    if (!this.config) throw new Error('Config not loaded');
    await fs.writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  /** Get all stashes */
  async getStashes(): Promise<StashConfig[]> {
    const config = await this.load();
    return config.stashes;
  }

  /** Get a single stash by id */
  async getStash(id: string): Promise<StashConfig | undefined> {
    const config = await this.load();
    return config.stashes.find((s) => s.id === id);
  }

  /** Add a new stash */
  async addStash(stash: StashConfig): Promise<StashConfig> {
    const config = await this.load();
    const exists = config.stashes.find((s) => s.id === stash.id);
    if (exists) {
      throw new Error(`Stash with id "${stash.id}" already exists`);
    }
    config.stashes.push(stash);
    this.config = config;
    await this.save();
    return stash;
  }

  /** Update an existing stash */
  async updateStash(id: string, updates: Partial<StashConfig>): Promise<StashConfig> {
    const config = await this.load();
    const index = config.stashes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Stash with id "${id}" not found`);
    }
    config.stashes[index] = { ...config.stashes[index], ...updates, id };
    this.config = config;
    await this.save();
    return config.stashes[index];
  }

  /** Delete a stash */
  async deleteStash(id: string): Promise<boolean> {
    const config = await this.load();
    const index = config.stashes.findIndex((s) => s.id === id);
    if (index === -1) return false;
    config.stashes.splice(index, 1);
    this.config = config;
    await this.save();
    return true;
  }
}

export const configService = new ConfigService();
