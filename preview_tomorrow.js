const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Holiday Calculator to match impugnacion logic
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

async function findTomorrowAlerts() {
    const tomorrow = '2026-02-26';
    const today = '2026-02-25';

    console.log(`📅 Buscando alertas para mañana (${tomorrow})...\n`);

    const snap = await db.collection('tutelas').orderBy('timestamp', 'desc').limit(500).get();

    let findings = [];

    snap.forEach(doc => {
        const data = doc.data();
        if (data.fechaNotificacion) return; // Cerrado

        // 1. Alerta Roja (Vencimiento 10 días)
        // Se dispara si mañana (26) > diaDiez. Es decir, si diaDiez hoy (25).
        if (data.diaDiez === today && !data.emailSentRed) {
            findings.push({ rad: data.radicado, tipo: 'ROJO (10 días)', juzgado: data.juzgado });
        }

        // 2. Alerta Amarilla (7 días)
        // Se dispara si mañana (26) >= diaSiete.
        if (data.diaSiete === tomorrow && !data.emailSentYellow && !data.emailSent) {
            findings.push({ rad: data.radicado, tipo: 'AMARILLO (7 días)', juzgado: data.juzgado });
        }

        // 3. Alerta Envío Corte (6 días hábiles tras notificación)
        if (data.notificacionFallo && (data.impugno || "").toUpperCase() === "NO" && !data.emailImpugnacionSent_CORTE) {
            const graceDate = addBusinessDays(data.notificacionFallo, 6);
            if (graceDate === tomorrow) {
                findings.push({ rad: data.radicado, tipo: 'CORTE (Impugnación)', juzgado: data.juzgado });
            }
        }
    });

    if (findings.length === 0) {
        console.log("✅ No se encontraron registros que disparen alerta mañana.");
    } else {
        findings.forEach(f => {
            console.log(`📌 Radicado: ${f.rad}`);
            console.log(`   Tipo: ${f.tipo}`);
            console.log(`   Despacho: ${f.juzgado}\n`);
        });
    }

    process.exit(0);
}

findTomorrowAlerts();
