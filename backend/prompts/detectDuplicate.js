module.exports = () => `
You will receive two images:
Image 1 (NEW): A newly submitted civic issue photo
Image 2 (EXISTING): An already-reported issue photo from the same area

Determine if these photos show the SAME physical issue at the SAME location.
Return ONLY valid JSON:
{
  "is_duplicate": <boolean>,
  "confidence": <integer 0-100>,
  "reason": "<one sentence explanation>"
}

Be conservative: only flag as duplicate if clearly the same issue and location.
Different issues at the same location are NOT duplicates.
`;
