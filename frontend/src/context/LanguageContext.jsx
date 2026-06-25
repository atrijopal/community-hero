import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हिंदी', full: 'Hindi' },
  { code: 'bn', label: 'বাংলা', full: 'Bengali' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('ch_lang') || 'en');

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('ch_lang', code);
  };

  // Translate a single string via backend
  const t = useCallback(async (text) => {
    if (!text || lang === 'en') return text;
    try {
      const res = await api.post('/ai/translate', { text, targetLang: lang });
      return res.data.translated || text;
    } catch {
      return text;
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
