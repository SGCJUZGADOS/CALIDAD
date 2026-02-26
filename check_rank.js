const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkRank(targetRad) {
    console.log(`🔍 Analizando posición del radicado: ${targetRad}`);
    const snap = await db.collection('tutelas').orderBy('timestamp', 'desc').get();

    let rank = 1;
    let found = false;

    snap.forEach(doc => {
        if (doc.data().radicado === targetRad) {
            found = true;
            console.log(`✅ Registro encontrado. Posición en lista descendente: ${rank}`);
        }
        if (!found) rank++;
    });

    if (!found) console.log("❌ El radicado no se encontró en la colección 'tutelas'.");
    process.exit(0);
}

checkRank('05266310300220260006700');
