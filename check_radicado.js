const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkRadicado(rad) {
    console.log(`🔍 Buscando radicado: ${rad}...`);
    const snap = await db.collection('tutelas').where('radicado', '==', rad).get();

    if (snap.empty) {
        console.log("❌ No se encontró el radicado.");
    } else {
        snap.forEach(doc => {
            console.log("📄 Datos encontrados:");
            const data = doc.data();
            console.log(JSON.stringify({
                radicado: data.radicado,
                fechaReparto: data.fechaReparto,
                diaSiete: data.diaSiete,
                diaDiez: data.diaDiez,
                emailSent: data.emailSent,
                emailSentYellow: data.emailSentYellow,
                emailSentRed: data.emailSentRed,
                fechaNotificacion: data.fechaNotificacion
            }, null, 2));
        });
    }
    process.exit(0);
}

checkRadicado('05266310300220260004800');
