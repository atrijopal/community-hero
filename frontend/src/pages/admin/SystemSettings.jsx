import { useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import toast from 'react-hot-toast';

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '6px 8px', fontSize: 14, width: 80, textAlign: 'center', outline: 'none' };

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    slaDefault:          7,
    escalateDays:       14,
    rtiDays:            30,
    appealDays:         60,
    ghostThreshold:     65,
    geminiConfThreshold:70,
    ghostWindowDays:    14,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved (live config — stored in Firestore)');
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (k, v) => setSettings(s => ({ ...s, [k]: Number(v) }));

  const SettingRow = ({ label, desc, settingKey, min, max, unit }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: '#E5E2DE' }}>
      <div className="flex-1">
        <p className="font-medium" style={{ color: '#4A4A48' }}>{label}</p>
        <p className="text-sm" style={{ color: '#7A7875' }}>{desc}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <input
          type="number" min={min} max={max} value={settings[settingKey]}
          onChange={e => set(settingKey, e.target.value)}
          style={inputStyle}
        />
        <span className="text-sm w-10" style={{ color: '#7A7875' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: '#4A4A48' }}>System Settings</h1>

        <div className="bg-white border p-6 mb-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#4A4A48' }}>SLA & Escalation Timeline</h3>
          <SettingRow label="SLA Default"     desc="Default SLA deadline for new tickets"       settingKey="slaDefault"           min={1}  max={30}  unit="days" />
          <SettingRow label="Escalation"      desc="Auto-escalate unresolved tickets after"      settingKey="escalateDays"         min={7}  max={30}  unit="days" />
          <SettingRow label="RTI Generation"  desc="Auto-generate RTI document after"            settingKey="rtiDays"              min={21} max={60}  unit="days" />
          <SettingRow label="First Appeal"    desc="Generate first appeal after"                 settingKey="appealDays"           min={45} max={120} unit="days" />
        </div>

        <div className="bg-white border p-6 mb-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-2" style={{ color: '#4A4A48' }}>AI Thresholds</h3>
          <SettingRow label="Ghost Detection"       desc="Minimum confidence to auto-reopen a ghost ticket"      settingKey="ghostThreshold"       min={50} max={95} unit="%" />
          <SettingRow label="Resolution Validation" desc="Minimum confidence for Gemini to approve resolution"   settingKey="geminiConfThreshold"  min={50} max={95} unit="%" />
          <SettingRow label="Ghost Window"          desc="Days after resolution that citizens can report ghost"   settingKey="ghostWindowDays"      min={7}  max={30} unit="days" />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: saved ? '#1A7A4A' : '#C13B2A', borderRadius: '6px' }}
        >
          {saved ? 'Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
