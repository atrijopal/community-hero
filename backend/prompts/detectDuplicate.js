module.exports = (ctx = {}) => `
You will receive two civic issue reports from the SAME geographic area.

NEW report:
- Issue type: ${ctx.newIssueType || 'unknown'}
- Description: "${ctx.newDescription || ''}"

EXISTING (already filed) report:
- Issue type: ${ctx.existingIssueType || 'unknown'}
- Description: "${ctx.existingDescription || ''}"

You will also receive two images (NEW first, EXISTING second) if available.

Judge whether these represent the SAME unresolved physical problem at the SAME spot.
Use ALL available signals: image similarity, description overlap, issue type match.

Return ONLY valid JSON (no markdown):
{
  "is_duplicate": <boolean>,
  "confidence": <integer 0-100>,
  "reason": "<one sentence — what matched or didn't>"
}

Rules:
- Only flag duplicate if SAME issue AND SAME spot. Different potholes on the same street are NOT duplicates.
- If images are unavailable or unclear, rely more on descriptions.
- Be conservative: prefer false negative over false positive.
`;
