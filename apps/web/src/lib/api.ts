import type { StashConfig, LogEntry, LogLevel } from '@plex2stash/plex-types';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API Error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ============================================================
// Stash CRUD
// ============================================================

export async function getStashes(): Promise<StashConfig[]> {
  const data = await fetchJson<{ stashes: StashConfig[] }>('/api/config/stashes');
  return data.stashes;
}

export async function getStash(id: string): Promise<StashConfig> {
  const data = await fetchJson<{ stash: StashConfig }>(`/api/config/stashes/${id}`);
  return data.stash;
}

export async function createStash(
  stash: Omit<StashConfig, 'apiKey' | 'enabled' | 'priority' | 'fieldSync'> & {
    apiKey?: string;
    enabled?: boolean;
    priority?: number;
    fieldSync?: Partial<StashConfig['fieldSync']>;
  },
): Promise<StashConfig> {
  const data = await fetchJson<{ stash: StashConfig }>('/api/config/stashes', {
    method: 'POST',
    body: JSON.stringify(stash),
  });
  return data.stash;
}

export async function updateStash(
  id: string,
  updates: Partial<StashConfig>,
): Promise<StashConfig> {
  const data = await fetchJson<{ stash: StashConfig }>(`/api/config/stashes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.stash;
}

export async function toggleStashEnabled(id: string, enabled: boolean): Promise<StashConfig> {
  return updateStash(id, { enabled });
}

export async function deleteStash(id: string): Promise<void> {
  await fetchJson<void>(`/api/config/stashes/${id}`, { method: 'DELETE' });
}

export async function pingStash(id: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  return fetchJson(`/api/config/stashes/${id}/ping`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function reorderStashes(order: string[]): Promise<StashConfig[]> {
  const data = await fetchJson<{ stashes: StashConfig[] }>('/api/config/stashes/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  });
  return data.stashes;
}

// ============================================================
// Logs
// ============================================================

export interface LogsResult {
  logs: LogEntry[];
  count: number;
}

export async function getLogs(
  date?: string,
  level?: LogLevel | 'all',
  stashId?: string,
): Promise<LogsResult> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (level && level !== 'all') params.set('level', level);
  if (stashId?.trim()) params.set('stashId', stashId.trim());
  const qs = params.toString();
  return fetchJson<LogsResult>(`/api/logs${qs ? `?${qs}` : ''}`);
}

export async function getLogDates(): Promise<string[]> {
  const data = await fetchJson<{ dates: string[] }>('/api/logs/dates');
  return data.dates;
}
