module.exports = (zoneHistory, context) => `
Analyze the civic issue history for this zone and predict likely issues in the next 30 days.
Be specific about location types (near drains, intersections, etc.).

ZONE HISTORY: ${JSON.stringify(zoneHistory)}
CONTEXT: ${JSON.stringify(context)}

Return ONLY valid JSON:
{
  "predictions": [
    {
      "issueType": "<predicted issue type>",
      "probability": <integer 0-100>,
      "location": "<specific location description>",
      "reason": "<why this is likely, referencing historical data>",
      "suggestedAction": "<proactive action the municipality can take>",
      "estimatedCost": "<rough cost estimate>",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Generate 2-5 predictions. Only include predictions with probability >= 40%.
`;
