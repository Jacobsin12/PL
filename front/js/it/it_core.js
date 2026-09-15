document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const isLoggedIn = await checkSession(true);
    if (!isLoggedIn) return;

    // 2. Configurar Logout y Tema
    if (typeof setupLogout === 'function') {
        setupLogout('btn-logout');
    }
    initITTheme();

    // 3. Inicializar Notificaciones Polling
    initNotifications();

    // 4. Configurar Navegación entre pestañas
    initNavigation();

    // 5. Cargar datos iniciales
    if (typeof window.loadITPendientes === 'function') {
        window.loadITPendientes();
    }
});

/* Manejo de Tema (Dark / Light) */
function initITTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    if (!themeSwitch) return;

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }

    themeSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

/* Navegación del Sidebar */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.hasAttribute('data-target')) return; // Permite la navegación normal a otras páginas
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            viewSections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });

            // Recargar datos de la sección activa
            if ((targetId === 'view-dashboard') && typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            } else if ((targetId === 'view-reports') && typeof window.renderReport === 'function') {
                window.renderReport();
            } else if ((targetId === 'view-it-pendientes' || targetId === 'view-altas-pendientes') && typeof window.loadITPendientes === 'function') {
                window.loadITPendientes();
            } else if ((targetId === 'view-it-completadas' || targetId === 'view-altas-completadas') && typeof window.loadITCompletadas === 'function') {
                window.loadITCompletadas();
            } else if ((targetId === 'view-notificaciones') && typeof window.loadFullNotifications === 'function') {
                window.loadFullNotifications();
            }
        });
    });
}

/* Notificaciones en tiempo real (Polling cada 30 segundos) */
function initNotifications() {
    const bellBtn = document.getElementById('btn-notif-bell');
    const notifDropdown = document.getElementById('notif-dropdown');
    const markAllBtn = document.getElementById('btn-mark-all-read');

    if (bellBtn && notifDropdown) {
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            if (notifDropdown.classList.contains('show')) {
                fetchNotificationsList();
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
                checkNotificationsCount();
                fetchNotificationsList();
            } catch (e) {
                console.error('Error marking all notifications read:', e);
            }
        });
    }

    // Primer chequeo inmediato
    checkNotificationsCount();
    // Intervalo polling 30s
    setInterval(checkNotificationsCount, 30000);
}

async function checkNotificationsCount() {
    if (typeof window.updateNotifBadges === 'function') {
        return window.updateNotifBadges();
    }
    try {
        const res = await fetch('../back/api/api_notificaciones.php?count=true');
        const data = await res.json();
        const badge = document.getElementById('notif-badge-count') || document.getElementById('badge-nav-notificaciones');
        
        if (data.status === 'success' && badge) {
            const count = data.unread_count || 0;
            if (count > 0) {
                badge.innerText = count > 99 ? '99+' : count;
                badge.style.display = 'inline-flex';
            } else {
                badge.innerText = '';
                badge.style.setProperty('display', 'none', 'important');
            }
        }
    } catch (err) {
        console.error('Error fetching notification count:', err);
    }
}

async function fetchNotificationsList() {
    const listContainer = document.getElementById('notif-list');
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
                        checkNotificationsCount();
                    }
                    if (item.url_referencia) {
                        if (typeof window.loadITPendientes === 'function') {
                            window.loadITPendientes();
                        }
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

// Exportar globalmente para que lo puedan llamar otros scripts
window.checkNotificationsCount = checkNotificationsCount;
