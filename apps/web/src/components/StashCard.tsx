'use client';

import type { StashConfig } from '@plex2stash/plex-types';
import { useState } from 'react';
import { pingStash } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';

interface StashCardProps {
  stash: StashConfig; apiHost: string; index: number;
  onDelete: (id: string) => Promise<void>;
  onToggleEnabled: (id: string, enabled: boolean) => Promise<void>;
  onMoveUp: (id: string) => void; onMoveDown: (id: string) => void;
  isFirst: boolean; isLast: boolean;
}

export default function StashCard({ stash, apiHost, index, onDelete, onToggleEnabled, onMoveUp, onMoveDown, isFirst, isLast }: StashCardProps) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; latencyMs: number; error?: string } | null>(null);
  const [pinging, setPinging] = useState(false);

  const providerUrl = `${apiHost}/providers/${stash.id}`;
  const isEnabled = stash.enabled !== false;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(providerUrl); }
      else { throw new Error('unavailable'); }
      setCopied(true); setCopyFailed(false);
    } catch {
      try {
        const ta = document.createElement('textarea'); ta.value = providerUrl; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta);
        if (!ok) throw new Error('fail'); setCopied(true); setCopyFailed(false);
      } catch { setCopyFailed(true); setCopied(false); }
    }
    setTimeout(() => { setCopied(false); setCopyFailed(false); }, 2500);
  };

  const handleDelete = async () => { if (!confirm(t('card.confirmDelete', { name: stash.name }))) return; setDeleting(true); try { await onDelete(stash.id); } finally { setDeleting(false); } };
  const handleToggle = async () => { setToggling(true); try { await onToggleEnabled(stash.id, !stash.enabled); } finally { setToggling(false); } };
  const handlePing = async () => { setPinging(true); setPingResult(null); try { setPingResult(await pingStash(stash.id)); } catch (err: any) { setPingResult({ ok: false, latencyMs: 0, error: err.message }); } finally { setPinging(false); } };

  return (
    <div className={`bg-gray-900 border rounded-xl p-6 transition-all group ${isEnabled ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/50 opacity-70'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => onMoveUp(stash.id)} disabled={isFirst} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none" title={t('card.moveUp')}>&#9650;</button>
            <button onClick={() => onMoveDown(stash.id)} disabled={isLast} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none" title={t('card.moveDown')}>&#9660;</button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono">#{index + 1}</span>
              <h3 className={`text-lg font-semibold transition-colors ${isEnabled ? 'text-white group-hover:text-orange-400' : 'text-gray-400'}`}>{stash.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">ID: {stash.id}</p>
          </div>
        </div>
        <button onClick={handleToggle} disabled={toggling} className="flex items-center gap-1.5 cursor-pointer disabled:cursor-wait">
          <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className={`text-xs ${isEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>{toggling ? '...' : isEnabled ? 'Active' : 'Disabled'}</span>
        </button>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">{t('card.endpoint')}</span>
          <p className="text-sm text-gray-300 mt-0.5 font-mono break-all">{stash.endpoint}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">{t('card.providerUrl')}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <code className={`flex-1 text-sm bg-gray-800 px-3 py-1.5 rounded font-mono break-all ${isEnabled ? 'text-orange-400' : 'text-gray-500 line-through'}`}>{providerUrl}</code>
            <button onClick={handleCopy} className={`shrink-0 px-3 py-1.5 text-xs border rounded transition-colors ${copyFailed ? 'bg-red-500/10 border-red-500/30 text-red-400' : copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'}`}>
              {copyFailed ? t('card.copyFailed') : copied ? t('card.copied') : t('card.copy')}
            </button>
          </div>
        </div>
        {pingResult && (
          <div className={`text-xs px-3 py-2 rounded ${pingResult.ok ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {pingResult.ok ? t('card.connectionOk', { ms: String(pingResult.latencyMs) }) : t('card.connectionFail', { error: pingResult.error || 'Unknown' })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
        <button onClick={handlePing} disabled={pinging} className="px-4 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 transition-colors disabled:opacity-50">{pinging ? t('card.testing') : t('card.testConnection')}</button>
        <a href={`/stashes/${stash.id}`} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors">{t('card.edit')}</a>
        <button onClick={handleToggle} disabled={toggling} className={`px-4 py-2 text-sm border rounded-lg transition-colors disabled:opacity-50 ${isEnabled ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>{isEnabled ? t('card.disable') : t('card.enable')}</button>
        <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors disabled:opacity-50">{deleting ? t('card.deleting') : t('card.delete')}</button>
      </div>
    </div>
  );
}
