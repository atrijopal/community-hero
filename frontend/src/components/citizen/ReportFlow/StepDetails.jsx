import { useState } from 'react';

const SEVERITY_HINTS = [
  { val: 'low',      label: 'Minor',    desc: 'Cosmetic or minor inconvenience',    color: '#1A7A4A', bg: '#E8F5EE' },
  { val: 'medium',   label: 'Moderate', desc: 'Affecting daily movement / usage',   color: '#D4730A', bg: '#FEF3E7' },
  { val: 'high',     label: 'Serious',  desc: 'Dangerous or urgent — needs action', color: '#C13B2A', bg: '#FDF1EF' },
];

const fieldStyle = {
  border: '1px solid #E5E2DE',
  borderRadius: '6px',
  padding: '10px 12px',
  fontSize: 14,
  color: '#4A4A48',
  width: '100%',
  outline: 'none',
};

export default function StepDetails({ category, onNext }) {
  const [description, setDescription] = useState('');
  const [severityHint, setSeverityHint] = useState('medium');
  const [error, setError] = useState('');

  const handleNext = () => {
    const trimmed = description.trim();
    if (trimmed.length < 10) { setError('Please describe the issue in at least 10 characters.'); return; }
    setError('');
    onNext({ description: trimmed, severityHint });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>Describe the issue</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>
          {category ? `Category: ${category.replace('_', ' ')} — ` : ''}
          Help AI verify and improve your report
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          What did you see? <span style={{ color: '#C13B2A' }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); if (error) setError(''); }}
          rows={4}
          maxLength={500}
          placeholder="e.g. Large pothole near the bus stop on MG Road, about 30 cm deep — vehicles swerving dangerously…"
          style={{ ...fieldStyle, resize: 'none' }}
        />
        <div className="flex justify-between mt-1">
          {error
            ? <p className="text-xs" style={{ color: '#C13B2A' }}>{error}</p>
            : <span />
          }
          <p className="text-xs" style={{ color: '#B8B5B0' }}>{description.length}/500</p>
        </div>
      </div>

      {/* Severity hint */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>
          How urgent does it feel?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY_HINTS.map(h => (
            <button
              key={h.val}
              onClick={() => setSeverityHint(h.val)}
              className="flex flex-col items-center p-3 border-2 text-center transition-colors"
              style={{
                borderColor: severityHint === h.val ? h.color : '#E5E2DE',
                backgroundColor: severityHint === h.val ? h.bg : 'white',
                borderRadius: '8px',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: severityHint === h.val ? h.color : '#4A4A48' }}>{h.label}</span>
              <span className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{h.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#B8B5B0' }}>AI will refine severity from your photo — this is just a hint.</p>
      </div>

      <button
        onClick={handleNext}
        disabled={description.trim().length < 10}
        className="w-full py-3.5 font-semibold text-base text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        Analyze with AI →
      </button>
    </div>
  );
}
