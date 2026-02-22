'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import StashForm from '@/components/StashForm';
import { getStash, updateStash } from '@/lib/api';
import type { StashConfig } from '@plex2stash/plex-types';

export default function EditStashPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [stash, setStash] = useState<StashConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    getStash(params.id).then(setStash).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (data: Partial<StashConfig> & { id: string }) => {
    await updateStash(data.id, { name: data.name, endpoint: data.endpoint, apiKey: data.apiKey, enabled: data.enabled, fieldSync: data.fieldSync });
    router.push('/stashes');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !stash) return <div className="text-center py-20"><p className="text-red-400 mb-4">{error || t('edit.notFound')}</p><a href="/stashes" className="text-orange-400 hover:text-orange-300 transition-colors">{t('back')}</a></div>;

  return (
    <div>
      <div className="mb-8">
        <a href="/stashes" className="text-sm text-gray-400 hover:text-white transition-colors">&larr; {t('back')}</a>
        <h1 className="text-2xl font-bold text-white mt-3">{t('edit.title', { name: stash.name })}</h1>
        <p className="text-gray-400 mt-1">{t('edit.subtitle')}</p>
      </div>
      <div className="max-w-lg"><StashForm initialData={stash} onSubmit={handleSubmit} isEdit /></div>
    </div>
  );
}
