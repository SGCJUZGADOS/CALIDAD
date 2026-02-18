// ==========================================
// RESPALDO: LÓGICA DE PROCESAMIENTO DE ACTA (PDF)
// ==========================================
// Este archivo sirve como referencia y respaldo de la lógica de extracción de datos
// desde el Acta de Reparto PDF, incluyendo el mapeo de juzgados.

window.processActaPDF = async function (input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const statusSpan = document.getElementById('pdfStatus');
    statusSpan.textContent = "⏳ Analizando PDF...";
    statusSpan.style.color = "#004884";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item.str);
        const fullText = textItems.join(" ");

        // 1. RADICADO (23 Digits)
        let radicadoMatch = fullText.match(/\b(\d{23})\b/);
        if (radicadoMatch) {
            const fullRad = radicadoMatch[1];
            const radInput = document.getElementById('radicadoResto');
            if (radInput) radInput.value = fullRad;
        }

        // 2. FECHA REPARTO
        const dateMatch = fullText.match(/FECHA REPARTO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            const [d, m, y] = dateStr.split('/');
            const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            const dateInput = document.getElementById('fechaReparto');
            if (dateInput) {
                dateInput.value = isoDate;
                dateInput.dispatchEvent(new Event('change'));
            }
        }

        // 3. JUZGADO
        let juzgadoMatch = fullText.match(/REPARTIDO AL DESPACHO[:\s]+(.*?)(?=\s+JUEZ|\s+NUMERO|\s+RADICACIO|\s+FECHA|$)/i);
        if (!juzgadoMatch) {
            juzgadoMatch = fullText.match(/DESPACHO[:\s]+(.*?)(?=\s+JUEZ|\s+NUMERO|$)/i);
        }
        if (juzgadoMatch) {
            let juzgadoPDF = juzgadoMatch[1].trim().replace("JUEZ / MAGISTRADO:", "").trim().replace(/_/g, " ").trim();
            if (!mapAndSelectJuzgado(juzgadoPDF)) {
                scanFullTextForJuzgado(fullText);
            }
        } else {
            scanFullTextForJuzgado(fullText);
        }

        // 4. ACCIONANTE & 5. ACCIONADO (Lógica de extracción compleja omitida por brevedad en este comentario, ver archivo script.js para detalle)
        // ... Lógica de búsqueda reversa por ID ...

        statusSpan.textContent = "✅ Datos cargados!";
        statusSpan.style.color = "green";

    } catch (e) {
        console.error("PDF Parse Error:", e);
        statusSpan.textContent = "❌ Error al leer PDF";
    }
}

// ... Resto de funciones auxiliares (mapAndSelectJuzgado, scanFullTextForJuzgado, selectOptionByText) ...
