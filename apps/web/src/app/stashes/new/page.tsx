'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import StashForm from '@/components/StashForm';
import { createStash } from '@/lib/api';
import type { StashConfig } from '@plex2stash/plex-types';

export default function NewStashPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSubmit = async (data: Partial<StashConfig> & { id: string }) => {
    await createStash({ id: data.id, name: data.name || data.id, endpoint: data.endpoint || '', apiKey: data.apiKey, enabled: data.enabled, fieldSync: data.fieldSync });
    router.push('/stashes');
  };

  return (
    <div>
      <div className="mb-8">
        <a href="/stashes" className="text-sm text-gray-400 hover:text-white transition-colors">&larr; {t('back')}</a>
        <h1 className="text-2xl font-bold text-white mt-3">{t('new.title')}</h1>
        <p className="text-gray-400 mt-1">{t('new.subtitle')}</p>
      </div>
      <div className="max-w-lg"><StashForm onSubmit={handleSubmit} /></div>
    </div>
  );
}
