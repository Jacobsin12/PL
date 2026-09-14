window.IT = window.IT || {};

window.IT.pendientesData = [];
window.IT.completadasData = [];
window.IT.viewMode = 'cargas';

document.addEventListener('DOMContentLoaded', () => {
    initITAltasEvents();
});

function initITAltasEvents() {
    // 1. Botones de Modo de Vista (Por Cargas vs General)
    const viewBtns = document.querySelectorAll('#view-it-pendientes .altas-view-modes .view-mode-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.IT.viewMode = btn.dataset.mode;
            switchITViewMode(window.IT.viewMode);
        });
    });

    // 2. Buscadores
    const searchPend = document.getElementById('search-it-pendientes') || document.getElementById('it-search-input');
    if (searchPend) {
        searchPend.addEventListener('input', () => {
            renderITPendientes();
        });
    }

    const searchComp = document.getElementById('search-it-completadas') || document.getElementById('it-completed-search-input');
    if (searchComp) {
        searchComp.addEventListener('input', () => {
            renderITCompletadas();
        });
    }

    // 3. Modal Formulario Configuración Individual
    const modalConfig = document.getElementById('modal-config-it');
    const btnCloseConfig = document.getElementById('btn-close-config-it');
    const btnCancelConfig = document.getElementById('btn-cancel-config');
    const formConfig = document.getElementById('form-config-it');

    if (btnCloseConfig) btnCloseConfig.addEventListener('click', closeConfigModal);
    if (btnCancelConfig) btnCancelConfig.addEventListener('click', closeConfigModal);

    if (formConfig) {
        formConfig.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveIndividualConfig();
        });
    }
}

function switchITViewMode(mode) {
    const cargasView = document.getElementById('it-cargas-view');
    const generalView = document.getElementById('it-general-view');

    if (!cargasView || !generalView) return;

    if (mode === 'cargas') {
        cargasView.style.display = '';
        generalView.style.display = 'none';
    } else {
        cargasView.style.display = 'none';
        generalView.style.display = '';
    }
}

/* Generador de correo por defecto: primernombre.primerapellido@safrangroup.com */
function generateDefaultEmailIT(nombre, apellidoPaterno) {
    if (!nombre || !apellidoPaterno) return '';
    const primerNombre = nombre.trim().split(/\s+/)[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const primerApellido = apellidoPaterno.trim().split(/\s+/)[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    return `${primerNombre}.${primerApellido}@safrangroup.com`;
}

/* Cargar Altas Pendientes de la API */
async function loadITPendientes() {
    try {
        const res = await fetch('../back/api/api_configuracion_it.php');
        const result = await res.json();

        if (result.status === 'success') {
            const allData = result.data || [];
            window.IT.pendientesData = allData.filter(d => d.estatus !== 'completada');
            window.IT.completadasData = allData.filter(d => d.estatus === 'completada');

            // Actualizar Badge en el Navbar
            const badgeNav = document.getElementById('badge-nav-pendientes');
            if (badgeNav) {
                if (window.IT.pendientesData.length > 0) {
                    badgeNav.innerText = window.IT.pendientesData.length;
                    badgeNav.style.display = 'inline-flex';
                } else {
                    badgeNav.innerText = '';
                    badgeNav.style.setProperty('display', 'none', 'important');
                }
            }

            renderITPendientes();
            renderITCompletadas();
        }
    } catch (err) {
        console.error('Error al cargar datos IT:', err);
    }
}

/* Renderizar Pendientes (Por Cargas & General) */
function renderITPendientes() {
    const searchEl = document.getElementById('search-it-pendientes') || document.getElementById('it-search-input');
    const term = (searchEl?.value || '').toLowerCase();

    let filtered = window.IT.pendientesData;
    if (term) {
        filtered = filtered.filter(item =>
            (item.mug && item.mug.toLowerCase().includes(term)) ||
            (item.numero_nomina && item.numero_nomina.toLowerCase().includes(term)) ||
            (item.nombre && item.nombre.toLowerCase().includes(term)) ||
            (item.apellido_paterno && item.apellido_paterno.toLowerCase().includes(term)) ||
            (item.puesto && item.puesto.toLowerCase().includes(term))
        );
    }

    renderCargasBlocksIT(filtered);
    renderGeneralTableIT(filtered);
}

/* Renderizar Bloques por Carga en IT */
function renderCargasBlocksIT(data) {
    const container = document.getElementById('it-cargas-view') || document.getElementById('it-cargas-container');
    if (!container) return;
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `
            <div class="altas-empty">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <p>¡Excelente! No hay altas pendientes por procesar por IT</p>
            </div>
        `;
        return;
    }

    // Agrupar por fecha_registro
    const groups = {};
    data.forEach(item => {
        const key = item.fecha_registro ? item.fecha_registro.split(' ')[0] : 'Sin fecha';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach((key, idx) => {
        const items = groups[key];
        const block = document.createElement('div');
        block.className = 'carga-block collapsed';
        block.style.animationDelay = `${idx * 100}ms`;

        const total = items.length;
        const completedCount = items.filter(i => i.estatus === 'completada').length;
        const isFullyCompleted = completedCount === total && total > 0;
        const isPartial = completedCount > 0 && !isFullyCompleted;

        let badgeStyle = "background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;";
        let badgeIcon = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
        let badgeText = `Pendiente IT (${completedCount}/${total})`;

        if (isFullyCompleted) {
            badgeStyle = "background: #dcfce7; color: #166534; border: 1px solid #86efac;";
            badgeIcon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
            badgeText = `IT Completado (${completedCount}/${total})`;
        } else if (isPartial) {
            badgeStyle = "background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;";
            badgeIcon = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
            badgeText = `En Proceso IT (${completedCount}/${total})`;
        }

        const dateFormatted = formatDateIT(key);

        const header = document.createElement('div');
        header.className = 'carga-block-header';
        header.innerHTML = `
            <div class="carga-block-title">
                <h4>${dateFormatted}</h4>
                <span class="carga-badge">
                    ${total} ${total === 1 ? 'ingreso' : 'ingresos'}
                </span>

                <span class="badge-status-custom" style="${badgeStyle}">
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">${badgeIcon}</svg>
                    ${badgeText}
                </span>
            </div>
            <div class="carga-block-actions">
                <button class="btn-enviar-carga-rh" title="Finalizar todos los registros de esta carga y notificar a RH">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    <span>Enviar Carga a RH</span>
                </button>
                <svg class="carga-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
        `;

        const btnEnviarRH = header.querySelector('.btn-enviar-carga-rh');
        btnEnviarRH.addEventListener('click', async (e) => {
            e.stopPropagation();
            await sendCargaToRH(block, items, key);
        });

        header.addEventListener('click', () => {
            block.classList.toggle('collapsed');
        });

        const body = document.createElement('div');
        body.className = 'carga-block-body';

        let tableHTML = `
            <div class="table-responsive">
                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">MUG</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">NÓMINA</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">NOMBRE COMPLETO</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">PUESTO / ÁREA</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">ESTATUS IT</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">CORREO ASIGNADO (IT)</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">CONTRASEÑA (IT)</th>
                            <th style="padding: 0.6rem 1rem; font-size:0.8rem;">FECHA INGRESO</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        items.forEach(item => {
            let defaultCorreo = item.correo_asignado || generateDefaultEmailIT(item.nombre, item.apellido_paterno);
            let defaultPass = item.password_asignado || 'QueretaroMex2026*';
            const statusText = item.estatus === 'completada' ? 'Completado' : (item.correo_asignado ? 'En Proceso' : 'Pendiente');
            const statusClass = item.estatus === 'completada' ? 'completada' : (item.correo_asignado ? 'proceso' : 'pendiente');
            const fechaIngresoStr = item.fecha_ingreso ? item.fecha_ingreso.split(' ')[0] : (item.fecha_registro ? item.fecha_registro.split(' ')[0] : '');

            const mugHTML = item.mug ? `<span class="copyable-mug" data-mug="${item.mug}" title="Clic para copiar MUG">
                <span>${item.mug}</span>
                <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </span>` : '-';

            tableHTML += `
                <tr data-config-id="${item.id_config || ''}" data-ingreso-id="${item.id_ingreso}">
                    <td style="padding: 0.6rem 1rem;">${mugHTML}</td>
                    <td style="padding: 0.6rem 1rem;">${item.numero_nomina || '-'}</td>
                    <td style="padding: 0.6rem 1rem;"><strong>${item.nombre} ${item.apellido_paterno} ${item.apellido_materno || ''}</strong></td>
                    <td style="padding: 0.6rem 1rem;">${item.puesto}<br><span style="font-size:0.75rem; color:#2563eb;">${item.nombre_area || ''}</span></td>
                    <td style="padding: 0.6rem 1rem;">
                        <span class="badge-status ${statusClass}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 12px;">${statusText}</span>
                    </td>
                    <td style="padding: 0.6rem 1rem;">
                        <input type="email" class="it-input-correo" data-id="${item.id_config || ''}" data-ingreso="${item.id_ingreso}" value="${defaultCorreo}" placeholder="nombre.apellido@safrangroup.com" style="width: 100%; min-width: 220px; padding: 0.45rem 0.65rem; border: 1px solid var(--card-border, #cbd5e1); border-radius: 6px; font-family: monospace; font-size: 0.85rem; font-weight: 600; color: #059669; background: var(--bg-main, #ffffff);">
                    </td>
                    <td style="padding: 0.6rem 1rem;">
                        <input type="text" class="it-input-password" data-id="${item.id_config || ''}" data-ingreso="${item.id_ingreso}" value="${defaultPass}" placeholder="QueretaroMex2026*" style="width: 100%; min-width: 160px; padding: 0.45rem 0.65rem; border: 1px solid var(--card-border, #cbd5e1); border-radius: 6px; font-family: monospace; font-size: 0.85rem; color: var(--text-main, #0f172a); background: var(--bg-main, #ffffff);">
                    </td>
                    <td style="padding: 0.6rem 1rem; font-size: 0.85rem; color: var(--text-muted);">${fechaIngresoStr}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table></div>';
        body.innerHTML = tableHTML;

        block.appendChild(header);
        block.appendChild(body);
        container.appendChild(block);
    });
}

/* Enviar Carga Completa a RH */
async function sendCargaToRH(block, items, dateKey) {
    const ok = await window.showConfirm(
        `¿Deseas finalizar la configuración de los ${items.length} usuarios de esta carga y enviárselos a Recursos Humanos?`,
        "Enviar Carga a RH",
        "question",
        "Sí, enviar",
        "Cancelar"
    );
    if (!ok) return;

    const payload = [];
    const rows = block.querySelectorAll('tbody tr');

    rows.forEach(tr => {
        const idIngreso = tr.dataset.ingresoId;
        const idConfig = tr.dataset.configId;
        const correoInput = tr.querySelector('.it-input-correo');
        const passInput = tr.querySelector('.it-input-password');

        const item = items.find(i => i.id_ingreso == idIngreso);

        let correo = correoInput ? correoInput.value.trim() : (item ? item.correo_asignado : '');
        if (!correo && item) {
            correo = generateDefaultEmailIT(item.nombre, item.apellido_paterno);
        }

        let pass = passInput ? passInput.value.trim() : (item ? item.password_asignado : 'QueretaroMex2026*');

        payload.push({
            id_config: idConfig || (item ? item.id_config : null),
            id_ingreso: idIngreso,
            correo_asignado: correo,
            password_asignado: pass,
            config_completada: 1,
            estatus: 'completada'
        });
    });

    try {
        const res = await fetch('../back/api/api_configuracion_it.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.status === 'success') {
            await loadITPendientes();
            window.showAlert('¡Carga completada y notificada a RH exitosamente!', 'Éxito', 'success');
        } else {
            window.showAlert('Error al enviar a RH: ' + result.message, 'Error', 'error');
        }
    } catch (err) {
        console.error(err);
        window.showAlert('Error de conexión al enviar a RH.', 'Error de Red', 'error');
    }
}

/* Renderizar Vista General Pendientes (Tabla Plana) */
function renderGeneralTableIT(data) {
    const tbody = document.getElementById('it-pendientes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">Sin altas pendientes.</td></tr>';
        return;
    }

    data.forEach(item => {
        let defaultCorreo = item.correo_asignado || generateDefaultEmailIT(item.nombre, item.apellido_paterno);

        const mugHTML = item.mug ? `<span class="copyable-mug" data-mug="${item.mug}" title="Clic para copiar MUG">
            <span>${item.mug}</span>
            <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </span>` : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mugHTML}</td>
            <td>${item.numero_nomina || '-'}</td>
            <td><strong>${item.nombre} ${item.apellido_paterno} ${item.apellido_materno || ''}</strong></td>
            <td>${item.puesto} <br><span style="font-size:0.75rem; color:#2563eb;">${item.nombre_area || ''}</span></td>
            <td>${item.fecha_registro ? item.fecha_registro.split(' ')[0] : ''}</td>
            <td><span style="font-family: monospace; font-size:0.85rem; color:#059669;">${defaultCorreo}</span></td>
            <td><span class="badge-status ${item.estatus}">${item.estatus.replace('_', ' ')}</span></td>
            <td style="text-align:center;">
                <button class="btn-edit btn-config-item" data-id="${item.id_config}" title="Configurar">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
            </td>
        `;

        tr.querySelector('.btn-config-item').addEventListener('click', () => {
            openConfigModal(item);
        });

        tbody.appendChild(tr);
    });
}

/* Renderizar Vista Altas Completadas por IT */
function renderITCompletadas() {
    const tbody = document.getElementById('it-completadas-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const term = (document.getElementById('search-it-completadas')?.value || '').toLowerCase();
    let data = window.IT.completadasData;
    if (term) {
        data = data.filter(i =>
            (i.mug && i.mug.toLowerCase().includes(term)) ||
            (i.nombre && i.nombre.toLowerCase().includes(term)) ||
            (i.correo_asignado && i.correo_asignado.toLowerCase().includes(term))
        );
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay altas completadas todavía.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        const dateCompleted = item.fecha_completada ? new Date(item.fecha_completada).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-';

        const mugHTML = item.mug ? `<span class="copyable-mug" data-mug="${item.mug}" title="Clic para copiar MUG">
            <span>${item.mug}</span>
            <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </span>` : '-';

        tr.innerHTML = `
            <td>${mugHTML}</td>
            <td>${item.numero_nomina}</td>
            <td>${item.nombre} ${item.apellido_paterno} ${item.apellido_materno || ''}</td>
            <td>${item.puesto}</td>
            <td>${item.nombre_area || ''} / ${item.nombre_planta || ''}</td>
            <td><strong style="color: #10b981; font-family: monospace;">${item.correo_asignado || '-'}</strong></td>
            <td>${item.nombre_responsable || 'IT Support'}</td>
            <td>${dateCompleted}</td>
            <td style="text-align:center;">
                <button class="btn-edit btn-view-item" title="Ver detalle">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </button>
            </td>
        `;

        tr.querySelector('.btn-view-item').addEventListener('click', () => {
            openConfigModal(item);
        });

        tbody.appendChild(tr);
    });
}

/* Modal Configuración Individual */
function openConfigModal(item) {
    const modal = document.getElementById('modal-config-it');
    if (!modal) return;

    document.getElementById('it_id_config').value = item.id_config || '';
    document.getElementById('it_id_ingreso').value = item.id_ingreso || '';

    let defaultCorreo = item.correo_asignado || generateDefaultEmailIT(item.nombre, item.apellido_paterno);

    document.getElementById('it_correo_asignado').value = defaultCorreo;
    document.getElementById('it_password_asignado').value = item.password_asignado || 'QueretaroMex2026*';
    document.getElementById('it_notas').value = item.notas || '';

    document.getElementById('info-emp-nombre').innerText = `${item.nombre} ${item.apellido_paterno} ${item.apellido_materno || ''}`;
    document.getElementById('info-emp-mug').innerText = `${item.mug} / ${item.numero_nomina}`;
    document.getElementById('info-emp-puesto').innerText = item.puesto || '-';
    document.getElementById('info-emp-area').innerText = `${item.nombre_area || '-'} (${item.nombre_planta || '-'})`;

    modal.classList.add('show');
}

function closeConfigModal() {
    const modal = document.getElementById('modal-config-it');
    if (modal) modal.classList.remove('show');
}

async function saveIndividualConfig() {
    const btnSave = document.getElementById('btn-save-config');
    btnSave.disabled = true;
    btnSave.innerText = 'Guardando...';

    const idConfig = document.getElementById('it_id_config').value;
    const idIngreso = document.getElementById('it_id_ingreso').value;
    const correo = document.getElementById('it_correo_asignado').value;
    const password = document.getElementById('it_password_asignado').value;
    const notas = document.getElementById('it_notas').value;

    const payload = {
        id_config: idConfig,
        id_ingreso: idIngreso,
        correo_asignado: correo,
        password_asignado: password,
        config_completada: 1,
        estatus: 'completada',
        notas: notas
    };

    try {
        const res = await fetch('../back/api/api_configuracion_it.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.status === 'success') {
            closeConfigModal();
            loadITPendientes();
            window.showAlert('Credenciales guardadas correctamente.', 'Éxito', 'success');
        } else {
            window.showAlert('Error al guardar: ' + result.message, 'Error', 'error');
        }
    } catch (err) {
        window.showAlert('Error de conexión al guardar la configuración.', 'Error de Red', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = 'Guardar Credenciales';
    }
}

function empty(str) {
    return !str || str.trim() === '';
}

function formatDateIT(dateStr) {
    if (!dateStr || dateStr === 'Sin fecha') return 'Carga Sin Fecha';
    const parts = dateStr.trim().split(' ')[0].split('T')[0].split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const label = d.toLocaleDateString('es-MX', options);
            return label.charAt(0).toUpperCase() + label.slice(1);
        }
    }
    return dateStr;
}

// Exportar globalmente
window.loadITPendientes = loadITPendientes;
window.loadITCompletadas = loadITCompletadas;
