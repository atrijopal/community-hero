module.exports = () => `
You will receive three images in order:
Image 1 (NEW REPORT): Citizen claims the issue has re-appeared
Image 2 (ORIGINAL): The original report photo (before resolution)
Image 3 (RESOLUTION): Officer's resolution photo

Your task: Determine if Image 1 shows the same unresolved issue as Image 2, suggesting that Image 3 was a false/fake resolution.

Return ONLY valid JSON:
{
  "issue_still_present": <boolean — is the same issue visible in Image 1 as in Image 2?>,
  "confidence": <integer 0-100>,
  "decision": "reject_resolution" | "needs_review" | "accept_resolution",
  "reason": "<one sentence explanation>",
  "comparison": {
    "image1_shows": "<what Image 1 shows>",
    "image2_shows": "<what Image 2 shows>",
    "image3_shows": "<what Image 3 shows>",
    "conclusion": "<whether the resolution appears genuine>"
  }
}

Decision guide:
- reject_resolution: clear evidence the issue was NOT fixed (confidence >= 65)
- needs_review: ambiguous, manual review recommended (confidence 40-64)
- accept_resolution: the resolution appears genuine
`;
