import { useLanguage, LANGUAGES } from '../../context/LanguageContext';

export default function LanguageSelector() {
  const { lang, changeLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-0.5" style={{ backgroundColor: '#F5F3F0', borderRadius: '8px' }}>
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          title={l.full}
          className="px-2 py-1 text-xs font-semibold transition-all"
          style={{
            borderRadius: '6px',
            backgroundColor: lang === l.code ? 'white' : 'transparent',
            color: lang === l.code ? '#C13B2A' : '#7A7875',
            boxShadow: lang === l.code ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
