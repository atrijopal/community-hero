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
    firestoreCollection: null, // admin doc not needed
  },
  {
    email:       'rajesh.kumar@kmc.gov.in',
    password:    'Officer@123',
    displayName: 'Rajesh Kumar',
    claims:      { officer: true },
    firestoreCollection: 'officers',
    firestoreDocId: null, // will be found by email
  },
];

async function getOrCreateUser(email, password, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  [exists] ${email} (uid: ${existing.uid})`);
    return existing;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email, password, displayName });
      console.log(`  [created] ${email} (uid: ${created.uid})`);
      return created;
    }
    throw err;
  }
}

async function main() {
  console.log('=== Community Hero — Create Demo Auth Users ===\n');

  for (const user of DEMO_USERS) {
    console.log(`\nProcessing: ${user.email}`);
    const record = await getOrCreateUser(user.email, user.password, user.displayName);

    // Set / update password (in case it changed)
    await auth.updateUser(record.uid, { password: user.password });

    // Set custom claims
    await auth.setCustomUserClaims(record.uid, user.claims);
    console.log(`  [claims] set ${JSON.stringify(user.claims)}`);

    // Update Firestore officer doc with real UID
    if (user.firestoreCollection) {
      const snap = await db.collection(user.firestoreCollection)
        .where('email', '==', user.email).limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ uid: record.uid });
        // Also move doc to correct ID if needed
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
  console.log('Demo credentials are now active:');
  console.log('  Admin:   admin@kmc.gov.in / Admin@123');
  console.log('  Officer: rajesh.kumar@kmc.gov.in / Officer@123');
  process.exit(0);
}

main().catch(err => {
  console.error('[FAILED]', err.message);
  process.exit(1);
});
