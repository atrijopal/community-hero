import { useState } from 'react';
import { ISSUE_TYPES, DEPARTMENTS } from '../../../utils/constants';

const AIBadge = () => (
  <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">◆ AI</span>
);

const ConfidenceBar = ({ confidence, reasoning }) => {
  const color = confidence >= 80 ? 'bg-green-500' : confidence >= 50 ? 'bg-blue-500' : 'bg-yellow-400';
  const label = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">◆ AI Confidence</span>
        <span className="text-sm font-bold text-gray-900">{confidence}% ({label})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${confidence}%` }} />
      </div>
      {reasoning && <p className="text-xs text-gray-500">{reasoning}</p>}
      {confidence < 50 && (
        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2 py-1 mt-2">
          ⚠️ Low confidence — please review all fields carefully before submitting.
        </p>
      )}
    </div>
  );
};

export default function Step2AIReview({ aiData, onConfirm, loading }) {
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">AI is analyzing your photo...</p>
        <p className="text-gray-400 text-sm mt-1">This takes 3–5 seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">🤖 AI Review & Confirm</h2>
        <p className="text-sm text-gray-500">Review the AI suggestions — every field is editable</p>
      </div>

      {aiData?.confidence !== undefined && (
        <ConfidenceBar confidence={aiData.confidence} reasoning={aiData.reasoning} />
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type {!edited.issueType && <AIBadge />}
        </label>
        <select
          value={form.issueType}
          onChange={e => set('issueType', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select type...</option>
          {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity: <strong>{form.severity}/10</strong> {!edited.severity && <AIBadge />}
        </label>
        <input
          type="range" min="1" max="10" value={form.severity}
          onChange={e => set('severity', parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 — Minor</span><span>5 — Moderate</span><span>10 — Critical</span>
        </div>
        {form.severity >= 9 && (
          <p className="mt-2 text-xs bg-red-50 text-red-700 border border-red-100 rounded-lg px-3 py-2">
            ⚠️ Critical severity — this ticket will be fast-tracked to a senior officer.
          </p>
        )}
      </div>

      {/* Danger Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danger Level {!edited.dangerLevel && <AIBadge />}
        </label>
        <div className="flex gap-3">
          {['safe', 'moderate', 'critical'].map(level => (
            <label key={level} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer transition text-sm font-medium ${
              form.dangerLevel === level
                ? level === 'safe' ? 'border-green-500 bg-green-50 text-green-700'
                  : level === 'critical' ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
              <input type="radio" value={level} checked={form.dangerLevel === level}
                onChange={() => set('dangerLevel', level)} className="sr-only" />
              {level === 'safe' ? '🟢' : level === 'critical' ? '🔴' : '🟡'} {level.charAt(0).toUpperCase() + level.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department {!edited.departmentId && <AIBadge />}
        </label>
        <select
          value={form.departmentId}
          onChange={e => set('departmentId', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select department...</option>
          {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description {!edited.description && <AIBadge />}
        </label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3} maxLength={500}
          placeholder="Describe the issue..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{form.description.length}/500</p>
      </div>

      <button
        onClick={() => onConfirm(form)}
        disabled={!form.issueType || !form.departmentId || !form.description}
        className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm & Set Location →
      </button>
    </div>
  );
}
