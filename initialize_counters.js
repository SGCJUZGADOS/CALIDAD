const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function loadJsonFile(filename) {
    const paths = [
        path.join(__dirname, filename),
        path.join(__dirname, '..', filename)
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim();
            return JSON.parse(content);
        }
    }
    throw new Error(`No file ${filename}`);
}

const serviceAccount = loadJsonFile('serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function initializeCounters() {
    console.log("🚀 Iniciando recalculo de contadores globales...");

    const stats = {
        total_tutelas: 0,
        total_demandas: 0,
        tutelas_juzgados: {},
        demandas_juzgados: {},
        tutelas_derechos: {},
        matrix_entrada: {}, // Key: "DERECHO|INGRESO"
        matrix_salida: {},   // Key: "DERECHO|DECISION"
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 1. PROCESAR TUTELAS
    console.log("📦 Procesando Tutelas...");
    const tutelasSnap = await db.collection('tutelas').get();
    stats.total_tutelas = tutelasSnap.size;

    tutelasSnap.forEach(doc => {
        const data = doc.data();
        const juzgado = (data.juzgadoDestino || data.juzgado || "Sin Asignar").trim();
        const derecho = (data.derecho || "OTROS").toUpperCase().trim();
        const ingreso = (data.ingreso || "Desconocido").trim();
        const decision = (data.decision || "PENDIENTE").toUpperCase().trim();

        // Por Juzgado
        stats.tutelas_juzgados[juzgado] = (stats.tutelas_juzgados[juzgado] || 0) + 1;

        // Por Derecho
        stats.tutelas_derechos[derecho] = (stats.tutelas_derechos[derecho] || 0) + 1;

        // Matriz Entrada
        const keyEntrada = `${derecho}|${ingreso}`;
        stats.matrix_entrada[keyEntrada] = (stats.matrix_entrada[keyEntrada] || 0) + 1;

        // Matriz Salida
        if (data.fechaNotificacion) {
            const keySalida = `${derecho}|${decision}`;
            stats.matrix_salida[keySalida] = (stats.matrix_salida[keySalida] || 0) + 1;
        }
    });

    // 2. PROCESAR DEMANDAS
    console.log("📦 Procesando Demandas...");
    const demandasSnap = await db.collection('demandas').get();
    stats.total_demandas = demandasSnap.size;

    demandasSnap.forEach(doc => {
        const data = doc.data();
        const juzgado = (data.juzgadoDestino || data.juzgado || "Sin Asignar").trim();
        stats.demandas_juzgados[juzgado] = (stats.demandas_juzgados[juzgado] || 0) + 1;
    });

    console.log("💾 Guardando resultados en stats_counters/global...");
    await db.collection('stats_counters').doc('global').set(stats);

    console.log("✅ Inicializacion completada con exito.");
}

initializeCounters().then(() => process.exit(0)).catch(e => {
    console.error("❌ ERROR:", e);
    process.exit(1);
});
