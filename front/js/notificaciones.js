document.addEventListener('DOMContentLoaded', () => {
    initNotificacionesModule();
});

window.lastNotifiedId = null;

function initNotificacionesModule() {
    const btnMarkAll = document.getElementById('btn-page-mark-all-read');

    // Solicitar permiso para notificaciones nativas (Push de navegador)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    if (btnMarkAll) {
        btnMarkAll.addEventListener('click', async () => {
            try {
                await fetch('../back/api/api_notificaciones.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mark_all_read: true })
                });
                updateNotifBadges();
                loadFullNotifications();
            } catch (err) {
                console.error('Error al marcar todas leídas:', err);
            }
        });
    }

    updateNotifBadges();
    setInterval(updateNotifBadges, 15000); // Revisar cada 15 segundos para ser más rápido
}

/* Actualizar badges de conteo en la barra lateral */
async function updateNotifBadges() {
    try {
        const res = await fetch('../back/api/api_notificaciones.php?count=true');
        const data = await res.json();
        
        const badgeNav = document.getElementById('badge-nav-notificaciones');
        
        if (data.status === 'success') {
            const count = data.unread_count || 0;
            if (badgeNav) {
                if (count > 0) {
                    badgeNav.innerText = count > 99 ? '99+' : count;
                    badgeNav.style.display = 'inline-flex';
                } else {
                    badgeNav.innerText = '';
                    badgeNav.style.setProperty('display', 'none', 'important');
                }
            }
            
            // Disparar Notificación Nativa Push si hay una nueva
            if (data.latest_unread && window.lastNotifiedId !== data.latest_unread.id_notificacion) {
                window.lastNotifiedId = data.latest_unread.id_notificacion;
                
                if ('Notification' in window && Notification.permission === 'granted') {
                    const notif = new Notification(data.latest_unread.titulo, {
                        body: data.latest_unread.mensaje,
                        icon: 'assets/safran_logo.png' // Asegurar que haya un logo o fallará silenciosamente sin icono
                    });
                    
                    notif.onclick = function() {
                        window.focus();
                        this.close();
                        const btnBell = document.getElementById('btn-nav-notificaciones');
                        if(btnBell) btnBell.click(); // Abrir panel
                    };
                }
            }
        }
    } catch (err) {
        console.error('Error fetching notification count:', err);
    }
}

/* Cargar listado completo en el módulo de Notificaciones */
async function loadFullNotifications() {
    const container = document.getElementById('full-notif-container');
    if (!container) return;

    container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">Cargando notificaciones...</div>';

    try {
        const res = await fetch('../back/api/api_notificaciones.php');
        const result = await res.json();

        if (result.status === 'success' && result.data && result.data.length > 0) {
            container.innerHTML = '';
            
            result.data.forEach(item => {
                const row = document.createElement('div');
                row.className = 'notif-page-item';
                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--card-border);
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    background-color: ${item.leida == 0 ? 'rgba(59, 130, 246, 0.06)' : 'transparent'};
                `;

                const isUnread = item.leida == 0;
                const isAlta = item.tipo === 'nueva_alta';

                const iconSvg = isAlta 
                    ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#3b82f6" stroke-width="2" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>`
                    : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#10b981" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

                const dateFormatted = item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleString('es-MX', {
                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '';

                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--bg-main); border: 1px solid var(--card-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            ${iconSvg}
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
                                ${item.titulo}
                                ${isUnread ? '<span style="font-size: 0.7rem; background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-weight: 700;">NUEVA</span>' : ''}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${item.mensaje}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.75; margin-top: 0.3rem;">${dateFormatted}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                            Ver Detalle
                        </button>
                    </div>
                `;

                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = 'var(--nav-hover)';
                });
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = isUnread ? 'rgba(59, 130, 246, 0.06)' : 'transparent';
                });

                row.addEventListener('click', async () => {
                    // Marcar como leída
                    if (isUnread) {
                        await fetch('../back/api/api_notificaciones.php', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_notificacion: item.id_notificacion })
                        });
                        updateNotifBadges();
                    }

                    // Navegar al módulo de destino según el tipo y el dashboard activo
                    if (isAlta) {
                        const targetNav = document.querySelector('.nav-item[data-target="view-it-pendientes"]');
                        if (targetNav) targetNav.click();
                    } else {
                        const targetRH = document.querySelector('.nav-item[data-target="view-rh-altas"]');
                        const targetIT = document.querySelector('.nav-item[data-target="view-it-completadas"]');
                        if (targetRH) targetRH.click();
                        else if (targetIT) targetIT.click();
                    }
                });

                container.appendChild(row);
            });
        } else {
            container.innerHTML = `
                <div style="padding: 4rem 1rem; text-align: center; color: var(--text-muted);">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" style="opacity: 0.4; margin-bottom: 1rem;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <p style="margin: 0; font-size: 1rem; font-weight: 500;">No tienes notificaciones registradas</p>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">Error al cargar notificaciones.</div>';
    }
}

// Exportar globalmente
window.loadFullNotifications = loadFullNotifications;
window.updateNotifBadges = updateNotifBadges;
