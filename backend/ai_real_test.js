require('dotenv').config();
var fetch = require('node-fetch');
var gemini = require('./services/geminiService');
fetch('https://images.unsplash.com/photo-1545127398-14699f92334b?w=400')
  .then(function(r) { return r.buffer(); })
  .then(function(buf) {
    return gemini.classifyIssue(buf, { city: 'Kolkata', season: 'summer' });
  }).then(function(r) {
    console.log('issueType:', r.issueType, '| severity:', r.severity, '| confidence:', r.confidence, '| dept:', r.departmentId);
    console.log('description:', (r.description||'').substring(0,80));
    process.exit(0);
  }).catch(function(e) {
    console.log('ERROR:', e.message);
    process.exit(1);
  });
