require('dotenv').config();
var gemini = require('./services/geminiService');
gemini.classifyIssue(Buffer.from('fake'), { city: 'Kolkata', season: 'summer' })
  .then(function(r) {
    console.log('classifyIssue result:');
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  }).catch(function(e) {
    console.log('ERROR:', e.message);
    process.exit(1);
  });
