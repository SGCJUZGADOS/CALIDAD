const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function checkRad(rad) {
    const snap = await db.collection('tutelas').where('radicado', '==', rad).get();
    snap.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
    process.exit(0);
}
checkRad('05266310300220260006700');
