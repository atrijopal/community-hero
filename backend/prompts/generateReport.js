module.exports = (wardData) => `
Generate a monthly ward performance report for a municipal corporation.
Be factual, professional, and recommend improvements where needed.

WARD DATA: ${JSON.stringify(wardData)}

Return ONLY valid JSON:
{
  "reportText": "<complete formatted ward report as a multi-line string>"
}

The report must include:
1. Executive Summary (3-4 sentences)
2. Key Statistics (total, resolved, pending, ghost issues)
3. Top Issue Categories
4. Resolution Performance (on-time vs delayed)
5. Officer Performance Summary
6. Recommendations for Next Month
`;
