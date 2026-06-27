import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslateMap } from '../../../hooks/useTranslate';

const STRINGS = {
  title:         'Contact Details',
  subtitle:      "We'll notify you when your ticket is assigned and resolved",
  whatsapp:      'WhatsApp Number',
  optional:      '(optional)',
  whatsappNote:  "We'll send updates via WhatsApp (Twilio sandbox)",
  email:         'Email',
  emailPh:       'you@example.com',
  anonymous:     "Submit anonymously — don't share any contact info",
  continueBtn:   'Continue to Submit →',
};

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none' };

export default function Step4Contact({ onNext }) {
  const { user } = useAuth();
  const tr       = useTranslateMap(STRINGS);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [skip, setSkip]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(skip ? {} : { phone, email });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>{tr.title}</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>{tr.subtitle}</p>
      </div>

      {user && (
        <div className="border p-4 flex items-center gap-3" style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '8px' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: '#C9E8D9' }}>
            {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : (
              <span className="text-base font-bold" style={{ color: '#1A7A4A' }}>{(user.displayName?.[0] || 'C').toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-medium" style={{ color: '#1A7A4A' }}>{user.displayName}</p>
            <p className="text-sm" style={{ color: '#2D8A5A' }}>{user.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!skip && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A48' }}>
                {tr.whatsapp} <span style={{ color: '#B8B5B0' }}>{tr.optional}</span>
              </label>
              <div className="flex">
                <span className="flex items-center px-3 border border-r-0 text-sm shrink-0"
                  style={{ backgroundColor: '#F5F3F0', borderColor: '#E5E2DE', borderRadius: '6px 0 0 6px', color: '#7A7875' }}>+91</span>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  style={{ ...inputStyle, borderRadius: '0 6px 6px 0' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>{tr.whatsappNote}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A48' }}>
                {tr.email} <span style={{ color: '#B8B5B0' }}>{tr.optional}</span>
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tr.emailPh} style={inputStyle} />
            </div>
          </>
        )}

        <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white transition" style={{ borderRadius: '6px' }}>
          <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)}
            className="w-4 h-4" style={{ accentColor: '#C13B2A' }} />
          <span className="text-sm" style={{ color: '#4A4A48' }}>{tr.anonymous}</span>
        </label>

        <button
          type="submit"
          className="w-full py-3.5 font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
        >
          {tr.continueBtn}
        </button>
      </form>
    </div>
  );
}
