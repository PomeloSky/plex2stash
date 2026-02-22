'use client';

import { useState } from 'react';
import type { StashConfig, FieldSync } from '@plex2stash/plex-types';
import { DEFAULT_FIELD_SYNC } from '@plex2stash/plex-types';
import { useTranslation } from '@/contexts/LanguageContext';

interface StashFormProps {
  initialData?: StashConfig;
  onSubmit: (data: Partial<StashConfig> & { id: string }) => Promise<void>;
  isEdit?: boolean;
}

const FIELD_KEYS: (keyof FieldSync)[] = ['title', 'summary', 'date', 'studio', 'tags', 'performers', 'poster', 'background'];

export default function StashForm({ initialData, onSubmit, isEdit }: StashFormProps) {
  const { t } = useTranslation();
  const [id, setId]           = useState(initialData?.id || '');
  const [name, setName]       = useState(initialData?.name || '');
  const [endpoint, setEndpoint] = useState(initialData?.endpoint || '');
  const [apiKey, setApiKey]   = useState(initialData?.apiKey || '');
  const [enabled, setEnabled] = useState(initialData?.enabled !== false);
  const [fieldSync, setFieldSync] = useState<FieldSync>(initialData?.fieldSync ?? { ...DEFAULT_FIELD_SYNC });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleFieldSyncChange = (field: keyof FieldSync, value: boolean) => setFieldSync((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await onSubmit({ id, name, endpoint, apiKey, enabled, fieldSync }); }
    catch (err: any) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

      <div className="space-y-2">
        <label htmlFor="id" className="block text-sm font-medium text-gray-300">{t('form.stashId')}</label>
        <input id="id" type="text" value={id} onChange={(e) => setId(e.target.value)} disabled={isEdit} placeholder="myStash1" required pattern="^[a-zA-Z0-9.]+$" title={t('form.stashIdHint')} className={`${inputClass} disabled:opacity-50`} />
        <p className="text-xs text-gray-500">{t('form.stashIdHint')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('form.displayName')}</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Stash Server" required className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="endpoint" className="block text-sm font-medium text-gray-300">{t('form.endpointUrl')}</label>
        <input id="endpoint" type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="http://192.168.1.100:9999" required className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">{t('form.apiKey')}</label>
        <input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={t('form.apiKeyPlaceholder')} className={inputClass} />
      </div>

      <div className="flex items-center justify-between py-3 px-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-300">{t('form.enableProvider')}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('form.enableProviderHint')}</p>
        </div>
        <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${enabled ? 'bg-orange-500' : 'bg-gray-600'}`}>
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <p className="text-sm font-medium text-gray-300">{t('form.syncFields')}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('form.syncFieldsHint')}</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {FIELD_KEYS.map((field) => (
            <label key={field} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0">
                <input type="checkbox" checked={fieldSync[field]} onChange={(e) => handleFieldSyncChange(field, e.target.checked)} className="peer sr-only" />
                <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${fieldSync[field] ? 'bg-orange-500 border-orange-500' : 'bg-gray-800 border-gray-600 group-hover:border-gray-500'}`}>
                  {fieldSync[field] && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{t(`field.${field}`)}</span>
            </label>
          ))}
        </div>
        <div className="px-4 pb-3 flex gap-2">
          <button type="button" onClick={() => setFieldSync({ ...DEFAULT_FIELD_SYNC })} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">{t('form.selectAll')}</button>
          <span className="text-xs text-gray-600">·</span>
          <button type="button" onClick={() => { const af = Object.fromEntries(Object.keys(DEFAULT_FIELD_SYNC).map((k) => [k, false])) as unknown as FieldSync; setFieldSync(af); }} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{t('form.selectNone')}</button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20">
        {loading ? t('form.submitting') : isEdit ? t('form.update') : t('form.create')}
      </button>
    </form>
  );
}
