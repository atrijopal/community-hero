import { useState } from 'react';

export default function PhotoViewer({ photos = [], labels = [] }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="flex gap-3 flex-wrap">
        {photos.filter(Boolean).map((url, i) => (
          <div key={i} className="relative cursor-pointer group" onClick={() => setSelected(url)}>
            <img
              src={url} alt={labels[i] || `Photo ${i+1}`}
              className="w-24 h-24 object-cover rounded-xl border border-gray-200 group-hover:border-blue-400 transition"
            />
            {labels[i] && (
              <span className="absolute bottom-1 left-0 right-0 text-center text-xs text-white bg-black/50 rounded-b-xl py-0.5">
                {labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-2xl w-full">
            <img src={selected} alt="Full size" className="w-full rounded-xl max-h-[80vh] object-contain" />
            <button
              className="absolute top-3 right-3 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 text-lg"
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
