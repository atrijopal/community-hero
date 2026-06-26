import { useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import Step0Category from '../../components/citizen/ReportFlow/Step0Category';
import Step1Photo    from '../../components/citizen/ReportFlow/Step1Photo';
import Step2AIReview from '../../components/citizen/ReportFlow/Step2AIReview';
import Step3Location from '../../components/citizen/ReportFlow/Step3Location';
import Step4Contact  from '../../components/citizen/ReportFlow/Step4Contact';
import Step5Submit   from '../../components/citizen/ReportFlow/Step5Submit';
import api from '../../utils/api';

const STEPS = ['Category', 'Photo', 'AI Review', 'Location', 'Contact', 'Submit'];

function AILoadingCard() {
  return (
    <div className="text-center py-14">
      <div className="w-14 h-14 border-2 rounded-full animate-spin mx-auto mb-5"
        style={{ borderColor: '#E5E2DE', borderTopColor: '#6B50B8' }} />
      <p className="font-semibold" style={{ color: '#4A4A48' }}>AI is analysing your photo…</p>
      <p className="text-sm mt-1" style={{ color: '#7A7875' }}>Classifying issue, estimating severity — 3–5 s</p>
      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs"
        style={{ color: '#6B50B8' }}>
        <IconSparkles size={13} stroke={1.5} />
        Powered by Gemini
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [step, setStep]           = useState(0);
  const [category, setCategory]   = useState(null);
  const [photo, setPhoto]         = useState(null);
  const [aiData, setAiData]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState(false);
  const [formData, setFormData]   = useState(null);
  const [location, setLocation]   = useState(null);
  const [contact, setContact]     = useState(null);

  const handlePhotoNext = async (file) => {
    setPhoto(file);
    setAiData(null);
    setAiError(false);
    setStep(2);
    setAiLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('city', 'Kolkata');
      if (category) fd.append('declaredCategory', category);
      const res = await api.post('/ai/verify', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Treat 0 confidence as a failed call (fallback object from server)
      if (!res.data.issueType && res.data.confidence === 0) {
        setAiError(true);
        setAiData({ issueType: '', category: category || 'Infrastructure', severity: 5, dangerLevel: 'moderate', departmentId: '', description: '', confidence: 0, declaredCategory: category });
      } else {
        setAiData({ ...res.data, declaredCategory: category });
      }
    } catch {
      setAiError(true);
      setAiData({ issueType: '', category: category || 'Infrastructure', severity: 5, dangerLevel: 'moderate', departmentId: '', description: '', confidence: 0, declaredCategory: category });
    } finally {
      setAiLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setCategory(null); setPhoto(null);
    setAiData(null); setFormData(null); setLocation(null); setContact(null);
  };

  // Back nav — not allowed while AI is loading
  const canGoBack = step > 0 && step < 5 && !(step === 2 && aiLoading);
  const goBack = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Progress stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition"
                  style={{
                    backgroundColor: i < step ? '#1A7A4A' : i === step ? '#C13B2A' : '#E5E2DE',
                    color: i <= step ? 'white' : '#7A7875',
                  }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:block"
                  style={{ color: i === step ? '#C13B2A' : '#B8B5B0', fontWeight: i === step ? 600 : 400 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 rounded-full" style={{ backgroundColor: '#E5E2DE' }}>
            <div className="h-1 rounded-full transition-all"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%`, backgroundColor: '#C13B2A' }} />
          </div>
        </div>

        {/* Step card */}
        <div className="bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          {/* Back button lives inside the card at the top so it's always reachable */}
          {canGoBack && (
            <div className="px-6 pt-4">
              <button onClick={goBack}
                className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
                style={{ color: '#7A7875' }}>
                ← Back
              </button>
            </div>
          )}

          <div className="p-6">
            {step === 0 && (
              <Step0Category onNext={(cat) => { setCategory(cat); setStep(1); }} />
            )}
            {step === 1 && (
              <Step1Photo onNext={handlePhotoNext} />
            )}
            {step === 2 && (
              aiLoading
                ? <AILoadingCard />
                : <Step2AIReview
                    aiData={aiData}
                    aiError={aiError}
                    onRecategorize={() => { setCategory(null); setAiData(null); setAiError(false); setStep(0); }}
                    onConfirm={(data) => { setFormData(data); setStep(3); }}
                  />
            )}
            {step === 3 && <Step3Location onNext={(loc) => { setLocation(loc); setStep(4); }} />}
            {step === 4 && <Step4Contact onNext={(c) => { setContact(c); setStep(5); }} />}
            {step === 5 && (
              <Step5Submit photo={photo} formData={formData} location={location} contact={contact} onReset={reset} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
