/**
 * Run once to create demo Firebase Auth accounts and set custom claims.
 * Usage: node seed/createAuthUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { auth, db } = require('../config/firebase');

const DEMO_USERS = [
  {
    email:       'admin@kmc.gov.in',
    password:    'Admin@123',
    displayName: 'KMC Admin',
    claims:      { admin: true },
    firestoreCollection: null,
  },
  {
    email:       'rajesh.kumar@kmc.gov.in',
    password:    'Officer@123',
    displayName: 'Rajesh Kumar',
    claims:      { officer: true },
    firestoreCollection: 'officers',
    firestoreDocId: null,
  },
  {
    email:       'demo@communityhero.in',
    password:    'Demo@123',
    displayName: 'Demo Citizen — Arjun',
    claims:      {},
    uid:         'citizen_arjun_001', // force UID so seeded tickets/gamification link up
    firestoreCollection: null,
  },
];

async function getOrCreateUser(email, password, displayName, forcedUid) {
  // If a forced UID is requested, try to fetch that user first
  if (forcedUid) {
    try {
      const existing = await auth.getUser(forcedUid);
      console.log(`  [exists by uid] ${email} (uid: ${existing.uid})`);
      return existing;
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }
  }

  // Fall back to email lookup
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  [exists] ${email} (uid: ${existing.uid})`);
    return existing;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }

  // Create new user, optionally with a forced UID
  const params = { email, password, displayName };
  if (forcedUid) params.uid = forcedUid;
  const created = await auth.createUser(params);
  console.log(`  [created] ${email} (uid: ${created.uid})`);
  return created;
}

async function main() {
  console.log('=== Community Hero — Create Demo Auth Users ===\n');

  for (const user of DEMO_USERS) {
    console.log(`\nProcessing: ${user.email}`);
    const record = await getOrCreateUser(user.email, user.password, user.displayName, user.uid);

    // Set / update password
    await auth.updateUser(record.uid, { password: user.password });

    // Set custom claims
    await auth.setCustomUserClaims(record.uid, user.claims);
    console.log(`  [claims] set ${JSON.stringify(user.claims)}`);

    // Update Firestore officer doc with real UID (officers only)
    if (user.firestoreCollection) {
      const snap = await db.collection(user.firestoreCollection)
        .where('email', '==', user.email).limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ uid: record.uid });
        const docRef = db.collection(user.firestoreCollection).doc(record.uid);
        const existing = await docRef.get();
        if (!existing.exists) {
          await docRef.set({ ...snap.docs[0].data(), uid: record.uid });
          console.log(`  [firestore] copied officer doc to uid-keyed doc: ${record.uid}`);
        }
        console.log(`  [firestore] updated uid on ${user.firestoreCollection}/${snap.docs[0].id}`);
      } else {
        console.log(`  [warn] no ${user.firestoreCollection} doc found for ${user.email}`);
      }
    }
  }

  console.log('\n=== Done! ===');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@kmc.gov.in     / Admin@123');
  console.log('  Officer: rajesh.kumar@kmc.gov.in / Officer@123');
  console.log('  Demo:    demo@communityhero.in  / Demo@123  (citizen_arjun_001 — pre-loaded tickets + RTI)');
  process.exit(0);
}

main().catch(err => {
  console.error('[FAILED]', err.message);
  process.exit(1);
});
