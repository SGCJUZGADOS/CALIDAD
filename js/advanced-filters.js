// ==========================================
// FILTROS AVANZADOS
// ==========================================
// Sistema mejorado de filtrado con múltiples criterios

const AdvancedFilters = {
    // Estado actual de filtros
    currentFilters: {
        searchTerm: '',
        juzgado: '',
        fechaInicio: '',
        fechaFin: '',
        cumplimiento: '',
        decision: '',
        derecho: '',
        archivado: false,
        radicadoEspecfico: ''
    },

    // Inicializar sistema de filtros
    init() {
        console.log('🚀 Inicializando Sistema de Filtros Avanzados...');
        this.createFilterPanel();
        this.attachEventListeners();
    },

    // Crear panel de filtros avanzados
    createFilterPanel() {
        const existingFilters = document.querySelector('.table-toolbar');
        if (!existingFilters) return;

        // Agregar botón de filtros avanzados
        const advancedBtn = document.createElement('button');
        advancedBtn.id = 'advancedFiltersBtn';
        advancedBtn.className = 'btn-premium btn-premium-gray';
        advancedBtn.innerHTML = '<i class="fas fa-filter"></i> Filtros Avanzados';
        // Estilo manual removido para usar clase .btn-premium
        advancedBtn.style.cssText = '';
        advancedBtn.onclick = () => this.toggleAdvancedPanel();

        // Insertar antes del botón de exportar si existe, o al final
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.parentNode.insertBefore(advancedBtn, exportBtn);
        } else {
            existingFilters.appendChild(advancedBtn);
        }

        // Crear panel expandible
        const panel = document.createElement('div');
        panel.id = 'advancedFiltersPanel';
        panel.style.cssText = `
            display: none;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border: 2px solid #dee2e6;
            animation: slideDown 0.3s ease;
        `;

        panel.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                
                <!-- Rango de Fechas -->
                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-calendar-alt"></i> Fecha Inicio
                    </label>
                    <input type="date" id="filterFechaInicio" class="form-control">
                </div>

                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-calendar-alt"></i> Fecha Fin
                    </label>
                    <input type="date" id="filterFechaFin" class="form-control">
                </div>

                <!-- Cumplimiento -->
                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-check-circle"></i> Cumplimiento
                    </label>
                    <select id="filterCumplimiento" class="form-control">
                        <option value="">Todos</option>
                        <option value="SI">Cumplió</option>
                        <option value="NO">No Cumplió</option>
                        <option value="PENDIENTE">Pendiente</option>
                    </select>
                </div>

                <!-- Decisión -->
                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-gavel"></i> Decisión
                    </label>
                    <select id="filterDecision" class="form-control">
                        <option value="">Todas</option>
                        <option value="CONCEDE">Concede</option>
                        <option value="NIEGA">Niega</option>
                        <option value="CONCEDE PARCIALMENTE">Concede Parcialmente</option>
                        <option value="PENDIENTE">Pendiente</option>
                    </select>
                </div>

                <!-- Derecho -->
                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-balance-scale"></i> Derecho
                    </label>
                    <select id="filterDerecho" class="form-control">
                        <option value="">Todos</option>
                        <option value="SALUD">Salud</option>
                        <option value="DEBIDO PROCESO">Debido Proceso</option>
                        <option value="PETICIÓN">Petición</option>
                        <option value="MÍNIMO VITAL">Mínimo Vital</option>
                        <option value="EDUCACIÓN">Educación</option>
                        <option value="VIVIENDA">Vivienda</option>
                        <option value="OTROS">Otros</option>
                    </select>
                </div>

                <!-- Archivados -->
                <div>
                    <label style="font-weight: 600; margin-bottom: 8px; display: block; color: #495057;">
                        <i class="fas fa-archive"></i> Estado
                    </label>
                    <select id="filterArchivado" class="form-control">
                        <option value="activos">Solo Activos</option>
                        <option value="archivados">Solo Archivados</option>
                        <option value="todos">Todos</option>
                    </select>
                </div>

            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                <button onclick="AdvancedFilters.applyFilters()" class="btn-primary" style="background: #007bff;">
                    <i class="fas fa-search"></i> Aplicar Filtros
                </button>
                <button onclick="AdvancedFilters.clearFilters()" class="btn-secondary" style="background: #6c757d;">
                    <i class="fas fa-times"></i> Limpiar
                </button>
            </div>

            <div id="filterStats" style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; display: none;">
                <strong>Resultados:</strong> <span id="filterCount">0</span> registros encontrados
            </div>
        `;

        existingFilters.parentElement.insertBefore(panel, existingFilters.nextSibling);

        // Agregar estilos CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    },

    // Mostrar/ocultar panel
    toggleAdvancedPanel() {
        const panel = document.getElementById('advancedFiltersPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    },

    // Adjuntar event listeners
    attachEventListeners() {
        // Enter key en campos de texto
        const textInputs = ['filterFechaInicio', 'filterFechaFin'];
        textInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.applyFilters();
                });
            }
        });

        // Auto-aplicar al cambiar selects
        const selects = ['filterCumplimiento', 'filterDecision', 'filterDerecho', 'filterArchivado'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.applyFilters());
            }
        });
    },
    // Aplicar filtros
    applyFilters() {
        // Recolectar valores
        this.currentFilters = {
            searchTerm: document.getElementById('searchInput')?.value.toLowerCase() || '',
            juzgado: document.getElementById('filterJuzgadoTabla')?.value || '',
            fechaInicio: document.getElementById('filterFechaInicio')?.value || '',
            fechaFin: document.getElementById('filterFechaFin')?.value || '',
            cumplimiento: document.getElementById('filterCumplimiento')?.value || '',
            decision: document.getElementById('filterDecision')?.value || '',
            derecho: document.getElementById('filterDerecho')?.value || '',
            archivado: document.getElementById('filterArchivado')?.value || 'activos',
            radicadoEspecfico: document.getElementById('filterRadicadoAnio')?.value || ''
        };

        console.log('🔍 Aplicando filtros:', this.currentFilters);

        // Llamar a función de filtrado existente
        if (typeof filterAndRender === 'function') {
            filterAndRender();
        }

        // Mostrar estadísticas
        this.updateFilterStats();
    },

    // Limpiar todos los filtros
    clearFilters() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        const filterJuzgado = document.getElementById('filterJuzgadoTabla');
        if (filterJuzgado) filterJuzgado.value = '';

        const filterFecha = document.getElementById('filterFecha');
        if (filterFecha) filterFecha.value = '';

        document.getElementById('filterFechaInicio').value = '';
        document.getElementById('filterFechaFin').value = '';
        document.getElementById('filterCumplimiento').value = '';
        document.getElementById('filterDecision').value = '';
        document.getElementById('filterDerecho').value = '';
        document.getElementById('filterArchivado').value = 'activos';

        this.currentFilters = {
            searchTerm: '',
            juzgado: '',
            fechaInicio: '',
            fechaFin: '',
            cumplimiento: '',
            decision: '',
            derecho: '',
            archivado: false
        };

        Notify.info('Filtros limpiados');

        if (typeof filterAndRender === 'function') {
            filterAndRender();
        }
    },

    // Actualizar estadísticas de filtrado
    updateFilterStats() {
        const statsEl = document.getElementById('filterStats');
        const countEl = document.getElementById('filterCount');
        const tableBody = document.getElementById('terminosTableBody');

        if (statsEl && countEl && tableBody) {
            const visibleRows = tableBody.querySelectorAll('tr:not([style*="display: none"])').length;
            countEl.textContent = visibleRows;
            statsEl.style.display = 'block';
        }
    },

    // Función auxiliar para filtrar datos
    matchesFilters(doc) {
        const data = doc.data ? doc.data() : doc;

        // Filtro de búsqueda
        if (this.currentFilters.searchTerm) {
            const searchLower = this.currentFilters.searchTerm;
            const matchesSearch =
                data.radicado?.toLowerCase().includes(searchLower) ||
                data.accionante?.toLowerCase().includes(searchLower) ||
                data.accionado?.toLowerCase().includes(searchLower) ||
                data.asignadoA?.toLowerCase().includes(searchLower) ||
                data.observaciones?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;
        }

        // Filtro de juzgado (DESPACHO)
        if (this.currentFilters.juzgado) {
            const filterJuz = this.currentFilters.juzgado.toLowerCase().trim();
            const juzgadoDoc = (data.asignadoA || data.juzgado || data.juzgadoDestino || "").toLowerCase().trim();

            // Si el nombre del juzgado en el documento no contiene el filtro, falla
            if (!juzgadoDoc.includes(filterJuz) && !filterJuz.includes(juzgadoDoc)) {
                return false;
            }
        }

        // Filtro de rango de fechas
        if (this.currentFilters.fechaInicio || this.currentFilters.fechaFin) {
            const fechaDoc = data.fechaReparto;
            if (this.currentFilters.fechaInicio && fechaDoc < this.currentFilters.fechaInicio) {
                return false;
            }
            if (this.currentFilters.fechaFin && fechaDoc > this.currentFilters.fechaFin) {
                return false;
            }
        }

        // Filtro de cumplimiento
        if (this.currentFilters.cumplimiento) {
            if (data.cumplioTermino !== this.currentFilters.cumplimiento) return false;
        }

        // Filtro de decisión
        if (this.currentFilters.decision) {
            if (data.decision !== this.currentFilters.decision) return false;
        }

        // Filtro de derecho
        if (this.currentFilters.derecho) {
            if (data.derecho !== this.currentFilters.derecho) return false;
        }

        // Filtro de archivado
        if (this.currentFilters.archivado === 'activos' && data.archivado) return false;
        if (this.currentFilters.archivado === 'archivados' && !data.archivado) return false;

        // Filtro específico radicado (Año y Consecutivo - Posiciones 13 a 23)
        if (this.currentFilters.radicadoEspecfico) {
            const searchPart = this.currentFilters.radicadoEspecfico.trim();
            const radDoc = data.radicado || "";
            // La posición 13 en un radicado de 23 dígitos es el índice 12 (0-based)
            // Tomamos desde el índice 12 hasta el final
            const radPartShort = radDoc.substring(12);
            if (!radPartShort.includes(searchPart)) return false;
        }

        return true;
    }
};

// Exportar para uso global
window.AdvancedFilters = AdvancedFilters;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => AdvancedFilters.init(), 1000);
    });
} else {
    setTimeout(() => AdvancedFilters.init(), 1000);
}
