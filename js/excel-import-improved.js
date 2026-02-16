// ==========================================
// IMPORTACIÓN EXCEL MEJORADA
// ==========================================
// Versión mejorada con progreso visual y validaciones

window.handleExcelUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        Notify.error('⚠️ Formato inválido. Solo archivos .xlsx o .xls');
        input.value = '';
        return;
    }

    // Confirmación
    if (!confirm(
        `⚠️ CONFIRMACIÓN DE IMPORTACIÓN\n\n` +
        `Archivo: ${file.name}\n` +
        `Tamaño: ${(file.size / 1024).toFixed(2)} KB\n\n` +
        `¿Continuar con la importación?`
    )) {
        input.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Leer primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convertir a JSON
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            console.log('📊 Excel Data:', jsonRows);

            if (jsonRows.length === 0) {
                Notify.warning('El archivo está vacío');
                input.value = '';
                return;
            }

            // Mostrar modal de progreso
            Progress.show('Validando datos...');

            // Procesar después de un breve delay para que se muestre el modal
            setTimeout(() => {
                processExcelRowsImproved(jsonRows, file.name);
            }, 100);

        } catch (error) {
            console.error('Error leyendo Excel:', error);
            Notify.error('Error al leer el archivo Excel');
        }
    };

    reader.onerror = function() {
        Notify.error('Error al cargar el archivo');
    };

    reader.readAsArrayBuffer(file);
    input.value = ''; // Reset para permitir re-upload del mismo archivo
};

// ============================================
// PROCESAMIENTO MEJORADO CON VALIDACIONES
// ============================================
function processExcelRowsImproved(rows, fileName) {
    const total = rows.length;
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    Progress.update(5, `Procesando ${total} registros...`, 0, total);

    // Constantes para batch
    const BATCH_SIZE = 400;
    const batches = [];
    let currentBatch = db.batch();
    let currentBatchCount = 0;

    rows.forEach((row, index) => {
        try {
            // 1. EXTRACCIÓN
            const radicadoRaw = row['Radicado'] || row['radicado'] || row['RADICADO'] || 
                               row['Numero'] || Object.values(row)[0];
            const juzgadoRaw = row['Juzgado'] || row['Despacho'] || row['JUZGADO'] || 
                              row['DESPACHO'] || row['Juzgado Destino'] || "Sin Asignar";
            const fechaRaw = row['Fecha'] || row['FECHA'] || row['Fecha Reparto'] || 
                            row['FechaReparto'];

            // 2. VALIDACIÓN RADICADO
            const radicadoClean = extractRadicado(radicadoRaw);
            if (!radicadoRaw || radicadoClean.length !== 23) {
                errors.push({
                    row: index + 2,
                    error: `Radicado inválido: "${radicadoRaw}"`,
                    data: row
                });
                errorCount++;
                return;
            }

            // 3. VALIDACIÓN FECHA
            let fechaParsed = parseExcelDate(fechaRaw);
            if (!fechaParsed) {
                // Si no hay fecha, usar hoy pero registrar advertencia
                fechaParsed = new Date().toISOString().split('T')[0];
                console.warn(`⚠️ Fila ${index + 2}: Usando fecha actual`);
            }

            // 4. NORMALIZAR JUZGADO
            const assignedJuzgado = matchJuzgado(juzgadoRaw);

            // 5. CONSTRUCCIÓN DEL DOCUMENTO
            const newDoc = {
                radicado: radicadoClean,
                fechaReparto: fechaParsed,
                accionante: String(row['Accionante'] || row['ACCIONANTE'] || 
                                  row['Demandante'] || "DESCONOCIDO").toUpperCase(),
                accionado: String(row['Accionado'] || row['ACCIONADO'] || 
                                 row['Demandado'] || "DESCONOCIDO").toUpperCase(),
                
                // Campos de juzgado (ambos para compatibilidad)
                juzgadoDestino: assignedJuzgado,
                juzgado: assignedJuzgado,
                
                // Campos opcionales
                idAccionante: String(row['IdAccionante'] || row['Cedula'] || 
                                   row['Nit'] || "").trim(),
                idAccionado: String(row['IdAccionado'] || "").trim(),
                observaciones: String(row['Observaciones'] || row['OBSERVACIONES'] || 
                                    row['Notas'] || "").trim(),
                derecho: String(row['Derecho'] || row['DERECHO'] || "").toUpperCase(),
                
                // Campos del sistema
                archivado: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                importedFrom: fileName,
                importedAt: new Date().toISOString()
            };

            // 6. AGREGAR AL BATCH
            const docRef = db.collection(currentCollection).doc(newDoc.radicado);
            currentBatch.set(docRef, newDoc, { merge: true });
            
            currentBatchCount++;
            successCount++;
            processed++;

            // Actualizar progreso
            const progress = (processed / total) * 90; // Dejar 10% para escritura final
            Progress.update(
                progress, 
                `Procesando registros... ${processed}/${total}`,
                processed,
                total
            );

            // Si el batch está lleno, guardarlo
            if (currentBatchCount >= BATCH_SIZE) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                currentBatchCount = 0;
            }

        } catch (error) {
            console.error(`Error en fila ${index + 2}:`, error);
            errors.push({
                row: index + 2,
                error: error.message,
                data: row
            });
            errorCount++;
        }
    });

    // Agregar último batch si existe
    if (currentBatchCount > 0) {
        batches.push(currentBatch);
    }

    // Ejecutar batches
    executeBatchesImproved(batches, total, successCount, errorCount, errors);
}

// ============================================
// EJECUCIÓN DE BATCHES CON PROGRESO
// ============================================
function executeBatchesImproved(batches, total, successCount, errorCount, errors) {
    if (batches.length === 0) {
        Progress.close();
        Notify.warning('No hay registros válidos para importar');
        return;
    }

    Progress.update(90, `Guardando en base de datos... (${batches.length} lotes)`);

    let chain = Promise.resolve();
    let batchesCompleted = 0;

    batches.forEach((batch, i) => {
        chain = chain.then(() => {
            batchesCompleted++;
            const progress = 90 + (batchesCompleted / batches.length) * 10;
            Progress.update(
                progress,
                `Escribiendo lote ${i + 1}/${batches.length}...`
            );
            return batch.commit();
        });
    });

    chain.then(() => {
        Progress.close();

        // Mostrar resultados
        const successMessage = `
            ✅ IMPORTACIÓN COMPLETADA
            
            • Total procesado: ${total}
            • Guardados: ${successCount}
            • Errores: ${errorCount}
        `;

        if (errorCount > 0) {
            console.warn('⚠️ Errores detectados:', errors);
            Notify.warning(successMessage + `\n\n⚠️ Revisa la consola para ver ${errorCount} errores`, 8000);
            
            // Generar reporte de errores
            downloadErrorReport(errors);
        } else {
            Notify.success(successMessage, 6000);
        }

        // Recargar datos
        if (typeof filterAndRender === 'function') {
            filterAndRender();
        }

    }).catch(err => {
        console.error('❌ Error en batch:', err);
        Progress.close();
        Notify.error('Error guardando datos. Revisa la consola.');
    });
}

// ============================================
// GENERAR REPORTE DE ERRORES
// ============================================
function downloadErrorReport(errors) {
    if (errors.length === 0) return;

    const errorData = [
        ['Fila', 'Error', 'Datos']
    ];

    errors.forEach(err => {
        errorData.push([
            err.row,
            err.error,
            JSON.stringify(err.data)
        ]);
    });

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(errorData);
        ws['!cols'] = [{wch: 10}, {wch: 40}, {wch: 80}];
        XLSX.utils.book_append_sheet(wb, ws, 'Errores');
        
        const fileName = `SGC_Errores_Importacion_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log(`📄 Reporte de errores descargado: ${fileName}`);
    } catch (error) {
        console.error('Error generando reporte:', error);
    }
}

// ============================================
// HELPERS (Ya existían pero los mejoramos)
// ============================================
function extractRadicado(val) {
    if (!val) return "";
    const cleaned = String(val).replace(/[^0-9]/g, '');
    return cleaned.padStart(23, '0'); // Rellenar con ceros si es necesario
}

function parseExcelDate(excelDate) {
    if (!excelDate) return null;

    // Si ya es string en formato correcto
    if (typeof excelDate === 'string') {
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
            return excelDate;
        }
        // DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(excelDate)) {
            const [d, m, y] = excelDate.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }

    // Si es número de Excel
    if (!isNaN(excelDate) && excelDate > 0) {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
}

function matchJuzgado(rawName) {
    if (!rawName || rawName === "Sin Asignar") return "Oficina de Reparto";
    
    const clean = String(rawName).toLowerCase().trim();

    // Búsqueda exacta
    if (typeof initialJuzgadosData !== 'undefined') {
        const exact = initialJuzgadosData.find(j => 
            j.name.toLowerCase() === clean
        );
        if (exact) return exact.name;

        // Mapeo de números
        let search = clean
            .replace(/\b01\b|1o|\b1\b/g, 'primero')
            .replace(/\b02\b|2o|\b2\b/g, 'segundo')
            .replace(/\b03\b|3o|\b3\b/g, 'tercero')
            .replace(/\b04\b|4o|\b4\b/g, 'cuarto')
            .replace(/\b05\b|5o|\b5\b/g, 'quinto');

        // Búsqueda difusa por palabras clave
        const bestMatch = initialJuzgadosData.find(j => {
            const jName = j.name.toLowerCase();
            
            // Verificar que coincidan las palabras clave importantes
            const keywords = ['civil', 'penal', 'familia', 'laboral', 'pequeñas'];
            for (const keyword of keywords) {
                if (clean.includes(keyword) !== jName.includes(keyword)) {
                    return false;
                }
            }

            // Verificar número
            const numbers = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto'];
            for (const num of numbers) {
                if (search.includes(num) && jName.includes(num)) {
                    return true;
                }
            }

            return false;
        });

        if (bestMatch) return bestMatch.name;
    }

    // Si no encuentra coincidencia, devolver el valor original con advertencia
    console.warn(`⚠️ Juzgado no reconocido: "${rawName}". Se guardará como está.`);
    return rawName;
}
