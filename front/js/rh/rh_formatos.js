window.RH = window.RH || {};

window.RH.currentFormatEmp = null;
window.RH.currentBatchEmps = null;
window.RH.activeFormatTab = 'it';

// ============================================
// CONFIGURACIÓN PERSISTENTE DE CORREOS POR ÁREA
// ============================================
window.RH.getStoredEmailConfig = function() {
    const saved = localStorage.getItem('safran_rh_email_config');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) { console.error('Error al leer safran_rh_email_config', e); }
    }
    return {
        it: { to: 'servicios.it@safrangroup.com', cc: 'rh.notificaciones@safrangroup.com' },
        epp: { to: 'epp.almacen@safrangroup.com', cc: 'hse@safrangroup.com' },
        badge: { to: 'seguridad.patrimonial@safrangroup.com', cc: 'transporte@safrangroup.com' },
        medico: { to: 'servicio.medico@safrangroup.com', cc: 'rh.notificaciones@safrangroup.com' }
    };
};

window.RH.saveEmailConfig = function(tab, toVal, ccVal) {
    const cfg = window.RH.getStoredEmailConfig();
    cfg[tab] = { to: toVal || '', cc: ccVal || '' };
    localStorage.setItem('safran_rh_email_config', JSON.stringify(cfg));
};

window.RH.saveCurrentEmailConfig = function() {
    const tab = window.RH.activeFormatTab || 'it';
    const toInput = document.getElementById('format-to-input');
    const ccInput = document.getElementById('format-cc-input');
    const toVal = toInput ? toInput.value.trim() : '';
    const ccVal = ccInput ? ccInput.value.trim() : '';

    window.RH.saveEmailConfig(tab, toVal, ccVal);

    if (typeof window.showAlert === 'function') {
        window.showAlert(`Se guardó la configuración de correos para ${tab.toUpperCase()}.`, 'Correos Guardados', 'success');
    } else {
        alert(`Configuración guardada para ${tab.toUpperCase()}`);
    }
};

// ============================================
// APERTURA DE MODAL (INDIVIDUAL Y POR BATCH/CARGA)
// ============================================
window.RH.openFormatsModal = function(empId) {
    let emp = null;
    if (typeof empId === 'object' && empId !== null) {
        emp = empId;
    } else {
        emp = (window.RH.empleadosData || []).find(e => e.id_ingreso == empId);
    }
    
    if (!emp) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('No se encontró la información del empleado.', 'Error', 'error');
        }
        return;
    }

    window.RH.currentFormatEmp = emp;
    window.RH.currentBatchEmps = null;

    const modal = document.getElementById('modal-formatos-areas');
    if (!modal) return;

    const empInfoEl = document.getElementById('formatos-emp-info');
    if (empInfoEl) {
        const nombreComp = `${emp.nombre || ''} ${emp.apellido_paterno || ''} ${emp.apellido_materno || ''}`.trim();
        empInfoEl.innerHTML = `Empleado: <strong>${nombreComp}</strong> | MUG: <code>${emp.mug || '-'}</code> | Nómina: <code>${emp.numero_nomina || '-'}</code>`;
    }

    window.RH.switchFormatTab(window.RH.activeFormatTab || 'it');
    modal.classList.add('show');
};

window.RH.openBatchFormatsModal = function(empsArray, dateLabel) {
    if (!empsArray || empsArray.length === 0) {
        if (typeof window.showAlert === 'function') {
            window.showAlert('No hay empleados en esta carga para notificar.', 'Atención', 'warning');
        }
        return;
    }

    window.RH.currentBatchEmps = empsArray;
    window.RH.currentFormatEmp = empsArray[0];

    const modal = document.getElementById('modal-formatos-areas');
    if (!modal) return;

    const empInfoEl = document.getElementById('formatos-emp-info');
    if (empInfoEl) {
        empInfoEl.innerHTML = `<strong>Carga Masiva (${dateLabel || 'Fecha de Registro'})</strong> | total: <strong>${empsArray.length} empleados</strong>`;
    }

    window.RH.switchFormatTab(window.RH.activeFormatTab || 'it');
    modal.classList.add('show');
};

window.RH.closeFormatsModal = function() {
    const modal = document.getElementById('modal-formatos-areas');
    if (modal) modal.classList.remove('show');
};

// ============================================
// HELPER PARA EXTRAER Y FORMATER FECHA DE INGRESO
// ============================================
function extractFechaIngreso(empOrEmps) {
    let rawDate = null;
    if (Array.isArray(empOrEmps) && empOrEmps.length > 0) {
        rawDate = empOrEmps[0].fecha_ingreso || empOrEmps[0].fecha_registro;
    } else if (empOrEmps && typeof empOrEmps === 'object') {
        rawDate = empOrEmps.fecha_ingreso || empOrEmps.fecha_registro;
    }

    if (!rawDate || rawDate === '-') {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof rawDate === 'string' && rawDate.includes('-')) {
        const parts = rawDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    return rawDate;
}

// ============================================
// GENERADOR DE PLANTILLAS INDIVIDUALES Y LOTE
// ============================================
window.RH.getFormatTemplate = function(formatType, empOrEmps) {
    if (Array.isArray(empOrEmps)) {
        return window.RH.getBatchFormatTemplate(formatType, empOrEmps);
    }
    const emp = empOrEmps;
    const fechaStr = extractFechaIngreso(emp);
    const defaultBody = `Buen día equipo, comparto los ingresos del día (${fechaStr}).\n\nQuedo atento a cualquier duda o aclaración.\n\nAtentamente,\nRecursos Humanos - Safran`;

    if (formatType === 'it') {
        return {
            title: '1. Formato IT (Servicios de TI)',
            dest: 'Destinatario: Equipo de IT / Service Desk',
            subject: `Solicitud de Servicios de IT - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'epp') {
        return {
            title: '2. Formato EPP, HSE, Almacén y RH',
            dest: 'Destinatarios: Equipos de EPP, HSE, Almacén y RH',
            subject: `Solicitud de EPP y Equipamiento - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'badge') {
        return {
            title: '3. Formato Alta de Badge y Transporte',
            dest: 'Destinatarios: Seguridad Patrimonial y Transporte',
            subject: `Alta de Badges y Transporte - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'medico') {
        return {
            title: '4. Formato Servicio Médico',
            dest: 'Destinatario: Servicio Médico',
            subject: `Registro Servicio Médico - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    }
};

window.RH.getBatchFormatTemplate = function(formatType, emps) {
    const count = emps.length;
    const fechaStr = extractFechaIngreso(emps);
    const defaultBody = `Buen día equipo, comparto los ingresos del día (${fechaStr}).\n\nQuedo atento a cualquier duda o aclaración.\n\nAtentamente,\nRecursos Humanos - Safran`;

    if (formatType === 'it') {
        return {
            title: `1. Formato IT (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatario: Equipo de IT / Service Desk',
            subject: `Solicitud de Servicios de IT - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'epp') {
        return {
            title: `2. Formato EPP/HSE (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatarios: Equipos de EPP, HSE, Almacén y RH',
            subject: `Solicitud de EPP y Equipamiento - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'badge') {
        return {
            title: `3. Formato Badge & Transporte (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatarios: Seguridad Patrimonial y Transporte',
            subject: `Alta de Badges y Transporte - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'medico') {
        return {
            title: `4. Formato Servicio Médico (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatario: Servicio Médico',
            subject: `Registro Servicio Médico - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    }
};

// ============================================
// INTERACCIÓN CON PESTAÑAS Y MODAL
// ============================================
window.RH.switchFormatTab = function(formatType) {
    window.RH.activeFormatTab = formatType;
    
    document.querySelectorAll('#modal-formatos-areas .format-tab-btn').forEach(btn => {
        if (btn.dataset.format === formatType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const targetEmpData = window.RH.currentBatchEmps || window.RH.currentFormatEmp;
    if (!targetEmpData) return;

    const tpl = window.RH.getFormatTemplate(formatType, targetEmpData);
    
    const cardTitle = document.getElementById('format-card-title');
    const cardDest = document.getElementById('format-card-dest');
    const subjectInput = document.getElementById('format-subject-input');
    const bodyTextarea = document.getElementById('format-body-textarea');
    const toInput = document.getElementById('format-to-input');
    const ccInput = document.getElementById('format-cc-input');

    if (cardTitle) cardTitle.textContent = tpl.title;
    if (cardDest) cardDest.textContent = tpl.dest;
    if (subjectInput) subjectInput.value = tpl.subject;
    if (bodyTextarea) bodyTextarea.value = tpl.body;

    // Cargar destinatarios y copia guardados
    const cfg = window.RH.getStoredEmailConfig();
    const tabCfg = cfg[formatType] || { to: '', cc: '' };
    if (toInput) toInput.value = tabCfg.to || '';
    if (ccInput) ccInput.value = tabCfg.cc || '';
};

// ============================================
// LANZAR OUTLOOK (mailto:)
// ============================================
// ============================================
// LANZAR OUTLOOK (mailto:)
// ============================================
window.RH.openOutlookFormat = function(formatType) {
    const currentTab = formatType || window.RH.activeFormatTab || 'it';
    const targetEmpData = window.RH.currentBatchEmps || window.RH.currentFormatEmp;
    if (!targetEmpData) return;

    const toInput = document.getElementById('format-to-input');
    const ccInput = document.getElementById('format-cc-input');
    const subjectInput = document.getElementById('format-subject-input');
    const bodyTextarea = document.getElementById('format-body-textarea');

    const toVal = toInput ? toInput.value.trim() : '';
    const ccVal = ccInput ? ccInput.value.trim() : '';
    const subjectVal = subjectInput ? subjectInput.value : '';
    const bodyVal = bodyTextarea ? bodyTextarea.value : '';

    // Guardar destinatarios automáticamente en localStorage
    window.RH.saveEmailConfig(currentTab, toVal, ccVal);

    // Normalizar múltiples correos (separados por coma, punto y coma, salto de línea o espacios)
    function normalizeEmails(raw) {
        if (!raw) return '';
        const emails = raw.split(/[\r\n,;\s]+/).map(e => e.trim()).filter(Boolean);
        return emails.join('; ');
    }

    const cleanTo = normalizeEmails(toVal);
    const cleanCc = normalizeEmails(ccVal);

    let mailtoUrl = `mailto:${encodeURIComponent(cleanTo)}?`;
    const params = [];
    if (cleanCc) params.push(`cc=${encodeURIComponent(cleanCc)}`);
    if (subjectVal) params.push(`subject=${encodeURIComponent(subjectVal)}`);
    if (bodyVal) params.push(`body=${encodeURIComponent(bodyVal)}`);

    mailtoUrl += params.join('&');
    window.location.href = mailtoUrl;
};

// ============================================
// COPIAR PLANTILLA AL PORTAPAPEL
// ============================================
window.RH.copyFormatTemplate = function() {
    const subjectInput = document.getElementById('format-subject-input');
    const bodyTextarea = document.getElementById('format-body-textarea');
    const toInput = document.getElementById('format-to-input');

    const subject = subjectInput ? subjectInput.value : '';
    const body = bodyTextarea ? bodyTextarea.value : '';
    const to = toInput ? toInput.value : '';

    const fullText = `PARA: ${to}\nASUNTO: ${subject}\n\n${body}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
            if (typeof window.showAlert === 'function') {
                window.showAlert('La plantilla de correo fue copiada al portapapeles correctamente.', 'Plantilla Copiada', 'success');
            } else {
                alert('Plantilla copiada al portapapeles.');
            }
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (typeof window.showAlert === 'function') {
            window.showAlert('La plantilla de correo fue copiada al portapapeles.', 'Plantilla Copiada', 'success');
        } else {
            alert('Plantilla copiada al portapapeles.');
        }
    }
};

// ============================================
// EXPORTAR EXCEL DE ÁREA ESPECÍFICA (.xlsx)
// ============================================
window.RH.exportAreaExcel = function(formatType) {
    const currentTab = formatType || window.RH.activeFormatTab || 'it';
    const targetEmpData = window.RH.currentBatchEmps || window.RH.currentFormatEmp;
    if (!targetEmpData) return;

    const emps = Array.isArray(targetEmpData) ? targetEmpData : [targetEmpData];
    if (emps.length === 0) return;

    let columns = [];
    let title = "";
    let filename = "";

    if (currentTab === 'it') {
        title = "Formato de Notificación a Servicios de IT";
        filename = `Formato_IT_${emps.length}_Ingresos`;
        columns = [
            { header: 'MUG', field: 'mug' },
            { header: 'No. Nómina', field: 'numero_nomina' },
            { header: 'Nombre Completo', field: 'nombreCompleto' },
            { header: 'Puesto', field: 'puesto' },
            { header: 'Jefe Directo', field: 'jefe_directo' },
            { header: 'Área', field: 'nombre_area' },
            { header: 'Planta', field: 'nombre_planta' },
            { header: 'Fecha Ingreso', field: 'fecha_ingreso' }
        ];
    } else if (currentTab === 'epp') {
        title = "Formato de Notificación a EPP, HSE, Almacén y RH";
        filename = `Formato_EPP_HSE_Almacen_${emps.length}_Ingresos`;
        columns = [
            { header: 'No. Nómina', field: 'numero_nomina' },
            { header: 'Nombre Completo', field: 'nombreCompleto' },
            { header: 'Puesto', field: 'puesto' },
            { header: 'Líder / Jefe Directo', field: 'jefe_directo' },
            { header: 'Área', field: 'nombre_area' },
            { header: 'Talla Zapato', field: 'talla_zapato' },
            { header: 'Talla Pantalón', field: 'talla_pantalon' },
            { header: 'Talla Playera', field: 'talla_playera' },
            { header: 'Camisola', field: 'camisola' },
            { header: 'Sobrelente de Seguridad', field: 'sobrelente' }
        ];
    } else if (currentTab === 'badge') {
        title = "Formato de Alta de Badge (Seguridad Patrimonial) y Transporte";
        filename = `Formato_Badge_Transporte_${emps.length}_Ingresos`;
        columns = [
            { header: 'No. Empleado', field: 'numero_nomina' },
            { header: 'Nombre Completo', field: 'nombreCompleto' },
            { header: 'IMSS (NSS)', field: 'imss' },
            { header: 'CURP', field: 'curp' },
            { header: 'Planta', field: 'nombre_planta' },
            { header: 'Área', field: 'nombre_area' },
            { header: 'Puesto', field: 'puesto' },
            { header: 'Tipo de Alta', field: 'tipo_alta' },
            { header: 'Tarjeta Solicitada', field: 'tarjeta_solicitada' },
            { header: 'No. Tarjeta', field: 'numero_tarjeta' },
            { header: 'Domicilio Completo', field: 'domicilio' },
            { header: 'Ruta Acceso', field: 'ruta_acceso' },
            { header: 'Ruta Entrada', field: 'ruta_entrada' },
            { header: 'Parada Entrada', field: 'parada_entrada' },
            { header: 'Ruta Salida', field: 'ruta_salida' },
            { header: 'Parada Salida', field: 'parada_salida' }
        ];
    } else if (currentTab === 'medico') {
        title = "Formato de Notificación a Servicio Médico";
        filename = `Formato_Servicio_Medico_${emps.length}_Ingresos`;
        columns = [
            { header: 'No. Empleado', field: 'numero_nomina' },
            { header: 'Nombre Completo', field: 'nombreCompleto' },
            { header: 'Puesto', field: 'puesto' },
            { header: 'Área', field: 'nombre_area' },
            { header: 'Planta', field: 'nombre_planta' },
            { header: 'Fecha Ingreso', field: 'fecha_ingreso' }
        ];
    }

    const mappedData = emps.map(emp => ({
        mug: emp.mug || '-',
        numero_nomina: emp.numero_nomina || '-',
        nombreCompleto: `${emp.nombre || ''} ${emp.apellido_paterno || ''} ${emp.apellido_materno || ''}`.trim(),
        puesto: emp.puesto || '-',
        jefe_directo: emp.jefe_directo || '-',
        nombre_area: emp.nombre_area || emp.area || 'Sin área',
        nombre_planta: emp.nombre_planta || emp.planta || 'Sin planta',
        fecha_ingreso: emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : '-',
        imss: emp.imss || '-',
        curp: emp.curp || '-',
        domicilio: emp.domicilio || '-',
        tipo_alta: emp.tipo_alta || 'Nuevo Ingreso',
        talla_zapato: emp.talla_zapato || '-',
        talla_pantalon: emp.talla_pantalon || '-',
        talla_playera: emp.talla_playera || '-',
        camisola: emp.camisola || '-',
        sobrelente: emp.sobrelente || '-',
        tarjeta_solicitada: emp.tarjeta_solicitada || '-',
        numero_tarjeta: emp.numero_tarjeta || '-',
        ruta_acceso: emp.ruta_acceso || '-',
        ruta_entrada: emp.ruta_entrada || '-',
        parada_entrada: emp.parada_entrada || '-',
        ruta_salida: emp.ruta_salida || '-',
        parada_salida: emp.parada_salida || '-'
    }));

    if (typeof window.exportStyledExcel === 'function') {
        window.exportStyledExcel({
            title: title,
            filename: filename,
            columns: columns,
            data: mappedData
        });
    } else {
        alert("Generador de Excel listo.");
    }
};

// Exponer funciones globales
window.openFormatsModal = window.RH.openFormatsModal;
window.openBatchFormatsModal = window.RH.openBatchFormatsModal;
window.closeFormatsModal = window.RH.closeFormatsModal;
window.switchFormatTab = window.RH.switchFormatTab;
window.openOutlookFormat = window.RH.openOutlookFormat;
window.copyFormatTemplate = window.RH.copyFormatTemplate;
window.exportAreaExcel = window.RH.exportAreaExcel;

