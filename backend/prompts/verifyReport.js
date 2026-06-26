module.exports = (context) => `
You are verifying a civic issue report submitted by a citizen.

Citizen declared:
  Category: ${context.declaredCategory || 'Not specified'}
  Issue type: ${context.declaredType || 'Not specified'}
  Description: ${context.description || 'Not provided'}

Analyze the photo and return ONLY valid JSON with no markdown, no explanation, no code fences:
{
  "match": <boolean — does the photo content match the declared category/type?>,
  "matchConfidence": <integer 0-100 — how confident you are in the match verdict>,
  "detectedType": "one of: pothole/damaged_road/broken_footpath/open_manhole/waterlogging/garbage/sewage_overflow/water_leakage/broken_light/broken_signal/exposed_wire/fallen_tree/illegal_dumping/broken_park_equipment/other",
  "mismatchReason": "<if match=false: one short sentence explaining the mismatch, else null>",
  "issueType": "<best issue type from the list above>",
  "category": "one of: Infrastructure/Water_Drainage/Sanitation/Electricity/Public_Safety/Environment/Public_Facilities",
  "severity": <integer 1-10>,
  "dangerLevel": "one of: safe/moderate/critical",
  "departmentId": "one of: roads_infrastructure/water_supply/sanitation/electricity/parks_recreation/environment",
  "description": "<refine or confirm the citizen's description in one clear sentence>",
  "confidence": <integer 0-100 — overall classification confidence>,
  "reasoning": "<brief explanation or null>"
}

Context: City ${context.city || 'India'}, Season ${context.season || 'unknown'}.

Severity guide: 1-3 minor cosmetic, 4-6 inconvenient, 7-8 dangerous, 9-10 life-threatening.
Auto-set severity to 9+ for: open manholes, exposed electrical wires.

For match verdict: if no declared category was provided (citizen chose AI-decide), set match=true and matchConfidence=100.
`;
