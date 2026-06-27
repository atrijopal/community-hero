import { useState, useEffect } from 'react';
import { IconSparkles, IconCircleCheck, IconAlertTriangle, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { ISSUE_TYPES, DEPARTMENTS } from '../../../utils/constants';
import { useTranslateMap } from '../../../hooks/useTranslate';

const STRINGS = {
  reviewTitle:      'AI Review & Confirm',
  fillTitle:        'Fill in Details',
  reviewSub:        'Review AI suggestions — every field is editable',
  fillSub:          'AI is unavailable — fill in the fields below manually',
  aiFailedTitle:    'AI classification failed',
  aiFailedSub:      'Could not reach the AI service (quota or network issue). Please fill in the fields below manually — your report will still be submitted.',
  photoMatches:     'Photo matches — looks like',
  confidence:       'confidence',
  reviewBelow:      'Review and confirm the AI-filled fields below.',
  possibleMismatch: 'Possible mismatch — photo appears to show',
  notCategory:      'not',
  submitAsIs:       'You can still submit as-is, or recategorize so officers route it correctly.',
  recategorize:     'Recategorize',
  continueFlag:     'or continue and flag for officer review',
  aiConfidence:     'AI Confidence',
  high:             'High',
  medium:           'Medium',
  low:              'Low',
  lowConfWarn:      'Low confidence — please review all fields carefully before submitting.',
  issueType:        'Issue Type',
  selectType:       'Select type…',
  severity:         'Severity',
  minor:            'Minor',
  moderate:         'Moderate',
  critical:         'Critical',
  criticalNote:     'Critical severity — this ticket will be fast-tracked to a senior officer.',
  dangerLevel:      'Danger Level',
  safe:             'Safe',
  department:       'Department',
  selectDept:       'Select department…',
  description:      'Description',
  descPlaceholder:  'Describe the issue…',
  mismatchNote:     'This report will be flagged for officer review due to category mismatch — you can still submit.',
  requiredFields:   'Issue type, department, and description are required before continuing.',
  confirmBtn:       'Confirm & Set Location →',
  aiBadge:          'AI',
};

const fieldClass = 'w-full border px-3 py-2.5 text-sm transition-colors';
const fieldStyle = { borderColor: '#E5E2DE', borderRadius: '6px', color: '#4A4A48' };

// Map severity 1-10 → danger level when AI doesn't provide one
function deriveDangerLevel(sev) {
  if (sev >= 9) return 'critical';
  if (sev >= 6) return 'moderate';
  return 'safe';
}

function makeForm(aiData) {
  const sev = aiData?.severity || 5;
  return {
    issueType:    aiData?.issueType    || '',
    category:     aiData?.category     || 'Infrastructure',
    severity:     sev,
    dangerLevel:  aiData?.dangerLevel  || deriveDangerLevel(sev),
    departmentId: aiData?.departmentId || '',
    description:  aiData?.description  || '',
  };
}

export default function Step2AIReview({ aiData, aiError, onConfirm, onRecategorize }) {
  const tr = useTranslateMap(STRINGS);

  const [form, setForm] = useState(() => makeForm(aiData));
  const [edited, setEdited] = useState({});

  // Resync if aiData prop reference changes (e.g. parent re-fetches)
  useEffect(() => {
    setForm(makeForm(aiData));
    setEdited({});
  }, [aiData]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setEdited(e => ({ ...e, [field]: true }));
  };

  // When severity slider moves, auto-update dangerLevel unless user already overrode it
  const handleSeverityChange = (val) => {
    const intVal = parseInt(val);
    setForm(f => ({
      ...f,
      severity:    intVal,
      dangerLevel: edited.dangerLevel ? f.dangerLevel : deriveDangerLevel(intVal),
    }));
    setEdited(e => ({ ...e, severity: true }));
  };

  const AIBadge = () => (
    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5"
      style={{ backgroundColor: '#EDE9F8', color: '#6B50B8', borderRadius: '4px' }}>
      <IconSparkles size={10} stroke={2} />◆ {tr.aiBadge}
    </span>
  );

  const sevColor = form.severity >= 9 ? '#C13B2A' : form.severity >= 4 ? '#D4730A' : '#1A7A4A';
  const confLabel = (c) => c >= 80 ? tr.high : c >= 50 ? tr.medium : tr.low;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-0.5" style={{ color: '#4A4A48' }}>
          {aiError ? tr.fillTitle : tr.reviewTitle}
        </h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>
          {aiError ? tr.fillSub : tr.reviewSub}
        </p>
      </div>

      {aiError ? (
        <div className="flex items-start gap-3 p-3.5 border" style={{ backgroundColor: '#FFF8E0', borderColor: '#F5D56A', borderRadius: '8px' }}>
          <IconWifiOff size={18} stroke={1.5} style={{ color: '#D4730A', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#8B6600' }}>{tr.aiFailedTitle}</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr.aiFailedSub}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Match/mismatch banner */}
          {aiData?.match !== undefined && aiData?.match !== null && (
            aiData.match ? (
              <div className="flex items-start gap-3 p-3.5 border" style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '8px' }}>
                <IconCircleCheck size={18} stroke={1.5} style={{ color: '#1A7A4A', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A7A4A' }}>
                    {tr.photoMatches} {aiData?.detectedType?.replace(/_/g, ' ')} ({aiData?.matchConfidence}% {tr.confidence})
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr.reviewBelow}</p>
                </div>
              </div>
            ) : (
              <div className="border" style={{ backgroundColor: '#FFF8E0', borderColor: '#F5D56A', borderRadius: '8px', overflow: 'hidden' }}>
                <div className="flex items-start gap-3 p-3.5">
                  <IconAlertTriangle size={18} stroke={1.5} style={{ color: '#D4730A', flexShrink: 0, marginTop: 1 }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#8B6600' }}>
                      {tr.possibleMismatch} <em>{aiData?.detectedType?.replace(/_/g, ' ')}</em>
                      {aiData?.declaredCategory ? `, ${tr.notCategory} ${aiData.declaredCategory.replace(/_/g, ' ')}` : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr.submitAsIs}</p>
                  </div>
                </div>
                {onRecategorize && (
                  <div className="px-3.5 pb-3 flex gap-2">
                    <button
                      onClick={onRecategorize}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-opacity hover:opacity-80"
                      style={{ borderColor: '#D4730A', color: '#8B6600', backgroundColor: 'white', borderRadius: '6px' }}
                    >
                      <IconRefresh size={12} stroke={1.5} /> {tr.recategorize}
                    </button>
                    <span className="text-xs self-center" style={{ color: '#B8B5B0' }}>{tr.continueFlag}</span>
                  </div>
                )}
              </div>
            )
          )}

          {/* Confidence bar */}
          {aiData?.confidence > 0 && (() => {
            const c       = aiData.confidence;
            const color   = c >= 80 ? '#1A7A4A' : c >= 50 ? '#D4730A' : '#C13B2A';
            const bgColor = c >= 80 ? '#EBF5EF' : c >= 50 ? '#FEF3E7' : '#FDF1EF';
            return (
              <div className="p-4 border" style={{ backgroundColor: bgColor, borderColor: '#E5E2DE', borderRadius: '8px' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#6B50B8' }}>
                    <IconSparkles size={14} stroke={2} /> {tr.aiConfidence}
                  </span>
                  <span className="text-sm font-bold" style={{ color }}>{c}% — {confLabel(c)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E2DE' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${c}%`, backgroundColor: color }} />
                </div>
                {aiData.reasoning && <p className="text-xs mt-2" style={{ color: '#7A7875' }}>{aiData.reasoning}</p>}
                {c < 50 && (
                  <p className="text-xs mt-2 px-2 py-1.5 border-l-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderColor: '#C13B2A', borderRadius: '4px' }}>
                    {tr.lowConfWarn}
                  </p>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          {tr.issueType} {!edited.issueType && <AIBadge />}
        </label>
        <select value={form.issueType} onChange={e => set('issueType', e.target.value)} className={fieldClass} style={fieldStyle}>
          <option value="">{tr.selectType}</option>
          {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label.replace(/^\p{Emoji}\s*/u, '')}</option>)}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>
          {tr.severity}: <span style={{ color: sevColor }}>{form.severity}/10</span>
          {!edited.severity && <AIBadge />}
        </label>
        <input type="range" min="1" max="10" value={form.severity}
          onChange={e => handleSeverityChange(e.target.value)}
          className="w-full" style={{ accentColor: sevColor }} />
        <div className="flex justify-between text-xs mt-1" style={{ color: '#B8B5B0' }}>
          <span>1 — {tr.minor}</span><span>5 — {tr.moderate}</span><span>10 — {tr.critical}</span>
        </div>
        {form.severity >= 9 && (
          <p className="mt-2 text-xs px-3 py-2 border-l-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderColor: '#C13B2A', borderRadius: '4px' }}>
            {tr.criticalNote}
          </p>
        )}
      </div>

      {/* Danger Level */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>
          {tr.dangerLevel} {!edited.dangerLevel && <AIBadge />}
        </label>
        <div className="flex gap-2">
          {[
            { val: 'safe',     color: '#1A7A4A', bg: '#EBF5EF', labelKey: 'safe' },
            { val: 'moderate', color: '#D4730A', bg: '#FEF3E7', labelKey: 'moderate' },
            { val: 'critical', color: '#C13B2A', bg: '#FDF1EF', labelKey: 'critical' },
          ].map(({ val, color, bg, labelKey }) => (
            <label key={val} className="flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer text-sm font-medium border transition-colors"
              style={{
                borderRadius:    '6px',
                borderColor:     form.dangerLevel === val ? color : '#E5E2DE',
                backgroundColor: form.dangerLevel === val ? bg : 'white',
                color:           form.dangerLevel === val ? color : '#7A7875',
              }}>
              <input type="radio" value={val} checked={form.dangerLevel === val}
                onChange={() => set('dangerLevel', val)} className="sr-only" />
              {tr[labelKey]}
            </label>
          ))}
        </div>
      </div>

      {/* Department */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          {tr.department} {!edited.departmentId && <AIBadge />}
        </label>
        <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className={fieldClass} style={fieldStyle}>
          <option value="">{tr.selectDept}</option>
          {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          {tr.description} {!edited.description && <AIBadge />}
        </label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} maxLength={500} placeholder={tr.descPlaceholder}
          className={`${fieldClass} resize-none`} style={fieldStyle} />
        <p className="text-xs text-right mt-1" style={{ color: '#B8B5B0' }}>{form.description.length}/500</p>
      </div>

      {aiData?.match === false && (
        <p className="text-xs px-3 py-2" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '6px' }}>
          {tr.mismatchNote}
        </p>
      )}

      {(!form.issueType || !form.departmentId || !form.description.trim()) && (
        <p className="text-xs px-3 py-2" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '6px' }}>
          {tr.requiredFields}
        </p>
      )}

      <button
        onClick={() => onConfirm({ ...form, aiSuggested: aiData, hasMismatch: aiData?.match === false })}
        disabled={!form.issueType || !form.departmentId || !form.description.trim()}
        className="w-full text-white py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        {tr.confirmBtn}
      </button>
    </div>
  );
}
