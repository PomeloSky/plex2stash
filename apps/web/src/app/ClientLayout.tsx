'use client';

import { LanguageProvider, useTranslation } from '@/contexts/LanguageContext';
import { LANGUAGE_LABELS, type Language } from '@/translations';

function Navbar() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/stashes" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
            P2S
          </div>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-orange-400 transition-colors">
            Plex2Stash
          </span>
        </a>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4">
            <a href="/stashes" className="text-sm text-gray-400 hover:text-white transition-colors">
              {t('nav.stashes')}
            </a>
            <a href="/logs" className="text-sm text-gray-400 hover:text-white transition-colors">
              {t('nav.logs')}
            </a>
          </nav>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          >
            {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </LanguageProvider>
  );
}
