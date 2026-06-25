const CITY_CODES = { Kolkata: 'KOL', Mumbai: 'MUM', Delhi: 'DEL', Bangalore: 'BLR', Chennai: 'CHN', Hyderabad: 'HYD', Pune: 'PUN', Ahmedabad: 'AMD' };

const VALID_ISSUE_TYPES = [
  'pothole','damaged_road','broken_footpath','open_manhole','waterlogging',
  'garbage','sewage_overflow','water_leakage','broken_light','broken_signal',
  'exposed_wire','fallen_tree','illegal_dumping','broken_park_equipment','other'
];

const VALID_CATEGORIES = [
  'Infrastructure','Water_Drainage','Sanitation',
  'Electricity','Public_Safety','Environment','Public_Facilities'
];

const VALID_DEPARTMENTS = [
  'roads_infrastructure','water_supply','sanitation',
  'electricity','parks_recreation','environment'
];

const TICKET_STATUSES = [
  'UNASSIGNED','ASSIGNED','IN_PROGRESS','RESOLVED',
  'REJECTED','ESCALATED','RTI_FILED','GHOST_FLAGGED','CLOSED_OVERRIDE'
];

const SLA_DAYS = { REMINDER: 7, ESCALATE: 14, RTI: 30, APPEAL: 60 };

module.exports = { CITY_CODES, VALID_ISSUE_TYPES, VALID_CATEGORIES, VALID_DEPARTMENTS, TICKET_STATUSES, SLA_DAYS };
