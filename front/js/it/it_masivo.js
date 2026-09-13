window.IT = window.IT || {};

document.addEventListener('DOMContentLoaded', () => {
    initITMasivoEvents();
});

function initITMasivoEvents() {
    const modalMasivo = document.getElementById('modal-masivo-it');
    const btnCloseMasivo = document.getElementById('btn-close-masivo-it');
    const btnCancelMasivo = document.getElementById('btn-cancel-masivo-it');
    const btnSaveMasivo = document.getElementById('btn-save-masivo-it');
    const btnSendMasivo = document.getElementById('btn-send-masivo-it');

    if (btnCloseMasivo) btnCloseMasivo.addEventListener('click', closeMasivoITModal);
    if (btnCancelMasivo) btnCancelMasivo.addEventListener('click', closeMasivoITModal);

    if (btnSaveMasivo) {
        btnSaveMasivo.addEventListener('click', async () => {
            await processMasivoIT(false);
        });
    }

    if (btnSendMasivo) {
        btnSendMasivo.addEventListener('click', async () => {
            await processMasivoIT(true);
        });
    }
}

/* Abrir Modal de Procesamiento Masivo por Carga */
window.openMasivoITModal = function (items, fechaCargaKey) {
    const modal = document.getElementById('modal-masivo-it');
    const tbody = document.getElementById('masivo-it-tbody');
    const title = document.getElementById('modal-masivo-title');

    if (!modal || !tbody) return;

    if (title) {
        const dateStr = fechaCargaKey !== 'Sin fecha' ? new Date(fechaCargaKey + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Carga Sin Fecha';
        title.innerText = `Asignación Masiva IT - ${dateStr} (${items.length} usuarios)`;
    }

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.dataset.idConfig = item.id_config || '';
        tr.dataset.idIngreso = item.id_ingreso || '';

        // Correo por defecto
        let defaultCorreo = item.correo_asignado || '';
        if (!defaultCorreo && item.nombre && item.apellido_paterno) {
            const cleanNombre = item.nombre.split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cleanApellido = item.apellido_paterno.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            defaultCorreo = `${cleanNombre}.${cleanApellido}@safran.group`;
        }

        const pass = item.password_asignado || 'QueretaroMex2026*';

        tr.innerHTML = `
            <td class="row-number">${index + 1}</td>
            <td style="padding: 0.5rem; font-size: 0.85rem;">
                <strong>${item.nombre} ${item.apellido_paterno}</strong><br>
                <span style="font-size:0.75rem; color:var(--text-muted);">MUG: ${item.mug}</span>
            </td>
            <td style="padding: 0.5rem; font-size: 0.8rem; color:var(--text-muted);">${item.puesto}</td>
            <td>
                <input type="email" class="input-masivo-correo" value="${defaultCorreo}" placeholder="nombre.apellido@safran.group" style="padding: 0.4rem; font-size:0.85rem; color:#059669; font-weight:600;">
            </td>
            <td>
                <input type="text" class="input-masivo-pass" value="${pass}" style="padding: 0.4rem; font-size:0.85rem; width: 150px;">
            </td>
        `;

        tbody.appendChild(tr);
    });

    modal.classList.add('show');
};

function closeMasivoITModal() {
    const modal = document.getElementById('modal-masivo-it');
    if (modal) modal.classList.remove('show');
}

/* Guardar o Enviar Cambios Masivos de IT a RH */
async function processMasivoIT(completeAndSend = false) {
    const tbody = document.getElementById('masivo-it-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    const payload = [];
    let missingEmail = false;

    rows.forEach(tr => {
        const idConfig = tr.dataset.idConfig;
        const idIngreso = tr.dataset.idIngreso;
        const correo = tr.querySelector('.input-masivo-correo').value.trim();
        const pass = tr.querySelector('.input-masivo-pass').value.trim();

        if (completeAndSend && !correo) {
            missingEmail = true;
        }

        payload.push({
            id_config: idConfig,
            id_ingreso: idIngreso,
            correo_asignado: correo,
            password_asignado: pass,
            config_completada: completeAndSend ? 1 : 0,
            estatus: completeAndSend ? 'completada' : 'en_proceso'
        });
    });

    if (completeAndSend && missingEmail) {
        window.showAlert('Por favor asegúrate de que todos los usuarios tengan asignado su correo corporativo antes de enviar la carga a Recursos Humanos.', 'Correo Requerido', 'warning');
        return;
    }

    if (completeAndSend) {
        const ok = await window.showConfirm(
            `¿Estás seguro de finalizar y enviar las credenciales de estos ${payload.length} usuarios a Recursos Humanos?`,
            "Enviar Carga a RH",
            "question",
            "Sí, enviar",
            "Cancelar"
        );
        if (!ok) return;
    }

    try {
        const res = await fetch('../back/api/api_configuracion_it.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.status === 'success') {
            closeMasivoITModal();
            if (typeof window.loadITPendientes === 'function') {
                window.loadITPendientes();
            }
            if (completeAndSend) {
                window.showAlert('¡Carga completada y enviada a RH correctamente!', 'Éxito', 'success');
            } else {
                window.showAlert('Registros guardados temporalmente.', 'Guardado', 'success');
            }
        } else {
            window.showAlert('Error al procesar: ' + result.message, 'Error', 'error');
        }
    } catch (err) {
        window.showAlert('Error de conexión al procesar la carga.', 'Error de Red', 'error');
    }
}
