const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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

async function checkJuzgadoAlerts() {
    const targetJuzgado = "Juzgado Segundo Civil del Circuito de Envigado";
    const tomorrow = "2026-02-26";

    console.log(`🔍 Buscando alertas de mañana para: ${targetJuzgado}`);

    const snap = await db.collection('tutelas').where('juzgado', '==', targetJuzgado).get();

    let findings = [];

    snap.forEach(doc => {
        const data = doc.data();
        if (data.fechaNotificacion && (data.impugno || "").toUpperCase() === "") return;

        // Amarillo (7 días)
        if (data.diaSiete === tomorrow && !data.emailSentYellow && !data.emailSent) {
            findings.push({ rad: data.radicado, tipo: 'ALERTA 7 DÍAS (AMARILLO)' });
        }

        // Rojo (10 días)
        if (data.diaDiez === tomorrow && !data.emailSentRed) {
            findings.push({ rad: data.radicado, tipo: 'VENCIMIENTO 10 DÍAS (ROJO)' });
        }

        // Impugnación
        const imp = (data.impugno || "").toUpperCase();
        if (imp === "SI" && data.fechaLimiteImpugnacion) {
            const grace = addBusinessDays(data.fechaLimiteImpugnacion, 2);
            if (grace === tomorrow && !data.emailImpugnacionSent_SUPERIOR) {
                findings.push({ rad: data.radicado, tipo: 'ENVÍO AL SUPERIOR' });
            }
        } else if (imp === "NO" && data.notificacionFallo) {
            const grace = addBusinessDays(data.notificacionFallo, 6);
            if (grace === tomorrow && !data.emailImpugnacionSent_CORTE) {
                findings.push({ rad: data.radicado, tipo: 'ENVÍO A LA CORTE' });
            }
        }
    });

    if (findings.length === 0) {
        console.log("No se encontraron coincidencias directas para mañana.");
    } else {
        findings.forEach(f => console.log(`✅ [${f.tipo}] Radicado: ${f.rad}`));
    }
    process.exit(0);
}

checkJuzgadoAlerts();
