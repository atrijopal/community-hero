import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

// Handles Firestore Timestamps, ISO strings, and Date objects
const toDate = (v) => {
  if (!v) return null;
  if (v?.toDate) return v.toDate();       // Firestore Timestamp
  if (v instanceof Date) return v;
  return new Date(v);                     // ISO string or number
};

export const timeAgo = (v) => {
  const d = toDate(v);
  if (!d) return 'Unknown';
  try { return formatDistanceToNow(d, { addSuffix: true }); }
  catch { return String(v); }
};

export const formatDate = (v) => {
  const d = toDate(v);
  if (!d) return 'Unknown';
  try { return format(d, 'dd MMM yyyy, h:mm a'); }
  catch { return String(v); }
};

export const daysAgo = (v) => {
  const d = toDate(v);
  if (!d) return 0;
  return differenceInDays(new Date(), d);
};

export const daysUntil = (v) => {
  const d = toDate(v);
  if (!d) return 0;
  return differenceInDays(d, new Date());
};

export const issueTypeLabel = (type) => {
  const map = {
    pothole: 'Pothole', damaged_road: 'Damaged Road', broken_footpath: 'Broken Footpath',
    open_manhole: 'Open Manhole', waterlogging: 'Waterlogging', garbage: 'Garbage Dump',
    sewage_overflow: 'Sewage Overflow', water_leakage: 'Water Leakage',
    broken_light: 'Broken Streetlight', broken_signal: 'Broken Signal',
    exposed_wire: 'Exposed Wire', fallen_tree: 'Fallen Tree',
    illegal_dumping: 'Illegal Dumping', broken_park_equipment: 'Broken Park Equipment',
    other: 'Other',
  };
  return map[type] || type;
};

export const levelName = (xp) => {
  if (xp < 100)  return 'New Reporter';
  if (xp < 500)  return 'Civic Volunteer';
  if (xp < 1000) return 'Active Resident';
  if (xp < 2000) return 'Community Guardian';
  if (xp < 3500) return 'Ward Champion';
  if (xp < 5000) return 'Civic Hero';
  return 'Legend';
};
