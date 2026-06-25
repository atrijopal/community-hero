import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Step1Photo({ onNext }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [error, setError]     = useState('');

  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return;
    const f = accepted[0];
    if (f.size > 10 * 1024 * 1024) { setError('File too large (max 10 MB)'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (e) => { if (e.target.files[0]) onDrop([e.target.files[0]]); };
    input.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">📸 Upload Issue Photo</h2>
        <p className="text-sm text-gray-500">A clear photo helps AI classify the issue accurately</p>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <button
            onClick={handleCamera}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition shadow-md"
          >
            📷 Take a Photo
          </button>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-4xl mb-3">🖼️</p>
            <p className="text-gray-600 font-medium">{isDragActive ? 'Drop here' : 'Or drag & drop'}</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP — max 10 MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full rounded-2xl max-h-72 object-cover border border-gray-200" />
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="absolute top-3 right-3 bg-black/60 text-white w-8 h-8 rounded-full text-lg leading-none hover:bg-black/80 transition"
            >
              ×
            </button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
            ✅ Photo ready — AI will analyze this to classify the issue
          </div>
          <button
            onClick={() => onNext(file)}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-blue-700 transition"
          >
            Analyze with AI →
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <p className="text-xs text-gray-400 text-center">
        Your photo is processed securely. GPS data is automatically removed.
      </p>
    </div>
  );
}
