import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconCamera, IconPhoto, IconSparkles } from '@tabler/icons-react';

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
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>Upload Issue Photo</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>A clear photo helps AI classify the issue accurately</p>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <button
            onClick={handleCamera}
            className="w-full flex items-center justify-center gap-3 py-4 font-semibold text-base text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
          >
            <IconCamera size={20} stroke={2} /> Take a Photo
          </button>
          <div
            {...getRootProps()}
            className="border-2 border-dashed p-10 text-center cursor-pointer transition"
            style={{
              borderColor: isDragActive ? '#C13B2A' : '#E5E2DE',
              backgroundColor: isDragActive ? '#FDF1EF' : '#FAFAF9',
              borderRadius: '8px',
            }}
          >
            <input {...getInputProps()} />
            <IconPhoto size={36} stroke={1} style={{ color: '#B8B5B0', margin: '0 auto 12px' }} />
            <p className="font-medium" style={{ color: '#4A4A48' }}>{isDragActive ? 'Drop here' : 'Or drag & drop'}</p>
            <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>JPEG, PNG, WEBP — max 10 MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-72 object-cover" style={{ borderRadius: '8px', border: '1px solid #E5E2DE' }} />
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="absolute top-3 right-3 bg-black/60 text-white w-8 h-8 rounded-full text-lg leading-none hover:bg-black/80 transition"
            >
              ×
            </button>
          </div>
          <div className="border p-3 flex items-center gap-2 text-sm" style={{ borderColor: '#A7D5B9', backgroundColor: '#E8F5EE', borderRadius: '6px', color: '#1A7A4A' }}>
            <IconSparkles size={14} stroke={1.5} /> Photo ready — AI will analyze this to classify the issue
          </div>
          <button
            onClick={() => onNext(file)}
            className="w-full py-3.5 font-semibold text-base text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
          >
            Continue →
          </button>
        </div>
      )}

      {error && <p className="text-sm px-3 py-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderRadius: '6px' }}>{error}</p>}

      <p className="text-xs text-center" style={{ color: '#B8B5B0' }}>
        Your photo is processed securely. GPS data is automatically removed.
      </p>
    </div>
  );
}
