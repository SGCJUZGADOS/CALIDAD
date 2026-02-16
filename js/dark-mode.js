// ==========================================
// MODO OSCURO / DARK MODE
// ==========================================
// Toggle entre tema claro y oscuro con persistencia

const DarkMode = {
    enabled: false,
    storageKey: 'sgc_dark_mode',

    init() {
        // Cargar preferencia guardada
        const saved = localStorage.getItem(this.storageKey);
        this.enabled = saved === 'true';

        // Crear botón toggle
        this.createToggleButton();

        // Aplicar tema inicial
        if (this.enabled) {
            this.enable();
        }
    },

    createToggleButton() {
        // Buscar header del dashboard
        const headerRight = document.querySelector('.header-right') || 
                           document.querySelector('.dash-header');
        
        if (!headerRight) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'darkModeToggle';
        toggleBtn.className = 'dark-mode-toggle';
        toggleBtn.innerHTML = `
            <i class="fas fa-moon"></i>
            <span>Modo Oscuro</span>
        `;
        toggleBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        `;

        toggleBtn.onmouseenter = () => {
            toggleBtn.style.transform = 'translateY(-2px)';
            toggleBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        };
        toggleBtn.onmouseleave = () => {
            toggleBtn.style.transform = 'translateY(0)';
            toggleBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        };

        toggleBtn.onclick = () => this.toggle();

        headerRight.appendChild(toggleBtn);
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem(this.storageKey, this.enabled);

        if (this.enabled) {
            this.enable();
        } else {
            this.disable();
        }

        // Animar transición
        document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    },

    enable() {
        console.log('🌙 Activando modo oscuro...');
        
        const btn = document.getElementById('darkModeToggle');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sun"></i><span>Modo Claro</span>';
            btn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        }

        // Agregar clase al body
        document.body.classList.add('dark-mode');
        
        // Inyectar estilos si no existen
        if (!document.getElementById('dark-mode-styles')) {
            this.injectStyles();
        }

        Notify.info('🌙 Modo oscuro activado', 2000);
    },

    disable() {
        console.log('☀️ Desactivando modo oscuro...');
        
        const btn = document.getElementById('darkModeToggle');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-moon"></i><span>Modo Oscuro</span>';
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }

        document.body.classList.remove('dark-mode');
        
        Notify.info('☀️ Modo claro activado', 2000);
    },

    injectStyles() {
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            /* ==========================================
               DARK MODE STYLES
               ========================================== */

            body.dark-mode {
                background-color: #0f172a !important;
                color: #e2e8f0 !important;
            }

            /* Dashboard Content */
            body.dark-mode .dashboard-content {
                background-color: #0f172a !important;
            }

            /* Cards y Containers */
            body.dark-mode .data-form-card,
            body.dark-mode .data-table-card,
            body.dark-mode .card {
                background: linear-gradient(145deg, #1e293b, #0f172a) !important;
                color: #e2e8f0 !important;
                border: 1px solid #334155 !important;
            }

            /* Headers */
            body.dark-mode .dash-header {
                background: #1e293b !important;
                border-bottom: 1px solid #334155 !important;
            }

            body.dark-mode h1,
            body.dark-mode h2,
            body.dark-mode h3,
            body.dark-mode h4 {
                color: #f1f5f9 !important;
            }

            /* Inputs y Selects */
            body.dark-mode input,
            body.dark-mode select,
            body.dark-mode textarea {
                background-color: #1e293b !important;
                color: #e2e8f0 !important;
                border: 1px solid #475569 !important;
            }

            body.dark-mode input:focus,
            body.dark-mode select:focus,
            body.dark-mode textarea:focus {
                background-color: #0f172a !important;
                border-color: #3b82f6 !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
            }

            body.dark-mode input::placeholder {
                color: #64748b !important;
            }

            /* Tables */
            body.dark-mode table {
                background-color: #1e293b !important;
                color: #e2e8f0 !important;
            }

            body.dark-mode table thead {
                background: #334155 !important;
            }

            body.dark-mode table thead th {
                color: #f1f5f9 !important;
                border-bottom: 2px solid #475569 !important;
            }

            body.dark-mode table tbody tr {
                border-bottom: 1px solid #334155 !important;
            }

            body.dark-mode table tbody tr:hover {
                background-color: #334155 !important;
            }

            body.dark-mode table tbody td {
                color: #cbd5e1 !important;
            }

            /* Buttons */
            body.dark-mode button.btn-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            }

            body.dark-mode button.btn-secondary {
                background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
            }

            body.dark-mode button.btn-danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            }

            /* Modals */
            body.dark-mode .modal-content {
                background: #1e293b !important;
                color: #e2e8f0 !important;
                border: 1px solid #334155 !important;
            }

            /* Sidebar */
            body.dark-mode .dashboard-sidebar {
                background: linear-gradient(180deg, #0f172a 0%, #020617 100%) !important;
            }

            /* Labels y Text */
            body.dark-mode label {
                color: #cbd5e1 !important;
            }

            body.dark-mode p,
            body.dark-mode span {
                color: #94a3b8 !important;
            }

            /* Badges */
            body.dark-mode .badge {
                background: #334155 !important;
                color: #e2e8f0 !important;
            }

            body.dark-mode .badge.badge-success {
                background: #166534 !important;
                color: #86efac !important;
            }

            body.dark-mode .badge.badge-danger {
                background: #991b1b !important;
                color: #fca5a5 !important;
            }

            body.dark-mode .badge.badge-warning {
                background: #92400e !important;
                color: #fde047 !important;
            }

            /* PDF Banner */
            body.dark-mode #pdfImportContainer {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                border: 2px dashed #475569 !important;
            }

            /* Scrollbars */
            body.dark-mode ::-webkit-scrollbar {
                width: 12px;
                background: #0f172a;
            }

            body.dark-mode ::-webkit-scrollbar-thumb {
                background: #475569;
                border-radius: 6px;
            }

            body.dark-mode ::-webkit-scrollbar-thumb:hover {
                background: #64748b;
            }

            /* Advanced Filters Panel */
            body.dark-mode #advancedFiltersPanel {
                background: #1e293b !important;
                border-color: #334155 !important;
            }

            /* Charts (si existen) */
            body.dark-mode canvas {
                filter: invert(0.9) hue-rotate(180deg);
            }

            /* Transitions suaves */
            body.dark-mode * {
                transition: background-color 0.3s ease, 
                           color 0.3s ease, 
                           border-color 0.3s ease !important;
            }
        `;

        document.head.appendChild(style);
    }
};

// Exportar para uso global
window.DarkMode = DarkMode;

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => DarkMode.init(), 500);
    });
} else {
    setTimeout(() => DarkMode.init(), 500);
}
