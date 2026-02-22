'use client';

import { useEffect, useState, useCallback } from 'react';
import type { LogEntry, LogLevel } from '@plex2stash/plex-types';
import { getLogs, getLogDates } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';

const LEVEL_STYLES: Record<LogLevel, string> = {
  trace: 'bg-gray-700/50 text-gray-400 border-gray-600', debug: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  info: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30',
};

function today(): string { return new Date().toISOString().slice(0, 10); }

function formatTime(isoStr: string, tz: string): string {
  try {
    const d = new Date(isoStr); if (isNaN(d.getTime())) return isoStr;
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    if (tz !== 'Local') opts.timeZone = tz;
    const parts = new Intl.DateTimeFormat('sv-SE', opts).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch { return isoStr.replace('T', ' ').replace(/\.\d{3}Z$/, ''); }
}

export default function LogsPage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(today());
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  const [stashId, setStashId] = useState('');
  const [timeZone, setTimeZone] = useState('Local');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => { getLogDates().then(setDates).catch(() => {}); }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await getLogs(date, level, stashId); setLogs(r.logs); setCount(r.count); }
    catch (err: any) { setError(err.message); setLogs([]); }
    finally { setLoading(false); }
  }, [date, level, stashId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const levels: { value: LogLevel | 'all'; label: string }[] = [
    { value: 'all', label: t('logs.allLevels') }, { value: 'trace', label: 'Trace' }, { value: 'debug', label: 'Debug' },
    { value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' },
  ];
  const timezones = [
    { value: 'Local', label: t('logs.tz.local') }, { value: 'UTC', label: t('logs.tz.utc') },
    { value: 'Asia/Taipei', label: t('logs.tz.taipei') }, { value: 'Asia/Tokyo', label: t('logs.tz.tokyo') },
  ];

  const selClass = "px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('logs.title')}</h1>
          <p className="text-gray-400 mt-1">{t('logs.subtitle')} <code className="text-orange-400">/data/log/</code></p>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors disabled:opacity-50">
          {loading ? t('logs.loading') : t('logs.refresh')}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">{t('logs.date')}</label>
          <div className="flex gap-2 items-center">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={selClass} />
            {dates.length > 0 && <select value={date} onChange={(e) => setDate(e.target.value)} className={`${selClass} text-gray-300`}>{dates.map((d) => <option key={d} value={d}>{d}</option>)}</select>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">{t('logs.level')}</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as LogLevel | 'all')} className={selClass}>{levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">{t('logs.stashId')}</label>
          <input type="text" value={stashId} onChange={(e) => setStashId(e.target.value)} placeholder={t('logs.allStashes')} className={`${selClass} placeholder-gray-600`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">{t('logs.timezone')}</label>
          <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={selClass}>{timezones.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}</select>
        </div>
        {!loading && <div className="flex items-end pb-2 ml-auto"><span className="text-sm text-gray-400">{t('logs.total')} <span className="text-white font-medium">{count}</span> {t('logs.entries')}</span></div>}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800"><p className="text-gray-500 text-sm">{t('logs.noLogs', { date })}</p></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">{t('logs.time')}</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">{t('logs.level')}</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">{t('logs.stashId')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('logs.message')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs whitespace-nowrap">{formatTime(log.timestamp, timeZone)}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${LEVEL_STYLES[log.level]}`}>{log.level}</span></td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs whitespace-nowrap">{log.stashId || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-200 font-mono text-xs break-all">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
