export const ISSUE_TYPES = [
  { value: 'pothole',               label: 'Pothole' },
  { value: 'damaged_road',          label: 'Damaged Road' },
  { value: 'broken_footpath',       label: 'Broken Footpath' },
  { value: 'open_manhole',          label: 'Open Manhole' },
  { value: 'waterlogging',          label: 'Waterlogging' },
  { value: 'garbage',               label: 'Garbage Dump' },
  { value: 'sewage_overflow',       label: 'Sewage Overflow' },
  { value: 'water_leakage',         label: 'Water Leakage' },
  { value: 'broken_light',          label: 'Broken Streetlight' },
  { value: 'broken_signal',         label: 'Broken Signal' },
  { value: 'exposed_wire',          label: 'Exposed Wire' },
  { value: 'fallen_tree',           label: 'Fallen Tree' },
  { value: 'illegal_dumping',       label: 'Illegal Dumping' },
  { value: 'broken_park_equipment', label: 'Broken Park Equipment' },
  { value: 'other',                 label: 'Other' },
];

export const DEPARTMENTS = [
  { value: 'roads_infrastructure', label: 'Roads & Infrastructure' },
  { value: 'water_supply',         label: 'Water Supply' },
  { value: 'sanitation',           label: 'Sanitation' },
  { value: 'electricity',          label: 'Electricity' },
  { value: 'parks_recreation',     label: 'Parks & Recreation' },
  { value: 'environment',          label: 'Environment' },
];

// Semantic status config — color encodes meaning only
// blue (#2D6A9F) = ASSIGNED / IN_PROGRESS only
export const TICKET_STATUS_LABELS = {
  UNASSIGNED:      { label: 'Unassigned',       color: '#7A7875', bg: '#F5F3F0' },
  ASSIGNED:        { label: 'Assigned',          color: '#2D6A9F', bg: '#E3EEF7' },
  IN_PROGRESS:     { label: 'In Progress',       color: '#2D6A9F', bg: '#E3EEF7' },
  RESOLVED:        { label: 'Resolved',          color: '#1A7A4A', bg: '#E8F5EE' },
  ESCALATED:       { label: 'Escalated',         color: '#D4730A', bg: '#FEF3E7' },
  RTI_FILED:       { label: 'RTI Filed',         color: '#C13B2A', bg: '#FDF1EF' },
  GHOST_FLAGGED:   { label: 'Ghost Flagged',     color: '#8B1A1A', bg: '#F9E5E5' },
  CLOSED_OVERRIDE: { label: 'Closed (Override)', color: '#7A7875', bg: '#F5F3F0' },
  REJECTED:        { label: 'Rejected',          color: '#C13B2A', bg: '#FDF1EF' },
};

// Danger level inline styles
export const DANGER_STYLES = {
  safe:     { color: '#1A7A4A', backgroundColor: '#E8F5EE' },
  moderate: { color: '#8B6600', backgroundColor: '#FEF3E7' },
  critical: { color: '#C13B2A', backgroundColor: '#FDF1EF' },
};

// Severity → hex color (for use in style={{ backgroundColor }})
export const SEVERITY_HEX = (s) => {
  if (s >= 9) return '#C13B2A';
  if (s >= 7) return '#D4730A';
  if (s >= 4) return '#D4730A';
  return '#1A7A4A';
};

export const KOLKATA_CENTER = [22.5726, 88.3639];
