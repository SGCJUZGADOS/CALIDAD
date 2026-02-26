const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function getTotals() {
    console.log("📊 Consultando totales globales...");
    const doc = await db.collection('stats_counters').doc('global').get();
    if (doc.exists) {
        const stats = doc.data();
        console.log("--- RESULTADOS ---");
        console.log(`Tutelas totales: ${stats.total_tutelas || 0}`);
        console.log(`Demandas totales: ${stats.total_demandas || 0}`);
        console.log(`Suma total: ${(stats.total_tutelas || 0) + (stats.total_demandas || 0)}`);
    } else {
        console.log("❌ No se encontró el documento de contadores globales.");
    }
    process.exit(0);
}

getTotals();
