import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useT } from '../utils/translations';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { lang } = useLanguage();
  const tr = useT(lang);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      navigate('/citizen');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdTokenResult();
      if (token.claims.admin)        navigate('/admin');
      else if (token.claims.officer) navigate('/officer');
      else                           navigate('/citizen');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid #E5E2DE',
    borderRadius: '6px',
    color: '#4A4A48',
    backgroundColor: '#FFFFFF',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="bg-white w-full max-w-md p-8 border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#FDF1EF' }}>
            <span className="text-2xl font-bold" style={{ color: '#C13B2A' }}>CH</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Community Hero</h1>
          <p className="text-sm mt-1" style={{ color: '#7A7875' }}>{tr.loginTitle}</p>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-sm font-medium border transition-colors mb-5 disabled:opacity-50"
          style={{ borderColor: '#E5E2DE', borderRadius: '6px', color: '#4A4A48', backgroundColor: '#FAFAF9' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#C13B2A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E2DE'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {tr.googleLogin}
        </button>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid #E5E2DE' }} />
          </div>
          <div className="relative text-center">
            <span className="bg-white px-4 text-xs" style={{ color: '#B8B5B0' }}>{tr.officerAdminLogin}</span>
          </div>
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
              {tr.email}
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="officer@kmc.gov.in"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#C13B2A'}
              onBlur={e => e.target.style.borderColor = '#E5E2DE'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
              {tr.password}
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#C13B2A'}
              onBlur={e => e.target.style.borderColor = '#E5E2DE'}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full text-white py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
          >
            {loading ? tr.signingIn : tr.signInBtn}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/" className="text-sm transition-colors" style={{ color: '#7A7875' }}
            onMouseEnter={e => e.target.style.color = '#C13B2A'}
            onMouseLeave={e => e.target.style.color = '#7A7875'}>
            {tr.backHome}
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 p-3 text-xs" style={{ backgroundColor: '#F5F3F0', borderRadius: '6px', color: '#7A7875' }}>
          <p className="font-semibold mb-1.5 uppercase tracking-wider text-xs" style={{ color: '#4A4A48' }}>{tr.demoCredentials}</p>
          <p>Admin: admin@kmc.gov.in / Admin@123</p>
          <p>Officer: rajesh.kumar@kmc.gov.in / Officer@123</p>
          <p style={{ color: '#B8B5B0' }}>Citizen: Use Google Sign-In above</p>
        </div>
      </div>
    </div>
  );
}
