require('dotenv').config();
const fetch = require('node-fetch');

// Model cascade: ordered by cost/speed, falls through on quota or overload
// gemini-2.0-flash free tier is often exhausted; 2.5-flash-lite is the reliable fallback
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_URL = `${GEMINI_BASE}/gemini-2.0-flash:generateContent`;
const GEMINI_FC_URL = GEMINI_URL;

// Quota tracker
const quota = { daily: 0, minute: 0, lastMinuteReset: Date.now(), lastDayReset: Date.now() };
const DAILY_LIMIT  = 1400;
const MINUTE_LIMIT = 12;

const checkQuota = () => {
  const now = Date.now();
  if (now - quota.lastMinuteReset > 60000) {
    quota.minute = 0;
    quota.lastMinuteReset = now;
  }
  if (now - quota.lastDayReset > 86400000) {
    quota.daily = 0;
    quota.lastDayReset = now;
  }
  if (quota.daily  >= DAILY_LIMIT)  throw Object.assign(new Error('Daily AI quota reached'), { status: 429 });
  if (quota.minute >= MINUTE_LIMIT) throw Object.assign(new Error('AI rate limit'), { status: 429 });
};

const imageToBase64 = async (urlOrBuffer) => {
  if (Buffer.isBuffer(urlOrBuffer)) {
    return { inlineData: { data: urlOrBuffer.toString('base64'), mimeType: 'image/jpeg' } };
  }
  const res    = await fetch(urlOrBuffer);
  const buffer = await res.buffer();
  return { inlineData: { data: buffer.toString('base64'), mimeType: 'image/jpeg' } };
};

const callGeminiWithModel = async (model, parts) => {
  const url = `${GEMINI_BASE}/${model}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    const isRetryable = response.status === 429
      || response.status === 503
      || msg.includes('quota')
      || msg.includes('RESOURCE_EXHAUSTED')
      || msg.includes('high demand')
      || msg.includes('overloaded')
      || msg.includes('retry');
    throw Object.assign(new Error(`Gemini [${model}]: ${msg}`), { isRetryable });
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text);
};

const callGemini = async (parts) => {
  checkQuota();
  quota.daily++;
  quota.minute++;

  for (const model of MODELS) {
    try {
      return await callGeminiWithModel(model, parts);
    } catch (err) {
      if (err.isRetryable) {
        console.warn(`[Gemini] ${model} unavailable (${err.message.substring(0, 60)}), trying next model…`);
        continue;
      }
      throw err;
    }
  }
  throw Object.assign(new Error('All Gemini models unavailable. Check quota at https://ai.google.dev/'), { status: 503 });
};

// 1. Classify issue from photo
const classifyIssue = async (photoBuffer, context) => {
  const img = await imageToBase64(photoBuffer);
  try {
    return await callGemini([
      { text: require('../prompts/classify')(context) },
      img,
    ]);
  } catch (err) {
    console.error('[Gemini] classifyIssue failed:', err.message);
    return {
      issueType: '', category: '', severity: 5, dangerLevel: 'moderate',
      departmentId: '', description: '', confidence: 0, reasoning: 'Classification unavailable',
    };
  }
};

// 2. Verify report — photo matches declared category + full classify
const verifyReport = async (photoBuffer, context) => {
  const img = await imageToBase64(photoBuffer);
  try {
    return await callGemini([
      { text: require('../prompts/verifyReport')(context) },
      img,
    ]);
  } catch (err) {
    console.error('[Gemini] verifyReport failed:', err.message);
    return {
      match: true, matchConfidence: 0, detectedType: '', mismatchReason: null,
      issueType: context.declaredType || '', category: context.declaredCategory || '',
      severity: 5, dangerLevel: 'moderate', departmentId: '',
      description: context.description || '', confidence: 0, reasoning: 'Verification unavailable',
    };
  }
};

// 3. Validate resolution (before vs after)
const validateResolution = async (beforeUrl, afterUrl) => {
  const [before, after] = await Promise.all([
    imageToBase64(beforeUrl),
    imageToBase64(afterUrl),
  ]);
  try {
    return await callGemini([
      { text: require('../prompts/validateResolution')() },
      before, after,
    ]);
  } catch (err) {
    console.error('[Gemini] validateResolution failed:', err.message);
    return { same_location: false, issue_resolved_in_image2: false, confidence_score: 0, rejection_reason: 'Validation unavailable' };
  }
};

// 3. Ghost detection (3 images)
const detectGhost = async (newPhotoUrl, originalPhotoUrl, resolutionPhotoUrl) => {
  const [newImg, origImg, resImg] = await Promise.all([
    imageToBase64(newPhotoUrl),
    imageToBase64(originalPhotoUrl),
    imageToBase64(resolutionPhotoUrl),
  ]);
  return await callGemini([
    { text: require('../prompts/detectGhost')() },
    newImg, origImg, resImg,
  ]);
};

// 4. Detect duplicate — compares both images AND text descriptions
const detectDuplicate = async (newPhotoBuffer, existingPhotoUrl, textContext = {}) => {
  const parts = [{ text: require('../prompts/detectDuplicate')(textContext) }];
  // Attach photos when available — AI uses them as additional signal
  try { parts.push(await imageToBase64(newPhotoBuffer)); } catch (_) {}
  if (existingPhotoUrl) {
    try { parts.push(await imageToBase64(existingPhotoUrl)); } catch (_) {}
  }
  return await callGemini(parts);
};

// 5. NLP query bot with function calling (Feature 2)
const queryBot = async (question, ticketData) => {
  try {
    return await queryBotWithFunctionCalling(question, ticketData);
  } catch (err) {
    console.error('[Gemini] queryBot function calling failed, falling back:', err.message);
    const result = await callGemini([{
      text: require('../prompts/queryBot')(question, ticketData)
    }]);
    return result.answer || 'I could not find an answer. Please contact support.';
  }
};

// Function calling implementation
const queryBotWithFunctionCalling = async (question, ticketData) => {
  const { queryFunctions } = require('./queryFunctions');
  checkQuota();
  quota.daily++;
  quota.minute++;

  let messages = [{
    role: 'user',
    parts: [{ text: `You are a helpful civic issue tracking assistant. Answer this question about ticket ${ticketData.publicId}: ${question}` }]
  }];

  const toolConfig = {
    function_declarations: queryFunctions.map(f => f.declaration),
  };

  let maxIter = 5;
  let answer  = null;

  while (maxIter-- > 0) {
    const response = await fetch(GEMINI_FC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: messages,
        tools: [toolConfig],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    messages.push({ role: 'model', parts });

    const textPart = parts.find(p => p.text);
    if (textPart) { answer = textPart.text; break; }

    const fnCalls = parts.filter(p => p.functionCall);
    if (!fnCalls.length) break;

    const fnResponses = [];
    for (const part of fnCalls) {
      const fn    = queryFunctions.find(f => f.declaration.name === part.functionCall.name);
      const result = fn ? await fn.execute({ ...part.functionCall.args, ticketData }) : { error: 'Unknown function' };
      fnResponses.push({
        functionResponse: { name: part.functionCall.name, response: { result } }
      });
    }
    messages.push({ role: 'user', parts: fnResponses });
  }

  return answer || 'I could not find the answer to your question.';
};

// 6. Generate RTI document
const generateRTI = async (ticketData) => {
  try {
    const result = await callGemini([{
      text: require('../prompts/generateRTI')(ticketData)
    }]);
    return result.rtiText || '';
  } catch (err) {
    console.error('[Gemini] generateRTI failed:', err.message);
    return generateRTIFallback(ticketData);
  }
};

// 7. Generate ward report
const generateWardReport = async (wardData) => {
  try {
    const result = await callGemini([{
      text: require('../prompts/generateReport')(wardData)
    }]);
    return result.reportText || '';
  } catch (err) {
    console.error('[Gemini] generateWardReport failed:', err.message);
    return '';
  }
};

// 8. Predict issues
const predictIssues = async (zoneHistory, context) => {
  try {
    const result = await callGemini([{
      text: require('../prompts/predictIssues')(zoneHistory, context)
    }]);
    return result.predictions || [];
  } catch (err) {
    console.error('[Gemini] predictIssues failed:', err.message);
    return [];
  }
};

function generateRTIFallback(ticket) {
  return `To The Public Information Officer
${ticket.departmentId || 'Department'}, ${ticket.location?.city || 'City'}

Subject: RTI Application under RTI Act 2005 — Ticket ${ticket.publicId}

I am filing this RTI application regarding a civic issue (${ticket.issueType}) reported at ${ticket.location?.address} on ${new Date(ticket.createdAt).toDateString()}.

The issue has been unresolved for ${Math.floor((Date.now() - new Date(ticket.createdAt)) / 86400000)} days.

I request information on:
1. Actions taken to resolve this issue
2. Expected resolution timeline
3. Name and designation of officer responsible

[Applicant signature]`;
}

module.exports = {
  classifyIssue, verifyReport, validateResolution, detectGhost,
  detectDuplicate, queryBot, generateRTI,
  generateWardReport, predictIssues,
  getQuotaStatus: () => ({ daily: quota.daily, dailyLimit: DAILY_LIMIT, minute: quota.minute }),
};
