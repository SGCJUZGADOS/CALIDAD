const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION & PATH HANDLING
function loadJsonFile(filename) {
    const paths = [
        path.join(__dirname, filename),          // Local folder (js/)
        path.join(__dirname, '..', filename),     // Parent folder (root)
        path.join(process.cwd(), filename)       // Current Working Directory
    ];

    for (const p of paths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim();
                return JSON.parse(content);
            } catch (e) {
                console.error(`❌ Error parseando ${p}:`, e.message);
            }
        }
    }
    throw new Error(`❌ No se pudo encontrar o leer el archivo: ${filename}`);
}

const config = loadJsonFile('notifier_config.json');
const serviceAccount = loadJsonFile('serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Adjust for CENDOJ/Outlook
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.email,
        pass: config.password,
    },
});

async function sendAlertEmail(juzgadoEmail, record, collectionName) {
    const isRed = record.alerta === 'Rojo';
    const alertType = isRed ? 'VENCIMIENTO (Día 10)' : 'PREVENTIVA (Día 7)';
    const emoji = isRed ? '🚨' : '⚠️';

    const subject = `${emoji} ALERTA ${alertType} - Radicado: ${record.radicado}`;
    const tableType = collectionName === 'tutelas' ? 'Tutela' : 'Demanda';
    const message = isRed
        ? 'Se ha detectado un registro con el término vencido (Día 10 alcanzado):'
        : 'Se ha detectado un registro que alcanzará el término pronto (Día 7 alcanzado):';

    const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
      <h2 style="color: ${isRed ? '#dc3545' : '#ffc107'}; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
        ${emoji} Alerta ${alertType}
      </h2>
      <p>Estimado Despacho,</p>
      <p>${message}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Tipo de Proceso:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${tableType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Radicado:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.radicado}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Accionante:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.accionante}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Accionado:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.accionado}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Fecha de Reparto:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.fechaReparto}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Límite Día 10:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.diaDiez}</td></tr>
      </table>
      <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 5px solid ${isRed ? '#dc3545' : '#ffc107'};">
        <strong>Acción requerida:</strong> Por favor ingrese al sistema <a href="https://sgcjuzgados.github.io/ENVIGADO/" style="color: #004884; font-weight: bold; text-decoration: underline;">SGC Envigado</a> para gestionar este registro y actualizar su estado.
      </div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 0.8rem; color: #999; text-align: center;">Generado automáticamente por el Sistema de Gestión de Calidad - Envigado.</p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: `"SGC Envigado" <${config.email}>`,
            to: juzgadoEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`✅ Correo enviado a ${juzgadoEmail} por radicado ${record.radicado}`);
        return true;
    } catch (error) {
        console.error(`❌ Error enviando correo a ${juzgadoEmail}:`, error);
        return false;
    }
}

async function runNotifier() {
    console.log("🚀 Iniciando escaneo de alertas...");
    const collections = ['tutelas', 'demandas'];

    // Cache user emails with case-insensitive keys
    const usersSnap = await db.collection('users').get();
    const userEmails = {};
    console.log("🔍 Juzgados encontrados en la base de datos de usuarios:");
    usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.juzgado && data.email) {
            const juzgadoKey = data.juzgado.trim().toLowerCase();
            userEmails[juzgadoKey] = data.email.trim();
            console.log(`   - "${data.juzgado.trim()}" -> ${data.email.trim()}`);
        }
    });

    const todayStr = new Date().toISOString().split('T')[0];

    for (const coll of collections) {
        console.log(`\n📂 Revisando colección: ${coll}`);

        // Fetch pending records (those without notification date and where email hasn't been sent)
        // Note: Filtering by emailSent=false is more efficient than fetching all.
        // Fetch recent records (limit 100)
        // Note: Removing filters because Firestore skips documents if the field is missing
        const snapshot = await db.collection(coll)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        if (snapshot.empty) {
            console.log(`✨ No hay posibles alertas pendientes en ${coll}.`);
            continue;
        }

        for (const doc of snapshot.docs) {
            const record = doc.data();

            // Skip if already marked as sent
            if (record.emailSent === true) continue;

            // Skip if already has a notification date (it's closed)
            if (record.fechaNotificacion) continue;

            // DYNAMIC ALERT CALCULATION
            let isRed = false;
            let isYellow = false;

            if (record.diaDiez && todayStr > record.diaDiez) {
                isRed = true;
            } else if (record.diaSiete && todayStr >= record.diaSiete) {
                isYellow = true;
            }

            // If it's not in an alert state, skip it
            if (!isRed && !isYellow) continue;

            // Re-assign correctly for the email template
            record.alerta = isRed ? 'Rojo' : 'Amarillo';

            const juzgadoName = record.juzgado ? record.juzgado.trim() : null;
            const juzgadoKey = juzgadoName ? juzgadoName.toLowerCase() : null;
            const email = userEmails[juzgadoKey];

            if (email) {
                const sent = await sendAlertEmail(email, record, coll);
                if (sent) {
                    await doc.ref.update({
                        emailSent: true,
                        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else {
                console.warn(`⚠️ No se encontró correo para: "${juzgadoName}"`);
            }
        }
    }

    console.log("🏁 Proceso de notificación completado.");
    process.exit(0);
}

runNotifier();
