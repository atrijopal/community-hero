import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useT } from '../../utils/translations';
import LanguageSelector from './LanguageSelector';
import toast from 'react-hot-toast';

const ROLE_LABELS = { citizen: '🏘️ Citizen', officer: '👮 Officer', admin: '⚡ Admin', senior_officer: '🎖️ Sr. Officer' };

export default function Navbar() {
  const { user, userRole } = useAuth();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    toast.success(tr.signOut);
  };

  const ROLE_LINKS = {
    citizen: [
      { to: '/citizen',             label: tr.home },
      { to: '/citizen/report',      label: tr.reportIssue },
      { to: '/citizen/tickets',     label: tr.myTickets },
      { to: '/citizen/map',         label: tr.map },
      { to: '/citizen/leaderboard', label: tr.leaderboard },
      { to: '/citizen/profile',     label: tr.profile },
    ],
    officer: [
      { to: '/officer',             label: tr.home },
      { to: '/officer/queue',       label: tr.myTickets },
      { to: '/officer/queries',     label: 'Queries' },
      { to: '/officer/performance', label: 'Performance' },
    ],
    admin: [
      { to: '/admin',               label: 'Overview' },
      { to: '/admin/unassigned',    label: 'Assign' },
      { to: '/admin/tickets',       label: 'All Tickets' },
      { to: '/admin/staff',         label: 'Staff' },
      { to: '/admin/map',           label: tr.map },
      { to: '/admin/reports',       label: 'Reports' },
      { to: '/admin/predictions',   label: 'AI Predictions' },
    ],
  };

  const links = ROLE_LINKS[userRole] || [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
        <Link to="/" className="font-bold text-lg shrink-0" style={{ color: '#C13B2A' }}>🏛️ Community Hero</Link>
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {links.map(l => (
            <Link
              key={l.to} to={l.to}
              className="text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition"
              style={{ color: '#7A7875' }}
              onMouseEnter={e => { e.target.style.color = '#C13B2A'; e.target.style.backgroundColor = '#FDF1EF'; }}
              onMouseLeave={e => { e.target.style.color = '#7A7875'; e.target.style.backgroundColor = 'transparent'; }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSelector />
          {user ? (
            <>
              <span className="text-xs text-gray-500 hidden md:block">{ROLE_LABELS[userRole]}</span>
              <button
                onClick={handleLogout}
                className="text-sm border px-3 py-1.5 rounded-lg transition"
                style={{ color: '#7A7875', borderColor: '#E5E2DE' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C13B2A'; e.currentTarget.style.borderColor = '#C13B2A'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7875'; e.currentTarget.style.borderColor = '#E5E2DE'; }}
              >
                {tr.signOut}
              </button>
            </>
          ) : (
            <Link to="/login"
              className="text-sm text-white px-4 py-1.5 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#C13B2A' }}>
              {tr.signIn}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
