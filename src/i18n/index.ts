import { usePreferencesStore } from '../store/usePreferencesStore';
import { translations } from './translations';
import { AppLanguage, SUPPORTED_LANGUAGES, LanguageOption } from './types';

export function useTranslation() {
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);

  const t = translations[language] || translations.en;

  return {
    t,
    language,
    setLanguage,
  };
}

export { SUPPORTED_LANGUAGES, LanguageOption, AppLanguage, translations };
