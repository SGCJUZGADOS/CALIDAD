
// ==========================================
// EXCEL IMPORT LOGIC
// ==========================================
window.handleExcelUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    if (!confirm("⚠️ ¿Estás seguro de importar este archivo? \n\nAsegúrate de que el archivo tenga las columnas correctas. Esto agregará registros a la base de datos.")) {
        input.value = ""; // Reset
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        console.log("Excel Data Raw:", jsonRows);

        if (jsonRows.length === 0) {
            alert("El archivo parece estar vacío.");
            return;
        }

        // Process Rows
        processExcelRows(jsonRows);
    };

    reader.readAsArrayBuffer(file);
    input.value = ""; // Reset for next use
};

function processExcelRows(rows) {
    const total = rows.length;
    console.log(`Iniciando importación masiva de ${total} registros...`);
    document.body.style.cursor = 'wait';

    // BATCH PROCESSING CONSTANTS
    const BATCH_SIZE = 400; // Firestore limit is 500, keeping safety margin
    let batchIndex = 0;
    let successCount = 0;
    let errorCount = 0;

    const batches = [];
    let currentBatch = db.batch();
    let currentBatchCount = 0;

    rows.forEach((row, index) => {
        // 1. EXTRACTION & NORMALIZATION
        // Flexible key matching for user's Excel columns
        const radicadoRaw = row['Radicado'] || row['radicado'] || row['RADICADO'] || row['Numero'] || Object.values(row)[0];
        const juzgadoRaw = row['Juzgado'] || row['Despacho'] || row['JUZGADO'] || row['DESPACHO'] || row['Juzgado Destino'] || "Sin Asignar";
        const fechaRaw = row['Fecha'] || row['FECHA'] || row['Fecha Reparto'] || row['FechaReparto'];

        // 2. VALIDATION
        const radicadoClean = extractRadicado(radicadoRaw);
        if (!radicadoRaw || radicadoClean.length < 23) {
            console.warn(`Fila ${index + 2} omitida en Excel: Radicado inválido o incompleto (${radicadoRaw})`, row);
            errorCount++;
            return;
        }

        // 3. DATE PARSING
        let fechaParsed = parseExcelDate(fechaRaw);
        if (!fechaParsed) {
            // Fallback: If no date, use today but warn
            fechaParsed = new Date().toISOString().split('T')[0];
            console.warn(`Fila ${index + 2}: Fecha desconocida, usando hoy.`, row);
        }

        // 4. OBJECT CONSTRUCTION
        const assignedJuzgado = matchJuzgado(juzgadoRaw); // Normalized Name

        const newDoc = {
            radicado: radicadoClean,
            fechaReparto: fechaParsed,
            accionante: (row['Accionante'] || row['ACCIONANTE'] || row['Demandante'] || "Desconocido").toString().toUpperCase(),
            accionado: (row['Accionado'] || row['ACCIONADO'] || row['Demandado'] || "Desconocido").toString().toUpperCase(),

            // IMPORTANT: Guardar en AMBOS campos para compatibilidad de visualización y lógica
            juzgadoDestino: assignedJuzgado,
            juzgado: assignedJuzgado, // Campo crítico para que el usuario 'juz01...' pueda verlo

            // Optional fields (try to catch them if they exist)
            idAccionante: (row['IdAccionante'] || row['Cedula'] || row['Nit'] || "").toString(),
            idAccionado: (row['IdAccionado'] || "").toString(),
            observaciones: (row['Observaciones'] || row['OBSERVACIONES'] || row['Notas'] || "").toString(),
            derecho: (row['Derecho'] || row['DERECHO'] || "").toString().toUpperCase(),

            // System Defaults
            archivado: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Server time for creation
        };

        // 5. ADD TO BATCH
        // Use set with merge to update existing but preserve other fields if any
        const docRef = db.collection(currentCollection).doc(newDoc.radicado); // Use ID as Radicado

        // Firestore Batch supports max 500 ops. We use 400.
        // Note: batch.set() is correct.
        currentBatch.set(docRef, newDoc, { merge: true });

        currentBatchCount++;
        successCount++;

        // If batch is full, push to queue and start new one
        if (currentBatchCount >= BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            currentBatchCount = 0;
        }
    });

    // Push final partial batch if exists
    if (currentBatchCount > 0) {
        batches.push(currentBatch);
    }

    // ... execution logic remains same ...
    executeBatches(batches, total, successCount, errorCount);
}

// Helper to execute batches (Refactored for clarity)
function executeBatches(batches, total, successCount, errorCount) {
    if (batches.length > 0) {
        console.log(`Procesando ${batches.length} lotes de escritura...`);
        let chain = Promise.resolve();

        batches.forEach((batch, i) => {
            chain = chain.then(() => {
                console.log(`Escribiendo lote ${i + 1}/${batches.length}...`);
                return batch.commit();
            });
        });

        chain.then(() => {
            document.body.style.cursor = 'default';
            alert(`✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE\n\n` +
                `• Registros procesados: ${total}\n` +
                `• Guardados/Actualizados: ${successCount}\n` +
                `• Omitidos (Errores): ${errorCount}`);

            // Force Reload
            if (typeof filterAndRender === 'function') filterAndRender();

        }).catch(err => {
            console.error("Error batch:", err);
            alert("❌ Error guardando datos. Revisa consola.");
            document.body.style.cursor = 'default';
        });

    } else {
        alert("No se encontraron registros válidos.");
        document.body.style.cursor = 'default';
    }
}

// Helper to clean radicado
function extractRadicado(val) {
    if (!val) return "";
    return String(val).replace(/[^0-9]/g, ''); // Keep only numbers
}

// Helper to parse Excel dates
function parseExcelDate(excelDate) {
    if (!excelDate) return null;
    // ... (existing date logic is fine) ...
    // If it's a string YYYY-MM-DD
    if (typeof excelDate === 'string' && excelDate.includes('-')) return excelDate;

    // If it's Excel Number
    if (!isNaN(excelDate)) {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0]; // Fallback today
}

// Helper to normalize Juzgado names to our Data standard
function matchJuzgado(rawName) {
    if (!rawName) return "Oficina de Reparto";
    const clean = String(rawName).toLowerCase().trim();

    // 1. Try Exact Match in Data
    if (typeof initialJuzgadosData !== 'undefined') {
        // Direct match
        const exact = initialJuzgadosData.find(j => j.name.toLowerCase() === clean);
        if (exact) return exact.name;

        // Code match (if excel has '001', '002' etc)
        // Fuzzy Match by key words
        // Example: "Juzgado 01 Civil Municipal" -> "Juzgado Primero Civil Municipal..."

        // Map common numbers to words
        let search = clean;
        search = search.replace("01", "primero").replace("1o", "primero").replace(" 1 ", " primero ");
        search = search.replace("02", "segundo").replace("2o", "segundo").replace(" 2 ", " segundo ");
        search = search.replace("03", "tercero").replace("3o", "tercero").replace(" 3 ", " tercero ");
        search = search.replace("04", "cuarto").replace("4o", "cuarto").replace(" 4 ", " cuarto ");

        // Find best match in list
        const bestMatch = initialJuzgadosData.find(j => {
            const jName = j.name.toLowerCase();
            // Check if key parts exist
            if (clean.includes("civil") && !jName.includes("civil")) return false;
            if (clean.includes("penal") && !jName.includes("penal")) return false;
            if (clean.includes("familia") && !jName.includes("familia")) return false;
            if (clean.includes("laboral") && !jName.includes("laboral")) return false;

            // Check number
            if (search.includes("primero") && jName.includes("primero")) return true;
            if (search.includes("segundo") && jName.includes("segundo")) return true;
            if (search.includes("tercero") && jName.includes("tercero")) return true;
            if (search.includes("cuarto") && jName.includes("cuarto")) return true;

            return false;
        });

        if (bestMatch) return bestMatch.name;
    }

    // Default return raw if no better match (user will have to fix manually or we create a 'Sin Asignar' bucket?)
    // Better to return raw so admin can see it
    return rawName;
}
