export const ISSUE_TYPES = [
  { value: 'pothole',              label: '🕳️ Pothole' },
  { value: 'damaged_road',         label: '🛣️ Damaged Road' },
  { value: 'broken_footpath',      label: '🚶 Broken Footpath' },
  { value: 'open_manhole',         label: '⚠️ Open Manhole' },
  { value: 'waterlogging',         label: '🌊 Waterlogging' },
  { value: 'garbage',              label: '🗑️ Garbage Dump' },
  { value: 'sewage_overflow',      label: '💧 Sewage Overflow' },
  { value: 'water_leakage',        label: '🚿 Water Leakage' },
  { value: 'broken_light',         label: '💡 Broken Streetlight' },
  { value: 'broken_signal',        label: '🚦 Broken Signal' },
  { value: 'exposed_wire',         label: '⚡ Exposed Wire' },
  { value: 'fallen_tree',          label: '🌳 Fallen Tree' },
  { value: 'illegal_dumping',      label: '🚯 Illegal Dumping' },
  { value: 'broken_park_equipment',label: '🏚️ Broken Park Equipment' },
  { value: 'other',                label: '📋 Other' },
];

export const DEPARTMENTS = [
  { value: 'roads_infrastructure', label: 'Roads & Infrastructure' },
  { value: 'water_supply',         label: 'Water Supply' },
  { value: 'sanitation',           label: 'Sanitation' },
  { value: 'electricity',          label: 'Electricity' },
  { value: 'parks_recreation',     label: 'Parks & Recreation' },
  { value: 'environment',          label: 'Environment' },
];

export const TICKET_STATUS_LABELS = {
  UNASSIGNED:      { label: 'Unassigned',     color: 'gray' },
  ASSIGNED:        { label: 'Assigned',        color: 'blue' },
  IN_PROGRESS:     { label: 'In Progress',     color: 'indigo' },
  RESOLVED:        { label: 'Resolved',        color: 'green' },
  ESCALATED:       { label: 'Escalated',       color: 'orange' },
  RTI_FILED:       { label: 'RTI Filed',       color: 'purple' },
  GHOST_FLAGGED:   { label: 'Ghost Flagged',   color: 'red' },
  CLOSED_OVERRIDE: { label: 'Closed (Override)', color: 'yellow' },
  REJECTED:        { label: 'Rejected',        color: 'red' },
};

export const DANGER_COLORS = {
  safe:     'text-green-600 bg-green-50',
  moderate: 'text-yellow-700 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
};

export const SEVERITY_COLOR = (s) => {
  if (s >= 9) return 'bg-red-500';
  if (s >= 7) return 'bg-orange-500';
  if (s >= 4) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const KOLKATA_CENTER = [22.5726, 88.3639];
