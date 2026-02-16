// ==========================================
// SISTEMA DE HISTORIAL Y AUDITORÍA
// ==========================================
// Registra todos los cambios con detalles completos

const AuditSystem = {
    // Guardar cambio en historial
    async logChange(radicado, action, changes = {}, previousData = null) {
        if (!currentUser || !currentUser.username) {
            console.error('No hay usuario autenticado para registrar cambios');
            return;
        }

        const historyEntry = {
            radicado: radicado,
            action: action, // 'create', 'update', 'delete', 'archive', 'restore'
            username: currentUser.username,
            userRole: currentUser.role || 'unknown',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            changes: changes,
            previousData: previousData,
            collection: currentCollection
        };

        try {
            await db.collection('audit_log').add(historyEntry);
            console.log('✅ Cambio registrado en auditoría:', action);
        } catch (error) {
            console.error('❌ Error registrando en auditoría:', error);
        }
    },

    // Ver historial de un radicado específico
    async viewHistory(radicado) {
        try {
            const snapshot = await db.collection('audit_log')
                .where('radicado', '==', radicado)
                .orderBy('timestamp', 'desc')
                .get();

            const history = [];
            snapshot.forEach(doc => {
                history.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.displayHistoryModal(radicado, history);
            
        } catch (error) {
            console.error('Error cargando historial:', error);
            Notify.error('Error al cargar el historial');
        }
    },

    // Mostrar modal de historial
    displayHistoryModal(radicado, history) {
        const modal = document.getElementById('historyModal') || this.createHistoryModal();
        const tbody = document.getElementById('historyTableBody');
        
        if (!tbody) return;

        tbody.innerHTML = '';

        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>
                        No hay historial registrado para este radicado
                    </td>
                </tr>
            `;
        } else {
            history.forEach(entry => {
                const date = entry.timestamp?.toDate() || new Date();
                const dateStr = date.toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const actionIcons = {
                    'create': '<i class="fas fa-plus-circle" style="color: #28a745;"></i>',
                    'update': '<i class="fas fa-edit" style="color: #007bff;"></i>',
                    'delete': '<i class="fas fa-trash" style="color: #dc3545;"></i>',
                    'archive': '<i class="fas fa-archive" style="color: #ffc107;"></i>',
                    'restore': '<i class="fas fa-undo" style="color: #17a2b8;"></i>'
                };

                const actionNames = {
                    'create': 'Creado',
                    'update': 'Modificado',
                    'delete': 'Eliminado',
                    'archive': 'Archivado',
                    'restore': 'Restaurado'
                };

                const actionIcon = actionIcons[entry.action] || '<i class="fas fa-question"></i>';
                const actionName = actionNames[entry.action] || entry.action;

                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #444;">
                        <td style="padding: 15px; color: #cbd5e1;">${dateStr}</td>
                        <td style="padding: 15px; color: #cbd5e1;">
                            <i class="fas fa-user"></i> ${entry.username}
                            <br>
                            <small style="color: #64748b;">${entry.userRole}</small>
                        </td>
                        <td style="padding: 15px;">
                            ${actionIcon} <strong>${actionName}</strong>
                            ${this.formatChanges(entry.changes)}
                        </td>
                        <td style="padding: 15px; text-align: center;">
                            <button onclick="AuditSystem.viewChangeDetails('${entry.id}')" 
                                    class="btn-sm" 
                                    style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;"
                                    title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        // Actualizar título del modal
        const titleEl = modal.querySelector('.login-header h2');
        if (titleEl) {
            titleEl.innerHTML = `
                <i class="fas fa-history"></i> Historial de Cambios
                <br>
                <small style="font-size: 0.8rem; color: #cbd5e1;">Radicado: ${radicado}</small>
            `;
        }

        modal.style.display = 'block';
    },

    // Formatear cambios para visualización
    formatChanges(changes) {
        if (!changes || Object.keys(changes).length === 0) {
            return '<br><small style="color: #64748b;">Sin detalles</small>';
        }

        let html = '<br><small style="color: #94a3b8;">';
        const changedFields = Object.keys(changes).slice(0, 3); // Mostrar solo primeros 3 campos
        
        changedFields.forEach(field => {
            html += `<br>• ${field}: ${changes[field]}`;
        });

        if (Object.keys(changes).length > 3) {
            html += `<br>• ... y ${Object.keys(changes).length - 3} cambios más`;
        }

        html += '</small>';
        return html;
    },

    // Ver detalles completos de un cambio
    async viewChangeDetails(entryId) {
        try {
            const doc = await db.collection('audit_log').doc(entryId).get();
            
            if (!doc.exists) {
                Notify.error('Registro no encontrado');
                return;
            }

            const data = doc.data();
            
            const detailsHTML = `
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; color: #e2e8f0;">
                    <h3 style="margin-bottom: 20px; color: #D4AF37;">
                        <i class="fas fa-info-circle"></i> Detalles del Cambio
                    </h3>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #cbd5e1;">Usuario:</strong> 
                        <span style="color: #94a3b8;">${data.username} (${data.userRole})</span>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong style="color: #cbd5e1;">Acción:</strong> 
                        <span style="color: #94a3b8;">${data.action}</span>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong style="color: #cbd5e1;">Fecha:</strong> 
                        <span style="color: #94a3b8;">${data.timestamp?.toDate().toLocaleString('es-CO')}</span>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong style="color: #cbd5e1;">Cambios Realizados:</strong>
                        <pre style="background: #1e293b; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 10px; color: #cbd5e1; font-size: 0.9rem;">${JSON.stringify(data.changes, null, 2)}</pre>
                    </div>

                    ${data.previousData ? `
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #cbd5e1;">Datos Anteriores:</strong>
                            <pre style="background: #1e293b; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 10px; color: #cbd5e1; font-size: 0.9rem;">${JSON.stringify(data.previousData, null, 2)}</pre>
                        </div>
                    ` : ''}

                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="document.getElementById('detailsOverlay').remove()" 
                                class="btn-primary" 
                                style="background: #007bff; padding: 10px 30px;">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            // Crear overlay
            const overlay = document.createElement('div');
            overlay.id = 'detailsOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                overflow-y: auto;
            `;
            
            overlay.innerHTML = `
                <div style="max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    ${detailsHTML}
                </div>
            `;

            document.body.appendChild(overlay);

        } catch (error) {
            console.error('Error cargando detalles:', error);
            Notify.error('Error al cargar detalles');
        }
    },

    // Crear modal de historial si no existe
    createHistoryModal() {
        if (document.getElementById('historyModal')) {
            return document.getElementById('historyModal');
        }

        const modal = document.createElement('div');
        modal.id = 'historyModal';
        modal.className = 'modal';
        modal.style.cssText = 'display: none;';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; background-color: #212529; color: white;">
                <span class="close-modal" onclick="document.getElementById('historyModal').style.display='none'">&times;</span>
                <div class="login-header" style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #D4AF37;"><i class="fas fa-history"></i> Historial de Cambios</h2>
                    <p style="color: #ccc;">Versiones anteriores de este registro</p>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="width: 100%; color: white;">
                        <thead>
                            <tr style="border-bottom: 2px solid #444;">
                                <th style="color: #D4AF37;">Fecha</th>
                                <th style="color: #D4AF37;">Usuario</th>
                                <th style="color: #D4AF37;">Acción</th>
                                <th style="color: #D4AF37;">Opciones</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    },

    // Exportar log de auditoría
    async exportAuditLog(startDate = null, endDate = null) {
        try {
            Progress.show('Generando reporte de auditoría...');

            let query = db.collection('audit_log')
                .where('collection', '==', currentCollection)
                .orderBy('timestamp', 'desc');

            if (startDate) {
                query = query.where('timestamp', '>=', new Date(startDate));
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59);
                query = query.where('timestamp', '<=', end);
            }

            const snapshot = await query.limit(5000).get();

            const data = [
                ['Fecha', 'Hora', 'Radicado', 'Usuario', 'Rol', 'Acción', 'Detalles']
            ];

            snapshot.forEach(doc => {
                const entry = doc.data();
                const date = entry.timestamp?.toDate() || new Date();
                
                data.push([
                    date.toLocaleDateString('es-CO'),
                    date.toLocaleTimeString('es-CO'),
                    entry.radicado,
                    entry.username,
                    entry.userRole,
                    entry.action,
                    JSON.stringify(entry.changes)
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [
                {wch: 12}, // Fecha
                {wch: 10}, // Hora
                {wch: 25}, // Radicado
                {wch: 15}, // Usuario
                {wch: 12}, // Rol
                {wch: 12}, // Acción
                {wch: 50}  // Detalles
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Log de Auditoría');

            const fileName = `SGC_Auditoria_${currentCollection}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            Progress.close();
            Notify.success(`✅ Reporte exportado: ${fileName}`);

        } catch (error) {
            console.error('Error exportando log:', error);
            Progress.close();
            Notify.error('Error al generar reporte de auditoría');
        }
    }
};

// Exportar para uso global
window.AuditSystem = AuditSystem;

// Función de ayuda para cerrar modal de historial
window.closeHistoryModal = function() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'none';
};
