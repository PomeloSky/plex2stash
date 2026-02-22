'use client';

import { useEffect, useState, useCallback } from 'react';
import type { StashConfig } from '@plex2stash/plex-types';
import { getStashes, deleteStash, toggleStashEnabled, reorderStashes } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import StashCard from '@/components/StashCard';

export default function StashesPage() {
  const { t } = useTranslation();
  const [stashes, setStashes] = useState<StashConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getApiHost = () => {
    if (typeof window === 'undefined') return 'http://localhost:8787';
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  };

  const loadStashes = useCallback(async () => {
    try { setLoading(true); setError(''); setStashes(await getStashes()); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStashes(); }, [loadStashes]);

  const handleDelete = async (id: string) => { await deleteStash(id); await loadStashes(); };
  const handleToggleEnabled = async (id: string, enabled: boolean) => { await toggleStashEnabled(id, enabled); await loadStashes(); };
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = stashes.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stashes.length) return;
    const newOrder = stashes.map((s) => s.id);
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    try { setStashes(await reorderStashes(newOrder)); } catch (err: any) { setError(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('stashes.title')}</h1>
          <p className="text-gray-400 mt-1">{t('stashes.subtitle')}</p>
        </div>
        <a href="/stashes/new" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20">
          {t('stashes.add')}
        </a>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : stashes.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-gray-400 mb-4">{t('stashes.empty')}</p>
          <a href="/stashes/new" className="inline-block px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all">{t('stashes.addFirst')}</a>
        </div>
      ) : (
        <div className="space-y-4">
          {stashes.map((stash, i) => (
            <StashCard key={stash.id} stash={stash} apiHost={getApiHost()} index={i}
              onDelete={handleDelete} onToggleEnabled={handleToggleEnabled}
              onMoveUp={(id) => handleMove(id, 'up')} onMoveDown={(id) => handleMove(id, 'down')}
              isFirst={i === 0} isLast={i === stashes.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
