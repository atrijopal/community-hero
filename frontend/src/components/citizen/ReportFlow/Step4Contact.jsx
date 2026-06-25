import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function Step4Contact({ onNext }) {
  const { user } = useAuth();
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">📬 Contact Details</h2>
        <p className="text-sm text-gray-500">We'll notify you when your ticket is assigned and resolved</p>
      </div>

      {user ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
            {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : '👤'}
          </div>
          <div>
            <p className="font-medium text-green-800">{user.displayName || 'Signed In'}</p>
            <p className="text-sm text-green-600">{user.email}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!skip && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number <span className="text-gray-400">(optional)</span>
              </label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500">+91</span>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 border border-gray-300 rounded-r-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">We'll send updates via WhatsApp (Twilio sandbox)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
          <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} className="w-4 h-4 accent-blue-600" />
          <span className="text-sm text-gray-600">Submit anonymously — don't share any contact info</span>
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition"
        >
          Continue to Submit →
        </button>
      </form>
    </div>
  );
}
