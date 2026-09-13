document.addEventListener('DOMContentLoaded', () => {
    initRHNotifications();
});

function initRHNotifications() {
    const bellBtn = document.getElementById('btn-rh-notif-bell');
    const notifDropdown = document.getElementById('rh-notif-dropdown');
    const markAllBtn = document.getElementById('btn-rh-mark-all-read');

    if (bellBtn && notifDropdown) {
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            if (notifDropdown.classList.contains('show')) {
                fetchRHNotificationsList();
            }
        });

        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            try {
                await fetch('../back/api/api_notificaciones.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mark_all_read: true })
                });
                checkRHNotificationsCount();
                fetchRHNotificationsList();
            } catch (e) {
                console.error('Error marking notifications read:', e);
            }
        });
    }

    checkRHNotificationsCount();
    setInterval(checkRHNotificationsCount, 30000);
}

async function checkRHNotificationsCount() {
    try {
        const res = await fetch('../back/api/api_notificaciones.php?count=true');
        const data = await res.json();
        const badge = document.getElementById('rh-notif-badge-count');
        
        if (data.status === 'success' && badge) {
            const count = data.unread_count || 0;
            if (count > 0) {
                badge.innerText = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Error checking RH notifications:', err);
    }
}

async function fetchRHNotificationsList() {
    const listContainer = document.getElementById('rh-notif-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="notif-empty">Cargando notificaciones...</div>';

    try {
        const res = await fetch('../back/api/api_notificaciones.php');
        const data = await res.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            listContainer.innerHTML = '';
            data.data.forEach(item => {
                const div = document.createElement('div');
                div.className = `notif-item ${item.leida == 0 ? 'unread' : ''}`;
                
                const dateStr = item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : '';

                div.innerHTML = `
                    <div class="notif-item-title">
                        <span>${item.titulo}</span>
                        ${item.leida == 0 ? '<span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span>' : ''}
                    </div>
                    <div class="notif-item-msg">${item.mensaje}</div>
                    <div class="notif-item-time">${dateStr}</div>
                `;

                div.addEventListener('click', async () => {
                    if (item.leida == 0) {
                        await fetch('../back/api/api_notificaciones.php', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_notificacion: item.id_notificacion })
                        });
                        checkRHNotificationsCount();
                    }
                });

                listContainer.appendChild(div);
            });
        } else {
            listContainer.innerHTML = '<div class="notif-empty">No tienes notificaciones pendientes</div>';
        }
    } catch (err) {
        listContainer.innerHTML = '<div class="notif-empty">Error al cargar notificaciones</div>';
    }
}
