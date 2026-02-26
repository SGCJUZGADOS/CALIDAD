const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSpecifics(radicados) {
    for (const rad of radicados) {
        console.log(`\n--- Checking: ${rad} ---`);
        const snapshot = await db.collection('tutelas').where('radicado', '==', rad).get();
        if (snapshot.empty) {
            console.log("❌ Not found in 'tutelas'. checking 'demandas'...");
            const snapDem = await db.collection('demandas').where('radicado', '==', rad).get();
            if (snapDem.empty) {
                console.log("❌ Not found in 'demandas' either.");
            } else {
                snapDem.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
            }
        } else {
            snapshot.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
        }
    }
    process.exit(0);
}

const list = [
    "05266310300220260005300",
    "05266310300220260006700",
    "05266310300220260006300",
    "05266310300220260005500"
];

checkSpecifics(list);
