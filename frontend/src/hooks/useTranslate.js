import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Translates a single string reactively when language changes
export const useTranslate = (text) => {
  const { lang, t } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text) return;
    if (lang === 'en') { setTranslated(text); return; }
    t(text).then(setTranslated);
  }, [text, lang]);

  return translated;
};

// Translates multiple strings (object of key: string)
export const useTranslateMap = (map) => {
  const { lang, t } = useLanguage();
  const [result, setResult] = useState(map);

  useEffect(() => {
    if (!map || lang === 'en') { setResult(map); return; }
    const keys = Object.keys(map);
    Promise.all(keys.map(k => t(map[k]))).then(vals => {
      const out = {};
      keys.forEach((k, i) => { out[k] = vals[i]; });
      setResult(out);
    });
  }, [lang, JSON.stringify(map)]);

  return result;
};
