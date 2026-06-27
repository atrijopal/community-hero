import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconHome, IconPlus, IconTicket, IconMap, IconTrophy, IconUser,
  IconLayoutDashboard, IconInbox, IconMessageCircle, IconChartBar,
  IconUsers, IconMapPin, IconBrain, IconRobot, IconCopy,
  IconLogout, IconLogin, IconChevronLeft, IconChevronRight,
  IconSettings,
} from '@tabler/icons-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useT } from '../../utils/translations';
import { useTranslateMap } from '../../hooks/useTranslate';
import toast from 'react-hot-toast';

const W_OPEN   = 220;
const W_CLOSED = 56;

const ROLE_STRINGS = {
  citizen:        'Citizen',
  officer:        'Officer',
  senior_officer: 'Sr. Officer',
  admin:          'Admin',
  oDashboard:     'Dashboard',
  oQueue:         'My Queue',
  oQueries:       'Queries',
  oPerformance:   'Performance',
  aOverview:      'Overview',
  aAssign:        'Assign',
  aAllTickets:    'All Tickets',
  aStaff:         'Staff',
  aWardMap:       'Ward Map',
  aReports:       'Reports',
  aAIPred:        'AI Predictions',
  aAgents:        'Agents',
  aDuplicates:    'Duplicates',
};

const ROLE_COLORS = {
  citizen:        { bg: '#E8F5EE', text: '#1A7A4A', dot: '#1A7A4A' },
  officer:        { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  senior_officer: { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  admin:          { bg: '#FDF1EF', text: '#C13B2A', dot: '#C13B2A' },
};

function NavLink({ to, icon: Icon, label, open, active }) {
  return (
    <Link
      to={to}
      title={!open ? label : undefined}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        open ? '8px 12px 8px 11px' : '8px',
        borderRadius:   6,
        textDecoration: 'none',
        fontSize:       13,
        fontWeight:     active ? 600 : 400,
        color:          active ? '#C13B2A' : '#4A4A48',
        background:     active ? '#FDF1EF' : 'transparent',
        transition:     'background 0.15s, color 0.15s',
        justifyContent: open ? 'flex-start' : 'center',
        minHeight:      36,
        whiteSpace:     'nowrap',
        overflow:       'hidden',
        boxShadow:      active && open ? 'inset 3px 0 0 #C13B2A' : 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F5F3F0'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={18} stroke={active ? 2 : 1.5} style={{ flexShrink: 0, color: active ? '#C13B2A' : '#7A7875' }} />
      {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </Link>
  );
}

export default function Navbar() {
  const { user, userRole }  = useAuth();
  const { lang } = useLanguage();
  const tr                   = useT(lang);
  const rs                   = useTranslateMap(ROLE_STRINGS);
  const navigate             = useNavigate();
  const location             = useLocation();

  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem('ch_sidebar');
    return saved === null ? true : saved === 'open';
  });

  const w = open ? W_OPEN : W_CLOSED;

  // Push the root div right so content doesn't hide behind sidebar
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.marginLeft    = `${w}px`;
      root.style.transition    = 'margin-left 0.2s ease';
    }
    return () => {
      if (root) { root.style.marginLeft = ''; root.style.transition = ''; }
    };
  }, [w]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem('ch_sidebar', next ? 'open' : 'closed');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    toast.success(tr.signOut);
  };

  const ROLE_LINKS = {
    citizen: [
      { to: '/citizen',             label: tr.home,        icon: IconHome },
      { to: '/citizen/report',      label: tr.reportIssue, icon: IconPlus },
      { to: '/citizen/tickets',     label: tr.myTickets,   icon: IconTicket },
      { to: '/citizen/map',         label: tr.map,         icon: IconMap },
      { to: '/citizen/leaderboard', label: tr.leaderboard, icon: IconTrophy },
      { to: '/citizen/profile',     label: tr.profile,     icon: IconUser },
    ],
    officer: [
      { to: '/officer',             label: rs.oDashboard,   icon: IconLayoutDashboard },
      { to: '/officer/queue',       label: rs.oQueue,       icon: IconInbox },
      { to: '/officer/queries',     label: rs.oQueries,     icon: IconMessageCircle },
      { to: '/officer/performance', label: rs.oPerformance, icon: IconChartBar },
    ],
    admin: [
      { to: '/admin',               label: rs.aOverview,   icon: IconLayoutDashboard },
      { to: '/admin/unassigned',    label: rs.aAssign,     icon: IconInbox },
      { to: '/admin/tickets',       label: rs.aAllTickets, icon: IconTicket },
      { to: '/admin/staff',         label: rs.aStaff,      icon: IconUsers },
      { to: '/admin/map',           label: rs.aWardMap,    icon: IconMapPin },
      { to: '/admin/reports',       label: rs.aReports,    icon: IconChartBar },
      { to: '/admin/predictions',   label: rs.aAIPred,     icon: IconBrain },
      { to: '/admin/agents',        label: rs.aAgents,     icon: IconRobot },
      { to: '/admin/duplicates',    label: rs.aDuplicates, icon: IconCopy },
    ],
  };

  const links      = ROLE_LINKS[userRole] || [];
  const roleColor  = ROLE_COLORS[userRole] || ROLE_COLORS.citizen;
  const roleLabel  = rs[userRole] || '';

  const initials = (user?.displayName || 'U')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside style={{
      position:       'fixed',
      left:           0,
      top:            0,
      bottom:         0,
      width:          w,
      display:        'flex',
      flexDirection:  'column',
      background:     '#FFFFFF',
      borderRight:    '1px solid #E5E2DE',
      zIndex:         100,
      transition:     'width 0.2s ease',
      overflow:       'hidden',
    }}>

      {/* ── Logo + toggle ───────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: open ? 'space-between' : 'center',
        padding:        open ? '0 12px 0 14px' : '0',
        height:         52,
        borderBottom:   '1px solid #E5E2DE',
        flexShrink:     0,
      }}>
        {open && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#C13B2A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0,
            }}>CH</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2A2A28', letterSpacing: '-0.01em' }}>
              Community Hero
            </span>
          </Link>
        )}
        {!open && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#C13B2A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: 'white',
            }}>CH</div>
          </Link>
        )}
        <button onClick={toggle} style={{
          width: 24, height: 24, borderRadius: 4, border: '1px solid #E5E2DE',
          background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#7A7875', flexShrink: 0,
          ...(open ? {} : { position: 'absolute', right: -12, top: 14,
            background: 'white', border: '1px solid #E5E2DE', borderRadius: '50%',
            width: 22, height: 22, zIndex: 101 }),
        }}>
          {open
            ? <IconChevronLeft  size={13} stroke={2} />
            : <IconChevronRight size={13} stroke={2} />}
        </button>
      </div>

      {/* ── Role badge ──────────────────────────────────────────── */}
      {userRole && (
        <div style={{
          padding:    open ? '10px 14px 6px' : '10px 8px 6px',
          flexShrink: 0,
        }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            padding:        open ? '5px 8px' : '5px',
            borderRadius:   6,
            background:     roleColor.bg,
            justifyContent: open ? 'flex-start' : 'center',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor.dot, flexShrink: 0 }} />
            {open && <span style={{ fontSize: 11, fontWeight: 700, color: roleColor.text, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {roleLabel}
            </span>}
          </div>
        </div>
      )}

      {/* ── Nav links ───────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: open ? '4px 8px' : '4px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              icon={icon}
              label={label}
              open={open}
              active={location.pathname === to}
            />
          ))}
        </div>
      </nav>

      {/* ── Bottom section ──────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #E5E2DE', flexShrink: 0, padding: '10px 8px' }}>

        {/* User info */}
        {user && open && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px', borderRadius: 6, background: '#F5F3F0',
            marginBottom: 6, overflow: 'hidden',
          }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: '#C13B2A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white',
              }}>{initials}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#2A2A28', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || 'User'}
              </p>
              <p style={{ fontSize: 10, color: '#B8B5B0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        {user && !open && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }} title={user.displayName || user.email}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#C13B2A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white',
              }}>{initials}</div>
            )}
          </div>
        )}

        {/* Sign out / Sign in */}
        {user ? (
          <button onClick={handleLogout} title={tr.signOut} style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: open ? 'flex-start' : 'center',
            gap:            7,
            padding:        open ? '7px 10px' : '7px',
            borderRadius:   6,
            border:         '1px solid #E5E2DE',
            background:     'white',
            color:          '#7A7875',
            fontSize:       12,
            fontWeight:     500,
            cursor:         'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C13B2A'; e.currentTarget.style.borderColor = '#C13B2A'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7A7875'; e.currentTarget.style.borderColor = '#E5E2DE'; }}
          >
            <IconLogout size={14} stroke={1.5} style={{ flexShrink: 0 }} />
            {open && tr.signOut}
          </button>
        ) : (
          <Link to="/login" title={tr.signIn} style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: open ? 'flex-start' : 'center',
            gap:            7,
            padding:        open ? '7px 10px' : '7px',
            borderRadius:   6,
            background:     '#C13B2A',
            color:          'white',
            fontSize:       12,
            fontWeight:     600,
            textDecoration: 'none',
          }}>
            <IconLogin size={14} stroke={1.5} style={{ flexShrink: 0 }} />
            {open && tr.signIn}
          </Link>
        )}
      </div>
    </aside>
  );
}
