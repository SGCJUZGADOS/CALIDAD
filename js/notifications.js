// ==========================================
// SISTEMA DE NOTIFICACIONES MEJORADO
// ==========================================
// Notificaciones toast elegantes con animaciones

const NotificationSystem = {
    container: null,

    init() {
        // Crear contenedor de notificaciones si no existe
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 5000) {
        this.init();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            loading: '<i class="fas fa-spinner fa-spin"></i>'
        };

        const colors = {
            success: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            error: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
            warning: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
            info: 'linear-gradient(135deg, #17a2b8 0%, #007bff 100%)',
            loading: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 24px;">${icons[type] || icons.info}</div>
                <div style="flex: 1; font-size: 14px; font-weight: 600;">${message}</div>
                <button onclick="this.closest('.notification').remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0 5px;">
                    &times;
                </button>
            </div>
        `;

        notification.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            min-width: 320px;
            animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        // Hover effect
        notification.onmouseenter = () => {
            notification.style.transform = 'translateX(-5px)';
            notification.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
        };
        notification.onmouseleave = () => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        };

        this.container.appendChild(notification);

        // Auto remove
        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => notification.remove(), 400);
            }, duration);
        }

        return notification; // Retorna para poder controlarlo después
    },

    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    },

    loading(message) {
        return this.show(message, 'loading', 0); // No auto-close
    },

    // Actualizar mensaje de una notificación existente
    update(notification, message, type = 'success') {
        if (notification) {
            notification.remove();
        }
        return this.show(message, type);
    }
};

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Exportar para uso global
window.Notify = NotificationSystem;
