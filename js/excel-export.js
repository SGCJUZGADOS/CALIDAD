// ==========================================
// EXPORTACIÓN A EXCEL MEJORADA
// ==========================================
// Exporta datos con formato, estilos y múltiples hojas

window.exportToExcel = function () {
    // Verificar que XLSX esté disponible
    if (typeof XLSX === 'undefined') {
        Notify.error('Error: Librería XLSX no cargada');
        return;
    }

    // Obtener datos actuales filtrados
    const tableBody = document.getElementById('terminosTableBody');
    if (!tableBody || tableBody.children.length === 0) {
        Notify.warning('No hay datos para exportar');
        return;
    }

    try {
        Notify.loading('Preparando exportación...');

        // Crear workbook
        const wb = XLSX.utils.book_new();

        // ============================================
        // HOJA 1: DATOS PRINCIPALES
        // ============================================
        const data = [];
        const rows = tableBody.querySelectorAll('tr');

        // Headers
        const headers = [
            'Radicado',
            'Accionante',
            'Doc. Id. Accionante',
            'Accionado',
            'Doc. Id. Accionado',
            'Juzgado Asignado',
            'Fecha Reparto',
            'Fecha Fallo',
            'Día 10',
            '¿Cumplió?',
            'Alerta',
            'Decisión',
            'Derecho',
            'Género',
            'Impugnó',
            'Observaciones'
        ];

        data.push(headers);

        // Datos
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const rowData = [
                    cells[2]?.textContent.trim() || '', // Radicado (Index 2 in table)
                    cells[3]?.textContent.trim() || '', // Accionante (Index 3)
                    cells[4]?.textContent.trim() || '', // Doc Accionante (Index 4)
                    cells[5]?.textContent.trim() || '', // Accionado (Index 5)
                    cells[6]?.textContent.trim() || '', // Doc Accionado (Index 6)
                    cells[1]?.textContent.trim() || '', // Juzgado (Index 1)
                    cells[0]?.textContent.trim() || '', // F. Reparto (Index 0)
                    cells[8]?.textContent.trim() || '', // F. Fallo (Index 8)
                    cells[9]?.textContent.trim() || '', // Día 10 (Index 9)
                    cells[10]?.textContent.trim() || '', // Cumplió (Index 10)
                    cells[11]?.textContent.trim() || '', // Alerta (Index 11)
                    cells[12]?.textContent.trim() || '', // Decisión (Index 12)
                    cells[13]?.textContent.trim() || '', // Derecho (Index 13)
                    cells[14]?.textContent.trim() || '', // Género (Index 14)
                    cells[15]?.textContent.trim() || '', // Impugnó (Index 15)
                    ''  // Observaciones (Not in standard table)
                ];
                data.push(rowData);
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 25 }, // Radicado
            { wch: 30 }, // Accionante
            { wch: 15 }, // Doc Accionante
            { wch: 30 }, // Accionado
            { wch: 15 }, // Doc Accionado
            { wch: 40 }, // Juzgado
            { wch: 12 }, // F. Reparto
            { wch: 12 }, // F. Fallo
            { wch: 12 }, // Día 10
            { wch: 10 }, // Cumplió
            { wch: 10 }, // Alerta
            { wch: 15 }, // Decisión
            { wch: 20 }, // Derecho
            { wch: 10 }, // Género
            { wch: 10 }, // Impugnó
            { wch: 30 }  // Observaciones
        ];
        ws['!cols'] = colWidths;

        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');

        // ============================================
        // HOJA 2: ESTADÍSTICAS RESUMEN
        // ============================================
        const statsData = [
            ['ESTADÍSTICAS DE EXPORTACIÓN'],
            [''],
            ['Total de Registros', data.length - 1], // -1 para no contar header
            ['Fecha de Exportación', new Date().toLocaleDateString('es-CO')],
            ['Hora de Exportación', new Date().toLocaleTimeString('es-CO')],
            ['Usuario', currentUser.username || 'N/A'],
            ['Colección', currentCollection === 'tutelas' ? 'Tutelas' : 'Demandas'],
            [''],
            ['DESGLOSE POR CUMPLIMIENTO'],
            ['Cumplió', countByStatus('SI')],
            ['No Cumplió', countByStatus('NO')],
            ['Pendiente', countByStatus('PENDIENTE')],
        ];

        const wsStats = XLSX.utils.aoa_to_sheet(statsData);
        wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

        // ============================================
        // GENERAR ARCHIVO
        // ============================================
        const fileName = `SGC_${currentCollection}_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;

        XLSX.writeFile(wb, fileName);

        Notify.success(`✅ Archivo exportado: ${fileName}`, 4000);

    } catch (error) {
        console.error('Error exportando:', error);
        Notify.error('Error al exportar archivo. Revisa la consola.');
    }
};

// Helper: Contar registros por estado
function countByStatus(status) {
    const rows = document.querySelectorAll('#terminosTableBody tr');
    let count = 0;
    rows.forEach(row => {
        const cumplioCell = row.querySelector('td:nth-child(11)'); // Columna "¿Cumplió?"
        if (cumplioCell && cumplioCell.textContent.trim() === status) {
            count++;
        }
    });
    return count;
}

// ============================================
// EXPORTAR PLANTILLA EXCEL PARA IMPORTACIÓN
// ============================================
window.exportTemplate = function () {
    try {
        const wb = XLSX.utils.book_new();

        const templateData = [
            [
                'Radicado',
                'Juzgado',
                'Fecha',
                'Accionante',
                'IdAccionante',
                'Accionado',
                'IdAccionado',
                'Derecho',
                'Observaciones'
            ],
            [
                '05266400300220260015900',
                'Juzgado Primero Civil Municipal de Envigado',
                '2026-02-06',
                'JUAN PEREZ',
                '123456789',
                'EMPRESA XYZ',
                '900123456',
                'SALUD',
                'Ejemplo de registro'
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        ws['!cols'] = [
            { wch: 25 }, // Radicado
            { wch: 45 }, // Juzgado
            { wch: 12 }, // Fecha
            { wch: 30 }, // Accionante
            { wch: 15 }, // IdAccionante
            { wch: 30 }, // Accionado
            { wch: 15 }, // IdAccionado
            { wch: 20 }, // Derecho
            { wch: 30 }  // Observaciones
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

        // Hoja de instrucciones
        const instrData = [
            ['INSTRUCCIONES DE USO'],
            [''],
            ['1. Complete la columna "Radicado" con el número de radicado de 23 dígitos'],
            ['2. Seleccione el juzgado de la lista oficial (ver hoja "Juzgados")'],
            ['3. Use formato de fecha: AAAA-MM-DD (ejemplo: 2026-02-06)'],
            ['4. Complete los demás campos según corresponda'],
            ['5. Guarde el archivo y súbalo usando el botón "Importar Excel"'],
            [''],
            ['NOTAS IMPORTANTES:'],
            ['• El radicado debe tener exactamente 23 dígitos'],
            ['• Los nombres de juzgados deben coincidir EXACTAMENTE con la lista oficial'],
            ['• Las fechas deben estar en formato AAAA-MM-DD'],
            ['• Los campos vacíos se llenarán con valores por defecto'],
        ];

        const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
        wsInstr['!cols'] = [{ wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');

        // Hoja de juzgados oficiales
        const juzgadosData = [['LISTA OFICIAL DE JUZGADOS'], ['']];
        initialJuzgadosData.forEach(j => {
            juzgadosData.push([j.name]);
        });

        const wsJuz = XLSX.utils.aoa_to_sheet(juzgadosData);
        wsJuz['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsJuz, 'Juzgados');

        XLSX.writeFile(wb, 'SGC_Plantilla_Importacion.xlsx');

        Notify.success('✅ Plantilla descargada correctamente');

    } catch (error) {
        console.error('Error exportando plantilla:', error);
        Notify.error('Error al crear plantilla');
    }
};
