require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { db, auth } = require('../config/firebase');

const departments = require('./departments');
const officers    = require('./officers');
const tickets     = require('./tickets');
const gamification = require('./gamification');
const predictions  = require('./predictions');
const wardStats    = require('./wardStats');
const counters     = require('./counters');

async function seedCollection(collectionName, docs, idField = 'id') {
  console.log(`\n[Seed] Seeding ${collectionName}...`);
  const batch = db.batch();
  let count = 0;

  for (const doc of docs) {
    const id  = doc[idField] || doc.uid || doc.id;
    const ref = db.collection(collectionName).doc(id);
    const { [idField]: _, uid: __, ...data } = { ...doc };
    batch.set(ref, data, { merge: true });
    count++;
  }

  await batch.commit();
  console.log(`[Seed] ✓ ${count} documents written to ${collectionName}`);
}

async function seedTickets() {
  console.log('\n[Seed] Seeding tickets...');
  const batch = db.batch();
  for (const ticket of tickets) {
    const { docId, ...data } = ticket;
    const ref = db.collection('tickets').doc(docId);
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  console.log(`[Seed] ✓ ${tickets.length} tickets written`);
}

async function seedGamification() {
  console.log('\n[Seed] Seeding gamification...');
  const batch = db.batch();
  for (const entry of gamification) {
    const { uid, ...data } = entry;
    batch.set(db.collection('gamification').doc(uid), data, { merge: true });
  }
  await batch.commit();
  console.log(`[Seed] ✓ ${gamification.length} gamification entries written`);
}

async function seedCounters() {
  console.log('\n[Seed] Seeding counters...');
  const batch = db.batch();
  for (const counter of counters) {
    batch.set(db.collection('counters').doc(counter.id), { count: counter.count }, { merge: true });
  }
  await batch.commit();
  console.log(`[Seed] ✓ Counters written`);
}

async function seedPredictions() {
  console.log('\n[Seed] Seeding predictions...');
  for (const pred of predictions) {
    await db.collection('predictions').add(pred);
  }
  console.log(`[Seed] ✓ ${predictions.length} predictions written`);
}

async function seedWardStats() {
  console.log('\n[Seed] Seeding ward stats...');
  const batch = db.batch();
  for (const ward of wardStats) {
    const { id, ...data } = ward;
    batch.set(db.collection('ward_stats').doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`[Seed] ✓ Ward stats written`);
}

async function main() {
  console.log('=== Community Hero Seed Script ===\n');
  try {
    await seedCollection('departments', departments);
    await seedCollection('officers', officers, 'uid');
    await seedTickets();
    await seedGamification();
    await seedCounters();
    await seedPredictions();
    await seedWardStats();

    console.log('\n=== Seed Complete! ===');
    console.log('\nNext steps:');
    console.log('1. Create Firebase Auth accounts for officers in Firebase Console');
    console.log('2. Update officer UIDs in Firestore to match real Firebase Auth UIDs');
    console.log('3. Set admin custom claim: admin.auth().setCustomUserClaims(uid, { admin: true })');
    console.log('4. Deploy Firestore rules: firebase deploy --only firestore:rules,storage');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] FAILED:', err);
    process.exit(1);
  }
}

main();
