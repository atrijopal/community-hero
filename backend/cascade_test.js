require('dotenv').config();
var fetch = require('node-fetch');
var key = process.env.GEMINI_API_KEY;
var base = 'https://generativelanguage.googleapis.com/v1beta/models';
var models = ['gemini-2.0-flash','gemini-2.0-flash-lite','gemini-2.5-flash-lite','gemini-2.5-flash'];
function test(i) {
  if (i >= models.length) { console.log('ALL MODELS EXHAUSTED'); process.exit(1); return; }
  fetch(base + '/' + models[i] + ':generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Return JSON: {"ok":true}' }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 20 } })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.error) {
      console.log(models[i] + ': ' + d.error.message.substring(0,70));
      test(i+1);
    } else {
      console.log(models[i] + ': OK =>', d.candidates[0].content.parts[0].text);
      process.exit(0);
    }
  }).catch(function(e) { console.log(models[i] + ': ERR ' + e.message); test(i+1); });
}
test(0);
