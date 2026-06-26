import { useState } from 'react';

export default function PhotoViewer({ photos = [], labels = [] }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="flex gap-3 flex-wrap">
        {photos.filter(Boolean).map((url, i) => (
          <div key={i} className="relative cursor-pointer" onClick={() => setSelected(url)}>
            <img
              src={url} alt={labels[i] || `Photo ${i + 1}`}
              className="w-24 h-24 object-cover border transition-colors hover:opacity-90"
              style={{ borderRadius: '8px', borderColor: '#E5E2DE' }}
            />
            {labels[i] && (
              <span className="absolute bottom-1 left-0 right-0 text-center text-xs text-white py-0.5"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '0 0 8px 8px' }}>
                {labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-2xl w-full">
            <img src={selected} alt="Full size" className="w-full max-h-[80vh] object-contain" style={{ borderRadius: '8px' }} />
            <button
              className="absolute top-3 right-3 text-white flex items-center justify-center text-xl w-8 h-8 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
