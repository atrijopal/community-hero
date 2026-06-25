module.exports = (context) => `
Analyze this image of a civic infrastructure issue reported from ${context.city}, India.
Return ONLY valid JSON with no markdown, no explanation, no code fences:
{
  "issueType": "one of: pothole/damaged_road/broken_footpath/open_manhole/waterlogging/garbage/sewage_overflow/water_leakage/broken_light/broken_signal/exposed_wire/fallen_tree/illegal_dumping/broken_park_equipment/other",
  "category": "one of: Infrastructure/Water_Drainage/Sanitation/Electricity/Public_Safety/Environment/Public_Facilities",
  "severity": <integer 1-10>,
  "dangerLevel": "one of: safe/moderate/critical",
  "departmentId": "one of: roads_infrastructure/water_supply/sanitation/electricity/parks_recreation/environment",
  "description": "<one clear sentence describing the visible issue>",
  "confidence": <integer 0-100>,
  "reasoning": "<brief explanation of classification or null if obvious>"
}

Context (do NOT include in output):
Ward: ${context.ward}
City: ${context.city}
Season: ${context.season}
Time: ${context.timeOfDay}
Nearby: ${context.nearby}

Severity guide: 1-3 minor cosmetic, 4-6 inconvenient, 7-8 dangerous, 9-10 life-threatening.
Auto-set severity to 9+ for: open manholes, exposed electrical wires.
`;
