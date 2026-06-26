import { useState, useEffect } from 'react';
import { IconRobot, IconPlayerPlay, IconRefresh, IconCheck, IconX, IconChevronDown, IconChevronUp, IconScale, IconAlertTriangle } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { db } from '../../firebase';
import { collection, onSnapshot, query, limit, where, getDocs } from 'firebase/firestore';

const STEP_ICONS = { classify: '🔍', find_officer: '👤', assign: '✅', sla: '⏱' };
const STEP_LABELS = { classify: 'Classify Issue', find_officer: 'Find Officer', assign: 'Auto-Assign', sla: 'Set SLA' };

function StepBadge({ step }) {
  const ok = step.decision && !step.decision.toString().includes('SKIPPED') && !step.decision.toString().includes('none');
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-b-0" style={{ borderColor: '#F0EDE9' }}>
      <span className="text-sm mt-0.5">{STEP_ICONS[step.step] || '•'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: '#4A4A48' }}>{STEP_LABELS[step.step] || step.step}</span>
          <span className="text-xs px-1.5 py-0.5 font-medium" style={{
            borderRadius: 3,
            backgroundColor: ok ? '#E8F5EE' : '#FEF3E7',
            color: ok ? '#1A7A4A' : '#D4730A',
          }}>
            {String(step.decision).length > 40 ? String(step.decision).substring(0, 40) + '…' : step.decision}
          </span>
          {step.confidence && <span className="text-xs" style={{ color: '#B8B5B0' }}>{step.confidence}% conf.</span>}
        </div>
        {step.reasoning && (
          <p className="text-xs" style={{ color: '#7A7875' }}>{step.reasoning}</p>
        )}
        {step.candidates && step.candidates.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>
            Candidates: {step.candidates.map(c => `${c.name} (${c.load})`).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function AgentLogCard({ log }) {
  const [open, setOpen] = useState(false);
  const isSuccess = log.success;
  const time = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="border" style={{ borderColor: '#E5E2DE', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: isSuccess ? '#E8F5EE' : '#FDF1EF' }}>
            {isSuccess
              ? <IconCheck size={14} stroke={2.5} style={{ color: '#1A7A4A' }} />
              : <IconX size={14} stroke={2.5} style={{ color: '#C13B2A' }} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-1.5 py-0.5 text-white" style={{ backgroundColor: '#6B50B8', borderRadius: 3 }}>
                {log.type}
              </span>
              <span className="font-mono text-sm font-semibold" style={{ color: '#C13B2A' }}>{log.publicId}</span>
              {log.assignedOfficerName && (
                <span className="text-xs" style={{ color: '#1A7A4A' }}>→ {log.assignedOfficerName}</span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{time}</p>
          </div>
        </div>
        {open
          ? <IconChevronUp size={16} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0 }} />
          : <IconChevronDown size={16} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0 }} />}
      </button>

      {open && log.steps?.length > 0 && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: '#F0EDE9', backgroundColor: '#FAFAF9' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mt-3 mb-2" style={{ color: '#B8B5B0' }}>Decision Chain</p>
          {log.steps.map((s, i) => <StepBadge key={i} step={s} />)}
          {log.error && (
            <p className="text-xs mt-2 px-2 py-1.5" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderRadius: 4 }}>
              Error: {log.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RunButton({ label, icon: Icon, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: color, borderRadius: '6px' }}
    >
      {loading ? <IconRefresh size={15} stroke={2} className="animate-spin" /> : <Icon size={15} stroke={2} />}
      {loading ? 'Running…' : label}
    </button>
  );
}

const SLA_ACTION_LABELS = {
  RTI_GENERATED:         { label: 'RTI Filed by AI',      color: '#C13B2A', icon: '📄' },
  FIRST_APPEAL_GENERATED:{ label: 'Appeal Generated',     color: '#C13B2A', icon: '⚖️' },
  AUTO_ESCALATED:        { label: 'Auto-Escalated',       color: '#D4730A', icon: '🚨' },
  GHOST_REOPEN:          { label: 'Ghost Re-opened',      color: '#8B1A1A', icon: '👻' },
};

function SLALogCard({ log }) {
  const meta = SLA_ACTION_LABELS[log.action] || { label: log.action, color: '#4A4A48', icon: '•' };
  const time = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className="flex items-center gap-3 px-4 py-3 border bg-white" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
        style={{ backgroundColor: '#FDF1EF' }}>{meta.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-1.5 py-0.5 text-white" style={{ backgroundColor: meta.color, borderRadius: 3 }}>
            SLA
          </span>
          <span className="text-xs font-semibold" style={{ color: '#4A4A48' }}>{meta.label}</span>
          {log.ticketId && <span className="font-mono text-xs" style={{ color: '#C13B2A' }}>{log.ticketId}</span>}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{time}</p>
      </div>
    </div>
  );
}

export default function AgentsPanel() {
  const [logs, setLogs]           = useState([]);
  const [slaLogs, setSlaLogs]     = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [slaRunning, setSlaRunning]   = useState(false);
  const [triageRunning, setTriageRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [rtiCount, setRtiCount]   = useState(0);
  const [appealCount, setAppealCount] = useState(0);

  // Triage agent logs (agent_logs collection)
  useEffect(() => {
    const q = query(collection(db, 'agent_logs'), limit(50));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      setLogs(data);
      setLogsLoading(false);
    }, () => setLogsLoading(false));
  }, []);

  // SLA agent logs (ticket_logs with SLA actions)
  useEffect(() => {
    const slaActions = ['RTI_GENERATED', 'FIRST_APPEAL_GENERATED', 'AUTO_ESCALATED', 'GHOST_REOPEN'];
    const q = query(collection(db, 'ticket_logs'), limit(100));
    return onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(l => slaActions.includes(l.action))
        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      setSlaLogs(data);
    });
  }, []);

  // Count RTI_FILED and appeal tickets
  useEffect(() => {
    getDocs(query(collection(db, 'tickets'), where('status', '==', 'RTI_FILED')))
      .then(s => setRtiCount(s.size)).catch(() => {});
    getDocs(query(collection(db, 'tickets'), where('appealGenerated', '==', true)))
      .then(s => setAppealCount(s.size)).catch(() => {});
  }, [lastResult]); // re-count after any run

  const runSLACheck = async () => {
    setSlaRunning(true);
    try {
      const res = await api.post('/agents/sla-check');
      toast.success('SLA check complete — RTI/escalations processed');
      setLastResult({ type: 'SLA Check', message: res.data.message, time: new Date().toLocaleTimeString() });
    } catch (err) {
      toast.error(err.response?.data?.error || 'SLA check failed');
    } finally { setSlaRunning(false); }
  };

  const runTriage = async () => {
    setTriageRunning(true);
    try {
      const res = await api.post('/agents/triage');
      toast.success(`Triage complete — ${res.data.processed} tickets processed`);
      setLastResult({ type: 'Auto-Triage', processed: res.data.processed, results: res.data.results, time: new Date().toLocaleTimeString() });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Triage failed');
    } finally { setTriageRunning(false); }
  };

  const triagedCount  = logs.filter(l => l.type === 'TRIAGE').length;
  const successCount  = logs.filter(l => l.success).length;
  const allActivity   = logs.length + slaLogs.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconRobot size={22} stroke={1.5} style={{ color: '#6B50B8' }} />
            <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Autonomous Agents</h1>
          </div>
          <p className="text-sm" style={{ color: '#7A7875' }}>
            AI agents that classify, assign, escalate, and file RTI/appeals autonomously. Click to run manually for demo.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Auto-Triaged',   value: triagedCount,  color: '#6B50B8' },
            { label: 'RTI Filed',      value: rtiCount,       color: '#C13B2A' },
            { label: 'Appeals Filed',  value: appealCount,    color: '#D4730A' },
            { label: 'Total Events',   value: allActivity,    color: '#4A4A48' },
          ].map(s => (
            <div key={s.label} className="bg-white border p-4 text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Triage Agent */}
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <h2 className="font-semibold" style={{ color: '#4A4A48' }}>Triage Agent</h2>
              <span className="text-xs px-2 py-0.5 font-medium" style={{ backgroundColor: '#EDE9F8', color: '#6B50B8', borderRadius: '4px' }}>AUTO</span>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7A7875' }}>
              Runs after every new submission: classifies issue → load-balances officers → auto-assigns → logs reasoning chain.
            </p>
            <div className="space-y-1 text-xs mb-4" style={{ color: '#7A7875' }}>
              {['🔍 AI classifies issue type and severity', '👤 Finds least-loaded officer in department', '✅ Auto-assigns with reasoning', '⏱ Confirms SLA deadline'].map(s => (
                <p key={s}>{s}</p>
              ))}
            </div>
            <RunButton label="Run on Unassigned Tickets" icon={IconPlayerPlay} color="#6B50B8" onClick={runTriage} loading={triageRunning} />
          </div>

          {/* SLA / RTI / Appeal Agent */}
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚖️</span>
              <h2 className="font-semibold" style={{ color: '#4A4A48' }}>SLA → RTI → Appeal Agent</h2>
              <span className="text-xs px-2 py-0.5 font-medium" style={{ backgroundColor: '#FEF3E7', color: '#D4730A', borderRadius: '4px' }}>CRON</span>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7A7875' }}>
              Autonomous escalation pipeline — triggers at 7d reminder, 14d escalation, 30d RTI, 60d first appeal. Uses Gemini to generate RTI text.
            </p>
            <div className="space-y-1 text-xs mb-4" style={{ color: '#7A7875' }}>
              {['📅 Day 7: Officer reminder notification', '🚨 Day 14: Auto-escalate status', '📄 Day 30: AI generates RTI filing', '⚖️ Day 60: First appeal letter'].map(s => (
                <p key={s}>{s}</p>
              ))}
            </div>
            <div className="p-2.5 mb-4 text-xs" style={{ backgroundColor: '#FEF3E7', borderRadius: '6px', color: '#8B6600' }}>
              Demo: Seeds include a 31-day and 62-day ticket — run SLA check to see RTI + appeal fire live.
            </div>
            <RunButton label="Run SLA Check Now" icon={IconPlayerPlay} color="#D4730A" onClick={runSLACheck} loading={slaRunning} />
          </div>
        </div>

        {/* Last result */}
        {lastResult && (
          <div className="bg-white border p-4" style={{ borderColor: '#1A7A4A', borderRadius: '8px', borderLeftWidth: 4 }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1A7A4A' }}>
              ✓ {lastResult.type} completed at {lastResult.time}
            </p>
            {lastResult.message && <p className="text-sm" style={{ color: '#4A4A48' }}>{lastResult.message}</p>}
            {lastResult.results && (
              <div className="mt-2 space-y-1">
                {lastResult.results.map((r, i) => (
                  <p key={i} className="text-xs" style={{ color: '#7A7875' }}>
                    {r.publicId} → {r.assigned ? `Assigned to ${r.assigned}` : 'No officer available'}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live activity log */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#4A4A48' }}>
            Live Agent Activity Log
            <span className="ml-2 font-normal" style={{ color: '#B8B5B0' }}>— updates in real time</span>
          </h2>
          {logsLoading ? (
            <LoadingSpinner />
          ) : (logs.length === 0 && slaLogs.length === 0) ? (
            <div className="text-center py-12 border bg-white" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
              <p className="text-3xl mb-3">🤖</p>
              <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>No agent activity yet</p>
              <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>Submit a ticket or click Run above to see agents in action</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* SLA events first (most impactful) */}
              {slaLogs.map(log => <SLALogCard key={log.id} log={log} />)}
              {/* Triage agent chains */}
              {logs.map(log => <AgentLogCard key={log.id} log={log} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
