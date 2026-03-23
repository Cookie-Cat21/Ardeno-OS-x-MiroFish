// ============================================================
// Ardeno OS – i18n (English + Sinhala)
// No external library — pure object map + React context.
//
// Usage:
//   const { t, lang, setLang } = useI18n();
//   <h1>{t('dashboard')}</h1>
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Supported languages ─────────────────────────────────────
export type Lang = 'en' | 'si';

// ─── Translation keys ─────────────────────────────────────────
export type TranslationKey =
  | 'dashboard'
  | 'pipeline'
  | 'skills'
  | 'agents'
  | 'telegram'
  | 'activityLog'
  | 'settings'
  | 'newProject'
  | 'createProject'
  | 'clientName'
  | 'projectTitle'
  | 'description'
  | 'stage'
  | 'budget'
  | 'deadline'
  | 'review'
  | 'moodboard'
  | 'exportPDF'
  | 'signOut'
  | 'loading'
  | 'error'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'search'
  | 'welcome'
  | 'activeProjects'
  | 'completed'
  | 'agentsOnline'
  | 'consensus'
  | 'risk'
  | 'avgConsensus'
  | 'riskMeter'
  | 'activityFeed'
  | 'stageIntake'
  | 'stageQuote'
  | 'stageDesign'
  | 'stageBuild'
  | 'stageSecurity'
  | 'stageDeploy'
  | 'stageDone'
  | 'generateMoodboard'
  | 'proposalVisual'
  | 'undoLastAction'
  | 'agentReview'
  | 'skillRegistry'
  | 'addSkill'
  | 'successRate'
  | 'usageCount'
  | 'version'
  | 'category'
  | 'language'
  | 'english'
  | 'sinhala';

// ─── Translations ─────────────────────────────────────────────
const translations: Record<Lang, Record<TranslationKey, string>> = {
  en: {
    dashboard:        'Dashboard',
    pipeline:         'Pipeline',
    skills:           'Skills Registry',
    agents:           'Agents',
    telegram:         'Telegram',
    activityLog:      'Activity Log',
    settings:         'Settings',
    newProject:       'New Project',
    createProject:    'Create Project',
    clientName:       'Client Name',
    projectTitle:     'Project Title',
    description:      'Description',
    stage:            'Stage',
    budget:           'Budget',
    deadline:         'Deadline',
    review:           'Review',
    moodboard:        'Moodboard',
    exportPDF:        'Export PDF',
    signOut:          'Sign Out',
    loading:          'Loading…',
    error:            'Error',
    save:             'Save',
    cancel:           'Cancel',
    delete:           'Delete',
    search:           'Search',
    welcome:          'Welcome back',
    activeProjects:   'Active Projects',
    completed:        'Completed',
    agentsOnline:     'Agents Online',
    consensus:        'Consensus',
    risk:             'Risk',
    avgConsensus:     'Avg Consensus',
    riskMeter:        'Risk Meter',
    activityFeed:     'Activity Feed',
    stageIntake:      'Intake',
    stageQuote:       'Quote',
    stageDesign:      'Design',
    stageBuild:       'Build',
    stageSecurity:    'Security',
    stageDeploy:      'Deploy',
    stageDone:        'Done',
    generateMoodboard: 'Generate Moodboard',
    proposalVisual:   'Proposal Visual',
    undoLastAction:   'Undo Last Action',
    agentReview:      'Agent Review',
    skillRegistry:    'Skills Registry',
    addSkill:         'Add Skill',
    successRate:      'Success Rate',
    usageCount:       'Usage Count',
    version:          'Version',
    category:         'Category',
    language:         'Language',
    english:          'English',
    sinhala:          'සිංහල',
  },

  // ─── Sinhala translations ───────────────────────────────
  si: {
    dashboard:        'මුල් පිටුව',
    pipeline:         'ව්‍යාපෘති රේඛාව',
    skills:           'කුසලතා ලේඛනය',
    agents:           'නියෝජිතයන්',
    telegram:         'ටෙලිග්‍රෑම්',
    activityLog:      'ක්‍රියාකාරකම් ලොගය',
    settings:         'සැකසුම්',
    newProject:       'නව ව්‍යාපෘතිය',
    createProject:    'ව්‍යාපෘතිය සාදන්න',
    clientName:       'සේවාදායකයාගේ නම',
    projectTitle:     'ව්‍යාපෘති නාමය',
    description:      'විස්තරය',
    stage:            'අදියර',
    budget:           'අයවැය',
    deadline:         'කාලසීමාව',
    review:           'සමාලෝචනය',
    moodboard:        'මනෝ රූ ශෛලිය',
    exportPDF:        'PDF ලෙස අපනයනය',
    signOut:          'ඉවත් වන්න',
    loading:          'පූරණය වෙමින්…',
    error:            'දෝෂය',
    save:             'සුරකින්න',
    cancel:           'අවලංගු කරන්න',
    delete:           'මකන්න',
    search:           'සෙවීම',
    welcome:          'නැවත සාදරයෙන් පිළිගනිමු',
    activeProjects:   'සක්‍රිය ව්‍යාපෘති',
    completed:        'සම්පූර්ණ කළ',
    agentsOnline:     'නියෝජිතයන් සමඟ',
    consensus:        'ඒකමතිකතාව',
    risk:             'අවදානම',
    avgConsensus:     'සාමාන්‍ය ඒකමතිකතාව',
    riskMeter:        'අවදානම් මීටරය',
    activityFeed:     'ක්‍රියාකාරකම් ප්‍රවාහය',
    stageIntake:      'ආරම්භය',
    stageQuote:       'මිල ගණනය',
    stageDesign:      'සැලසුම',
    stageBuild:       'ගොඩනැගීම',
    stageSecurity:    'සුරක්‍ෂිතතාව',
    stageDeploy:      'යෙදවීම',
    stageDone:        'සම්පූර්ණ',
    generateMoodboard: 'රූ ශෛලිය සාදන්න',
    proposalVisual:   'යෝජනා දෘශ්‍ය',
    undoLastAction:   'අවසන් ක්‍රියාව 되ලිය ගන්න',
    agentReview:      'නියෝජිත සමාලෝචනය',
    skillRegistry:    'කුසලතා ලේඛනය',
    addSkill:         'කුසලතාව එකතු කරන්න',
    successRate:      'සාර්ථකත්ව අනුපාතය',
    usageCount:       'භාවිත ගණන',
    version:          'අනුවාදය',
    category:         'ප්‍රවර්ගය',
    language:         'භාෂාව',
    english:          'ඉංග්‍රීසි',
    sinhala:          'සිංහල',
  },
};

// ─── Sinhala PDF dictionary (for proposal translation) ────────
// Used when generating PDFs in Sinhala mode
export const PDF_SINHALA_DICT: Record<string, string> = {
  'Project Proposal':    'ව්‍යාපෘති යෝජනාව',
  'Client:':             'සේවාදායකයා:',
  'Stage:':              'අදියර:',
  'Budget:':             'අයවැය:',
  'Deadline:':           'කාලසීමාව:',
  'Description':         'විස්තරය',
  'Consensus Score:':    'ඒකමතිකතා ලකුණ:',
  'Risk Score:':         'අවදානම් ලකුණ:',
  'Prepared by':         'සකසන ලද්දේ',
  'Ardeno Studio':       'ආර්ඩෙනෝ ස්ටූඩියෝ',
};

// ─── React Context ─────────────────────────────────────────────
interface I18nContextValue {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LS_KEY = 'ardeno-os-lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LS_KEY);
    return (stored === 'si' ? 'si' : 'en') as Lang;
  });

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS_KEY, l);

    // Persist to Supabase profiles table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ id: user.id, preferred_language: l })
        .eq('id', user.id);
    }
  }, []);

  // Load from Supabase on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.preferred_language) {
            setLangState(data.preferred_language as Lang);
          }
        });
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string =>
      translations[lang][key] ?? translations['en'][key] ?? key,
    [lang]
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Translate a single string using the Sinhala PDF dictionary */
export function translateForPDF(text: string, lang: Lang): string {
  if (lang !== 'si') return text;
  return PDF_SINHALA_DICT[text] ?? text;
}
