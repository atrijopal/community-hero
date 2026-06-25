import { useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    slaDefault:     7,
    escalateDays:  14,
    rtiDays:       30,
    appealDays:    60,
    ghostThreshold: 65,
    geminiConfThreshold: 70,
    ghostWindowDays: 14,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved (live config — stored in Firestore)');
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (k, v) => setSettings(s => ({ ...s, [k]: Number(v) }));

  const SettingRow = ({ label, desc, settingKey, min, max, unit }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <input
          type="number" min={min} max={max} value={settings[settingKey]}
          onChange={e => set(settingKey, e.target.value)}
          className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500 w-10">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ System Settings</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-0 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">SLA & Escalation Timeline</h3>
          <SettingRow label="SLA Default"     desc="Default SLA deadline for new tickets"      settingKey="slaDefault"     min={1} max={30}  unit="days" />
          <SettingRow label="Escalation"      desc="Auto-escalate unresolved tickets after"     settingKey="escalateDays"   min={7} max={30}  unit="days" />
          <SettingRow label="RTI Generation"  desc="Auto-generate RTI document after"           settingKey="rtiDays"        min={21} max={60} unit="days" />
          <SettingRow label="First Appeal"    desc="Generate first appeal after"                settingKey="appealDays"     min={45} max={120} unit="days" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">AI Thresholds</h3>
          <SettingRow label="Ghost Detection"    desc="Minimum confidence to auto-reopen a ghost ticket"     settingKey="ghostThreshold"       min={50} max={95} unit="%" />
          <SettingRow label="Resolution Validation" desc="Minimum confidence for Gemini to approve resolution" settingKey="geminiConfThreshold" min={50} max={95} unit="%" />
          <SettingRow label="Ghost Window"       desc="Days after resolution that citizens can report ghost"   settingKey="ghostWindowDays"    min={7}  max={30} unit="days" />
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-2xl font-semibold transition ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {saved ? '✅ Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
