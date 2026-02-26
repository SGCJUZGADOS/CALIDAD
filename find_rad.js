const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findRad(partial) {
    console.log(`🔍 Searching for partial rad: ${partial}...`);
    const collections = ['tutelas', 'demandas'];
    for (const coll of collections) {
        const snap = await db.collection(coll).get();
        snap.forEach(doc => {
            const data = doc.data();
            if (data.radicado && data.radicado.includes(partial)) {
                console.log(`✅ Found in ${coll}:`);
                console.log(JSON.stringify(data, null, 2));
            }
        });
    }
    process.exit(0);
}

findRad('5266310300220260005300');
