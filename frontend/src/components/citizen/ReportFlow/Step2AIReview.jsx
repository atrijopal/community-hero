import { useState } from 'react';
import { IconSparkles, IconCircleCheck, IconAlertTriangle, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { ISSUE_TYPES, DEPARTMENTS } from '../../../utils/constants';

const AIBadge = () => (
  <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5"
    style={{ backgroundColor: '#EDE9F8', color: '#6B50B8', borderRadius: '4px' }}>
    <IconSparkles size={10} stroke={2} />◆ AI
  </span>
);

const MatchBanner = ({ match, matchConfidence, detectedType, declaredCategory, onRecategorize }) => {
  if (match === undefined || match === null) return null;

  if (match) {
    return (
      <div className="flex items-start gap-3 p-3.5 border" style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '8px' }}>
        <IconCircleCheck size={18} stroke={1.5} style={{ color: '#1A7A4A', shrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1A7A4A' }}>
            Photo matches — looks like {detectedType?.replace(/_/g, ' ')} ({matchConfidence}% confidence)
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>Review and confirm the AI-filled fields below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border" style={{ backgroundColor: '#FFF8E0', borderColor: '#F5D56A', borderRadius: '8px', overflow: 'hidden' }}>
      <div className="flex items-start gap-3 p-3.5">
        <IconAlertTriangle size={18} stroke={1.5} style={{ color: '#D4730A', shrink: 0, marginTop: 1 }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#8B6600' }}>
            Possible mismatch — photo appears to show <em>{detectedType?.replace(/_/g, ' ')}</em>
            {declaredCategory ? `, not ${declaredCategory.replace(/_/g, ' ')}` : ''}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>
            You can still submit as-is, or recategorize so officers route it correctly.
          </p>
        </div>
      </div>
      {onRecategorize && (
        <div className="px-3.5 pb-3 flex gap-2">
          <button
            onClick={onRecategorize}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: '#D4730A', color: '#8B6600', backgroundColor: 'white', borderRadius: '6px' }}
          >
            <IconRefresh size={12} stroke={1.5} /> Recategorize
          </button>
          <span className="text-xs self-center" style={{ color: '#B8B5B0' }}>or continue and flag for officer review</span>
        </div>
      )}
    </div>
  );
};

const ConfidenceBar = ({ confidence, reasoning }) => {
  const color   = confidence >= 80 ? '#1A7A4A' : confidence >= 50 ? '#D4730A' : '#C13B2A';
  const bgColor = confidence >= 80 ? '#EBF5EF' : confidence >= 50 ? '#FEF3E7' : '#FDF1EF';
  const label   = confidence >= 80 ? 'High'    : confidence >= 50 ? 'Medium'   : 'Low';
  return (
    <div className="p-4 border" style={{ backgroundColor: bgColor, borderColor: '#E5E2DE', borderRadius: '8px' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#6B50B8' }}>
          <IconSparkles size={14} stroke={2} /> AI Confidence
        </span>
        <span className="text-sm font-bold" style={{ color }}>{confidence}% — {label}</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E2DE' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${confidence}%`, backgroundColor: color }} />
      </div>
      {reasoning && <p className="text-xs mt-2" style={{ color: '#7A7875' }}>{reasoning}</p>}
      {confidence < 50 && (
        <p className="text-xs mt-2 px-2 py-1.5 border-l-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderColor: '#C13B2A', borderRadius: '4px' }}>
          Low confidence — please review all fields carefully before submitting.
        </p>
      )}
    </div>
  );
};

const fieldClass = 'w-full border px-3 py-2.5 text-sm transition-colors';
const fieldStyle = { borderColor: '#E5E2DE', borderRadius: '6px', color: '#4A4A48' };

function AIErrorBanner() {
  return (
    <div className="flex items-start gap-3 p-3.5 border" style={{ backgroundColor: '#FFF8E0', borderColor: '#F5D56A', borderRadius: '8px' }}>
      <IconWifiOff size={18} stroke={1.5} style={{ color: '#D4730A', flexShrink: 0, marginTop: 1 }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: '#8B6600' }}>AI classification failed</p>
        <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>
          Could not reach the AI service (quota or network issue). Please fill in the fields below manually — your report will still be submitted.
        </p>
      </div>
    </div>
  );
}

export default function Step2AIReview({ aiData, aiError, onConfirm, onRecategorize }) {
  // Component only mounts after aiData is ready — useState initializes with real values
  const [form, setForm] = useState({
    issueType:    aiData?.issueType    || '',
    category:     aiData?.category     || 'Infrastructure',
    severity:     aiData?.severity     || 5,
    dangerLevel:  aiData?.dangerLevel  || 'moderate',
    departmentId: aiData?.departmentId || '',
    description:  aiData?.description  || '',
  });
  const [edited, setEdited] = useState({});

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setEdited(e => ({ ...e, [field]: true }));
  };

  const sevColor = form.severity >= 9 ? '#C13B2A' : form.severity >= 4 ? '#D4730A' : '#1A7A4A';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-0.5" style={{ color: '#4A4A48' }}>
          {aiError ? 'Fill in Details' : 'AI Review & Confirm'}
        </h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>
          {aiError ? 'AI is unavailable — fill in the fields below manually' : 'Review AI suggestions — every field is editable'}
        </p>
      </div>

      {/* AI error or match/confidence banners */}
      {aiError ? (
        <AIErrorBanner />
      ) : (
        <>
          <MatchBanner
            match={aiData?.match}
            matchConfidence={aiData?.matchConfidence}
            detectedType={aiData?.detectedType}
            declaredCategory={aiData?.declaredCategory}
            onRecategorize={onRecategorize}
          />
          {aiData?.confidence > 0 && (
            <ConfidenceBar confidence={aiData.confidence} reasoning={aiData.reasoning} />
          )}
        </>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          Issue Type {!edited.issueType && <AIBadge />}
        </label>
        <select value={form.issueType} onChange={e => set('issueType', e.target.value)}
          className={fieldClass} style={fieldStyle}>
          <option value="">Select type…</option>
          {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label.replace(/^\p{Emoji}\s*/u, '')}</option>)}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>
          Severity: <span style={{ color: sevColor }}>{form.severity}/10</span>
          {!edited.severity && <AIBadge />}
        </label>
        <input type="range" min="1" max="10" value={form.severity}
          onChange={e => set('severity', parseInt(e.target.value))}
          className="w-full" style={{ accentColor: sevColor }} />
        <div className="flex justify-between text-xs mt-1" style={{ color: '#B8B5B0' }}>
          <span>1 — Minor</span><span>5 — Moderate</span><span>10 — Critical</span>
        </div>
        {form.severity >= 9 && (
          <p className="mt-2 text-xs px-3 py-2 border-l-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderColor: '#C13B2A', borderRadius: '4px' }}>
            Critical severity — this ticket will be fast-tracked to a senior officer.
          </p>
        )}
      </div>

      {/* Danger Level */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>
          Danger Level {!edited.dangerLevel && <AIBadge />}
        </label>
        <div className="flex gap-2">
          {[
            { val: 'safe',     color: '#1A7A4A', bg: '#EBF5EF', label: 'Safe' },
            { val: 'moderate', color: '#D4730A', bg: '#FEF3E7', label: 'Moderate' },
            { val: 'critical', color: '#C13B2A', bg: '#FDF1EF', label: 'Critical' },
          ].map(({ val, color, bg, label }) => (
            <label key={val} className="flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer text-sm font-medium border transition-colors"
              style={{
                borderRadius: '6px',
                borderColor: form.dangerLevel === val ? color : '#E5E2DE',
                backgroundColor: form.dangerLevel === val ? bg : 'white',
                color: form.dangerLevel === val ? color : '#7A7875',
              }}>
              <input type="radio" value={val} checked={form.dangerLevel === val}
                onChange={() => set('dangerLevel', val)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Department */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          Department {!edited.departmentId && <AIBadge />}
        </label>
        <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)}
          className={fieldClass} style={fieldStyle}>
          <option value="">Select department…</option>
          {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          Description {!edited.description && <AIBadge />}
        </label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} maxLength={500} placeholder="Describe the issue…"
          className={`${fieldClass} resize-none`} style={fieldStyle} />
        <p className="text-xs text-right mt-1" style={{ color: '#B8B5B0' }}>{form.description.length}/500</p>
      </div>

      {/* Mismatch flag note */}
      {aiData?.match === false && (
        <p className="text-xs px-3 py-2" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '6px' }}>
          This report will be flagged for officer review due to category mismatch — you can still submit.
        </p>
      )}

      {(!form.issueType || !form.departmentId || !form.description.trim()) && (
        <p className="text-xs px-3 py-2" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '6px' }}>
          Issue type, department, and description are required before continuing.
        </p>
      )}

      <button
        onClick={() => onConfirm({ ...form, aiSuggested: aiData, hasMismatch: aiData?.match === false })}
        disabled={!form.issueType || !form.departmentId || !form.description.trim()}
        className="w-full text-white py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        Confirm &amp; Set Location →
      </button>
    </div>
  );
}
