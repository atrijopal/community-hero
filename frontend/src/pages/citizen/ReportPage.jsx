import { useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import Step1Photo from '../../components/citizen/ReportFlow/Step1Photo';
import Step2AIReview from '../../components/citizen/ReportFlow/Step2AIReview';
import Step3Location from '../../components/citizen/ReportFlow/Step3Location';
import Step4Contact from '../../components/citizen/ReportFlow/Step4Contact';
import Step5Submit from '../../components/citizen/ReportFlow/Step5Submit';
import api from '../../utils/api';

const STEPS = ['Photo', 'AI Review', 'Location', 'Contact', 'Submit'];

export default function ReportPage() {
  const [step, setStep]       = useState(0);
  const [photo, setPhoto]     = useState(null);
  const [aiData, setAiData]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [location, setLocation] = useState(null);
  const [contact, setContact]   = useState(null);

  const handlePhotoNext = async (file) => {
    setPhoto(file);
    setStep(1);
    setAiLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('city', 'Kolkata');
      const res = await api.post('/ai/classify', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAiData(res.data);
    } catch {
      setAiData({ issueType: '', category: 'Infrastructure', severity: 5, dangerLevel: 'moderate', departmentId: '', description: '', confidence: 0 });
    } finally {
      setAiLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setPhoto(null); setAiData(null); setFormData(null);
    setLocation(null); setContact(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {step === 0 && <Step1Photo onNext={handlePhotoNext} />}
          {step === 1 && (
            <Step2AIReview
              aiData={aiData}
              loading={aiLoading}
              onConfirm={(data) => { setFormData({ ...data, aiSuggested: aiData }); setStep(2); }}
            />
          )}
          {step === 2 && <Step3Location onNext={(loc) => { setLocation(loc); setStep(3); }} />}
          {step === 3 && <Step4Contact onNext={(c) => { setContact(c); setStep(4); }} />}
          {step === 4 && (
            <Step5Submit
              photo={photo} formData={formData} location={location} contact={contact}
              onReset={reset}
            />
          )}
        </div>

        {step > 0 && step < 4 && (
          <button onClick={() => setStep(s => s - 1)} className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
