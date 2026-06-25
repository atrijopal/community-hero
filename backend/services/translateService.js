const fetch = require('node-fetch');

const SUPPORTED = ['en', 'hi', 'bn'];

const translate = async (text, targetLang) => {
  if (!text || targetLang === 'en') return text;
  if (!SUPPORTED.includes(targetLang)) return text;
  const key = process.env.TRANSLATE_API_KEY;
  if (!key) return text; // graceful fallback if key not set

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang, format: 'text' }),
      }
    );
    const data = await res.json();
    return data?.data?.translations?.[0]?.translatedText || text;
  } catch {
    return text; // never crash — always return original on failure
  }
};

const translateBatch = async (texts, targetLang) => {
  if (!texts?.length || targetLang === 'en') return texts;
  const key = process.env.TRANSLATE_API_KEY;
  if (!key) return texts;

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, target: targetLang, format: 'text' }),
      }
    );
    const data = await res.json();
    return data?.data?.translations?.map(t => t.translatedText) || texts;
  } catch {
    return texts;
  }
};

module.exports = { translate, translateBatch };
