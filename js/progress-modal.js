// ==========================================
// MODAL DE PROGRESO
// ==========================================
// Modal elegante para mostrar progreso en importaciones y operaciones largas

const ProgressModal = {
    modal: null,
    progressBar: null,
    messageEl: null,
    percentEl: null,

    create() {
        if (this.modal) return;

        // Crear modal HTML
        this.modal = document.createElement('div');
        this.modal.id = 'progressModal';
        this.modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        this.modal.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(145deg, #1e293b, #0f172a);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                min-width: 500px;
                max-width: 90%;
                color: white;
            ">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div id="progressSpinner" style="
                        width: 80px;
                        height: 80px;
                        border: 8px solid rgba(255, 255, 255, 0.1);
                        border-top: 8px solid #007bff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">
                        <i class="fas fa-cog fa-spin"></i> Procesando...
                    </h3>
                    <p id="progressMessage" style="color: #94a3b8; font-size: 1rem;">
                        Iniciando operación...
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        height: 30px;
                        border-radius: 15px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="progressBar" style="
                            height: 100%;
                            width: 0%;
                            background: linear-gradient(90deg, #007bff, #17a2b8);
                            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                            border-radius: 15px;
                            position: relative;
                            overflow: hidden;
                        ">
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                background: linear-gradient(90deg, 
                                    transparent, 
                                    rgba(255, 255, 255, 0.3), 
                                    transparent);
                                animation: shimmer 2s infinite;
                            "></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.9rem; color: #cbd5e1;">
                        <span id="progressPercent">0%</span>
                        <span id="progressDetails">0 / 0 registros</span>
                    </div>
                </div>

                <div style="text-align: center; color: #94a3b8; font-size: 0.85rem;">
                    <i class="fas fa-info-circle"></i> Por favor espera, esto puede tomar unos momentos...
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Referencias a elementos
        this.progressBar = document.getElementById('progressBar');
        this.messageEl = document.getElementById('progressMessage');
        this.percentEl = document.getElementById('progressPercent');
        this.detailsEl = document.getElementById('progressDetails');

        // Agregar estilos CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    },

    show(message = 'Procesando...') {
        this.create();
        this.modal.style.display = 'block';
        this.update(0, message);
        document.body.style.overflow = 'hidden'; // Bloquear scroll
    },

    update(percent, message, current = null, total = null) {
        if (!this.modal) return;

        this.progressBar.style.width = percent + '%';
        this.percentEl.textContent = Math.round(percent) + '%';
        
        if (message) {
            this.messageEl.textContent = message;
        }

        if (current !== null && total !== null) {
            this.detailsEl.textContent = `${current} / ${total} registros`;
        }
    },

    close() {
        if (this.modal) {
            this.modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.style.animation = '';
                document.body.style.overflow = ''; // Restaurar scroll
            }, 300);
        }
    }
};

// Exportar para uso global
window.Progress = ProgressModal;
