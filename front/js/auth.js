let currentRole = null;

async function checkSession(redirectIfNotLoggedIn = true) {
    try {
        const response = await fetch('../back/auth/check_session.php');
        const data = await response.json();
        
        if (!data.logged_in) {
            if(redirectIfNotLoggedIn) window.location.href = 'login.html';
            return false;
        } else {
            currentRole = parseInt(data.rol_id);
            if (typeof window.applyRolePermissions === 'function') {
                window.applyRolePermissions(currentRole);
            }
            return true;
        }
    } catch(err) {
        const savedRole = localStorage.getItem('user_rol');
        if(!savedRole) {
            if(redirectIfNotLoggedIn) window.location.href = 'login.html';
            return false;
        } else {
            currentRole = parseInt(savedRole);
            if (typeof window.applyRolePermissions === 'function') {
                window.applyRolePermissions(currentRole);
            }
            return true;
        }
    }
}

function setupLogout(buttonId) {
    const btnLogout = document.getElementById(buttonId);
    if(btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch('../back/auth/logout.php');
            } catch(e) {}
            localStorage.removeItem('user_rol');
            window.location.href = 'login.html';
        });
    }
}

window.applyRolePermissions = function(role) {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    let firstVisibleTarget = null;

    navItems.forEach(el => {
        const rolesAttr = el.dataset.roles;
        if (rolesAttr) {
            const allowedRoles = rolesAttr.split(',').map(r => parseInt(r.trim()));
            if (!allowedRoles.includes(role)) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex';
                if (!firstVisibleTarget && el.dataset.target) {
                    firstVisibleTarget = el;
                }
            }
        }
    });

    // Si la pestaña actualmente activa está oculta para este rol, seleccionar la primera visible
    const activeNav = document.querySelector('.nav-menu .nav-item.active');
    if (!activeNav || activeNav.style.display === 'none') {
        if (firstVisibleTarget) {
            firstVisibleTarget.click();
        }
    }
};
