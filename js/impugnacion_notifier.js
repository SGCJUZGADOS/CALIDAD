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

// 2. HOLIDAY LOGIC (Ported from script.js)
const HolidayCalculator = {
    cache: {},
    getEasterDate: function (year) {
        const a = year % 19, b = Math.floor(year / 100), c = year % 100;
        const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    },
    addDays: (date, days) => {
        let r = new Date(date);
        r.setDate(r.getDate() + days);
        return r;
    },
    moveToNextMonday: (date) => {
        while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
        return date;
    },
    formatDate: (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },
    getHolidays: function (year) {
        if (this.cache[year]) return this.cache[year];
        let holidays = [`${year}-01-01`, `${year}-05-01`, `${year}-07-20`, `${year}-08-07`, `${year}-12-08`, `${year}-12-25`];
        const emiliani = [`${year}-01-06`, `${year}-03-19`, `${year}-06-29`, `${year}-08-15`, `${year}-10-12`, `${year}-11-01`, `${year}-11-11`];
        emiliani.forEach(s => {
            let d = new Date(s + 'T12:00:00');
            if (d.getDay() !== 1) d = this.moveToNextMonday(d);
            holidays.push(this.formatDate(d));
        });
        const easter = this.getEasterDate(year);
        for (let i = -6; i <= -2; i++) holidays.push(this.formatDate(this.addDays(easter, i)));
        [43, 64, 71].forEach(d => holidays.push(this.formatDate(this.addDays(easter, d))));
        holidays.push(`${year}-12-17`);
        this.cache[year] = holidays;
        return holidays;
    }
};

function addBusinessDays(startDateStr, daysToAdd) {
    if (!startDateStr) return null;
    const parts = startDateStr.split('-');
    let currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
    let daysAdded = 0;
    while (daysAdded < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        const dateStr = HolidayCalculator.formatDate(currentDate);
        const holidays = HolidayCalculator.getHolidays(currentDate.getFullYear());
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
            daysAdded++;
        }
    }
    return HolidayCalculator.formatDate(currentDate);
}

// 3. EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: config.email,
        pass: config.password,
    },
});

async function sendImpugnacionEmail(juzgadoEmail, record, type) {
    const isCorte = type === 'CORTE';
    const destinationName = isCorte ? 'LA CORTE' : 'EL SUPERIOR';
    const subject = `🚨 ALERTA VENCIMIENTO - PARA ENVIAR A ${destinationName} - Radicado: ${record.radicado}`;
    const tableType = 'Tutela';
    const deadlineText = isCorte ? 'Vencimiento Corte (6d notificación)' : 'Vencimiento Superior (2d límite)';

    const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #dc3545; border-radius: 10px;">
      <h2 style="color: #dc3545;">🚨 Alerta de Vencimiento de Términos PARA ENVIAR A ${destinationName}</h2>
      <p>Estimado Despacho,</p>
      <p>Se ha detectado un registro con el término de envío vencido para ${destinationName}:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Tipo de Proceso:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${tableType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Radicado:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.radicado}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Accionante:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.accionante}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Accionado:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${record.accionado || '-'}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Estado Alerta:</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: red; font-weight: bold;">${deadlineText}</td></tr>
      </table>
      <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 5px solid #dc3545;">
        <strong>Acción requerida:</strong> Por favor ingrese al sistema <a href="https://sgcjuzgados.github.io/CALIDAD/" style="color: #004884; font-weight: bold; text-decoration: underline;">SGC Envigado</a>, sección <b>IMPUGNACIÓN / ENVÍO CORTE</b>, para gestionar este registro y marcarlo como enviado.
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
        console.log(`✅ Correo enviado a ${juzgadoEmail} por radicado ${record.radicado} (${type})`);
        return true;
    } catch (error) {
        console.error(`❌ Error enviando correo a ${juzgadoEmail}:`, error);
        return false;
    }
}

async function runImpugnacionNotifier() {
    console.log("🚀 Iniciando escaneo de alertas de Impugnación/Corte...");

    // Fetch users
    const usersSnap = await db.collection('users').get();
    const userEmails = {};
    usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.juzgado && data.email) {
            userEmails[data.juzgado.trim().toLowerCase()] = data.email.trim();
        }
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch recent tutelas (limit 300 to be safer, ordered by recent first)
    console.log("🔍 Consultando los últimos 300 registros de Tutelas...");
    const snapshot = await db.collection('tutelas')
        .orderBy('timestamp', 'desc')
        .limit(300)
        .get();

    if (snapshot.empty) {
        console.log("✨ No hay tutelas pendientes de envío.");
        process.exit(0);
    }

    for (const doc of snapshot.docs) {
        const record = doc.data();
        const id = doc.id;

        // Skip if already marked as sent/delivered in the app
        if (record.enviado === true) continue;

        const rad = record.radicado || "S/R";
        let shouldNotify = false;
        let alertType = "";

        const imp = (record.impugno || "").toUpperCase();

        if (imp === "SI") {
            // Case 1: Superior (Impugnado) -> Limit + 2d
            if (record.fechaLimiteImpugnacion) {
                const graceDate = addBusinessDays(record.fechaLimiteImpugnacion, 2);
                if (todayStr > graceDate) {
                    shouldNotify = true;
                    alertType = "SUPERIOR";
                }
            }
        } else if (imp === "NO") {
            // Case 2: Corte (No Impugnado) -> Notification + 6d
            if (record.notificacionFallo) {
                const graceDate = addBusinessDays(record.notificacionFallo, 6);
                if (todayStr >= graceDate) {
                    shouldNotify = true;
                    alertType = "CORTE";
                }
            }
        }

        // Only send if alert triggered and not sent before (for this specific alert type)
        // Using a composite field to avoid duplicate emails for the same state
        const alertSentField = `emailImpugnacionSent_${alertType}`;

        if (shouldNotify && !record[alertSentField]) {
            const juzgadoKey = (record.juzgado || "").trim().toLowerCase();
            const email = userEmails[juzgadoKey];

            if (email) {
                const sent = await sendImpugnacionEmail(email, record, alertType);
                if (sent) {
                    await doc.ref.update({
                        [alertSentField]: true,
                        [`emailImpugnacionSentAt_${alertType}`]: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else {
                console.warn(`⚠️ No se encontró correo para el juzgado: "${record.juzgado}" (Rad: ${record.radicado})`);
            }
        }
    }

    console.log("🏁 Proceso de notificación de impugnaciones completado.");
    process.exit(0);
}

runImpugnacionNotifier();
