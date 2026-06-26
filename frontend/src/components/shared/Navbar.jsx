import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconHome, IconPlus, IconTicket, IconMap, IconTrophy, IconUser,
  IconLayoutDashboard, IconInbox, IconMessageCircle, IconChartBar,
  IconUsers, IconSettings, IconBrain, IconMapPin, IconRobot, IconCopy,
  IconLogout, IconLogin,
} from '@tabler/icons-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useT } from '../../utils/translations';
import LanguageSelector from './LanguageSelector';
import toast from 'react-hot-toast';

const ROLE_LINKS = (tr) => ({
  citizen: [
    { to: '/citizen',             label: tr.home,        icon: IconHome },
    { to: '/citizen/report',      label: tr.reportIssue, icon: IconPlus },
    { to: '/citizen/tickets',     label: tr.myTickets,   icon: IconTicket },
    { to: '/citizen/map',         label: tr.map,         icon: IconMap },
    { to: '/citizen/leaderboard', label: tr.leaderboard, icon: IconTrophy },
    { to: '/citizen/profile',     label: tr.profile,     icon: IconUser },
  ],
  officer: [
    { to: '/officer',             label: 'Dashboard',    icon: IconLayoutDashboard },
    { to: '/officer/queue',       label: 'My Queue',     icon: IconInbox },
    { to: '/officer/queries',     label: 'Queries',      icon: IconMessageCircle },
    { to: '/officer/performance', label: 'Performance',  icon: IconChartBar },
  ],
  admin: [
    { to: '/admin',               label: 'Overview',     icon: IconLayoutDashboard },
    { to: '/admin/unassigned',    label: 'Assign',       icon: IconInbox },
    { to: '/admin/tickets',       label: 'All Tickets',  icon: IconTicket },
    { to: '/admin/staff',         label: 'Staff',        icon: IconUsers },
    { to: '/admin/map',           label: 'Ward Map',     icon: IconMapPin },
    { to: '/admin/reports',       label: 'Reports',      icon: IconChartBar },
    { to: '/admin/predictions',   label: 'AI Predictions', icon: IconBrain },
    { to: '/admin/agents',        label: 'Agents',       icon: IconRobot },
    { to: '/admin/duplicates',    label: 'Duplicates',   icon: IconCopy },
  ],
});

const ROLE_LABELS = {
  citizen:        'Citizen',
  officer:        'Officer',
  senior_officer: 'Sr. Officer',
  admin:          'Admin',
};

export default function Navbar() {
  const { user, userRole } = useAuth();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    toast.success(tr.signOut);
  };

  const links = ROLE_LINKS(tr)[userRole] || [];

  return (
    <nav className="bg-surface border-b sticky top-0 z-50" style={{ borderColor: '#E5E2DE' }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
        {/* Logo */}
        <Link to="/" className="font-bold text-lg shrink-0 flex items-center gap-2" style={{ color: '#C13B2A' }}>
          <IconHome size={20} stroke={2} />
          <span>Community Hero</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 transition-colors whitespace-nowrap"
                style={{
                  color: active ? '#C13B2A' : '#7A7875',
                  backgroundColor: active ? '#FDF1EF' : 'transparent',
                  borderRadius: '6px',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={15} stroke={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSelector />
          {user ? (
            <>
              {userRole && (
                <span className="text-xs hidden md:block px-2 py-1 rounded" style={{ color: '#7A7875', backgroundColor: '#F5F3F0' }}>
                  {ROLE_LABELS[userRole]}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors"
                style={{ color: '#7A7875', borderColor: '#E5E2DE', borderRadius: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#C13B2A'; e.currentTarget.style.borderColor = '#C13B2A'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7875'; e.currentTarget.style.borderColor = '#E5E2DE'; }}
              >
                <IconLogout size={15} stroke={1.5} />
                {tr.signOut}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm text-white px-4 py-1.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
            >
              <IconLogin size={15} stroke={1.5} />
              {tr.signIn}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
