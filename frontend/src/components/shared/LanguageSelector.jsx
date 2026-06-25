import { useLanguage, LANGUAGES } from '../../context/LanguageContext';

export default function LanguageSelector() {
  const { lang, changeLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          title={l.full}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
            lang === l.code
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
