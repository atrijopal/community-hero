module.exports = () => `
You will receive two images in order:
Image 1 (BEFORE): Original reported civic issue photo
Image 2 (AFTER): Officer's claimed resolution photo

Compare them carefully. Return ONLY valid JSON:
{
  "same_location": <boolean — do both images appear to show the same physical location?>,
  "issue_visible_in_image1": <boolean — is the reported issue clearly visible in Image 1?>,
  "issue_resolved_in_image2": <boolean — has the issue been fully resolved in Image 2?>,
  "timestamp_appears_recent": <boolean — does Image 2 appear to be recent (good lighting, no obvious recycled photo signs)?>,
  "confidence_score": <integer 0-100>,
  "rejection_reason": "<specific reason if any check failed, null if all passed>"
}

Be strict: partial fixes, different locations, or recycled photos should fail.
`;
