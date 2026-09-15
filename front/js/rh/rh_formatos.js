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
        badge: { to: 'seguridad.patrimonial@safrangroup.com', cc: '' },
        transporte: { to: 'transporte@safrangroup.com', cc: '' },
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
// HELPER PARA VALIDAR DATOS INCOMPLETOS POR ÁREA
// ============================================
function getValOrMissing(val) {
    if (val === null || val === undefined) return 'AÚN FALTAN DATOS POR REGISTRAR';
    const s = String(val).trim();
    if (s === '' || s === '-' || s === 'Sin área' || s === 'Sin planta') return 'AÚN FALTAN DATOS POR REGISTRAR';
    return s;
}

window.RH.checkFormatIncomplete = function(formatType, empOrEmps) {
    if (!empOrEmps) return 0;
    const emps = Array.isArray(empOrEmps) ? empOrEmps : [empOrEmps];
    const fieldsByFormat = {
        it: ['mug', 'numero_nomina', 'nombre', 'apellido_paterno', 'puesto', 'jefe_directo', 'nombre_area', 'nombre_planta', 'fecha_ingreso'],
        epp: ['numero_nomina', 'nombre', 'apellido_paterno', 'puesto', 'jefe_directo', 'nombre_area', 'talla_zapato', 'talla_pantalon', 'talla_playera', 'camisola', 'sobrelente'],
        badge: ['numero_nomina', 'nombre', 'apellido_paterno', 'imss', 'curp', 'nombre_planta', 'nombre_area', 'puesto', 'tipo_alta', 'tarjeta_solicitada', 'numero_tarjeta', 'domicilio', 'ruta_acceso', 'ruta_entrada', 'parada_entrada', 'ruta_salida', 'parada_salida'],
        transporte: ['numero_nomina', 'nombre', 'apellido_paterno', 'imss', 'curp', 'nombre_planta', 'nombre_area', 'puesto', 'tipo_alta', 'tarjeta_solicitada', 'numero_tarjeta', 'domicilio', 'ruta_acceso', 'ruta_entrada', 'parada_entrada', 'ruta_salida', 'parada_salida'],
        medico: ['numero_nomina', 'nombre', 'apellido_paterno', 'puesto', 'nombre_area', 'nombre_planta', 'fecha_ingreso']
    };

    const fields = fieldsByFormat[formatType] || [];
    let countIncomplete = 0;

    emps.forEach(emp => {
        let isEmpIncomplete = false;
        fields.forEach(f => {
            let val = emp[f];
            if (f === 'nombre_area') val = val || emp.area;
            if (f === 'nombre_planta') val = val || emp.planta;
            if (val === null || val === undefined || String(val).trim() === '' || String(val).trim() === '-' || String(val).trim() === 'Sin área' || String(val).trim() === 'Sin planta') {
                isEmpIncomplete = true;
            }
        });
        if (isEmpIncomplete) countIncomplete++;
    });

    return countIncomplete;
};

// ============================================
// GENERADOR DE PLANTILLAS INDIVIDUALES Y LOTE
// ============================================
window.RH.getFormatTemplate = function(formatType, empOrEmps) {
    if (Array.isArray(empOrEmps)) {
        return window.RH.getBatchFormatTemplate(formatType, empOrEmps);
    }
    const emp = empOrEmps;
    const fechaStr = extractFechaIngreso(emp);
    const incompleteCount = window.RH.checkFormatIncomplete(formatType, [emp]);
    let noteText = "";
    if (incompleteCount > 0) {
        noteText = `\n\n⚠️ NOTA: Esta solicitud contiene campos con "AÚN FALTAN DATOS POR REGISTRAR". Por favor tomar en cuenta para el seguimiento.`;
    }
    const defaultBody = `Buen día equipo, comparto los ingresos del día (${fechaStr}).${noteText}\n\nQuedo atento a cualquier duda o aclaración.\n\nAtentamente,\nRecursos Humanos - Safran`;

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
            title: '3. Formato Alta de Badge (Seguridad Patrimonial)',
            dest: 'Destinatarios: Seguridad Patrimonial',
            subject: `Alta de Badges - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'transporte') {
        return {
            title: '4. Formato Alta de Transporte',
            dest: 'Destinatarios: Transporte',
            subject: `Alta de Transporte - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'medico') {
        return {
            title: '5. Formato Servicio Médico',
            dest: 'Destinatario: Servicio Médico',
            subject: `Registro Servicio Médico - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    }
};

window.RH.getBatchFormatTemplate = function(formatType, emps) {
    const count = emps.length;
    const fechaStr = extractFechaIngreso(emps);
    const incompleteCount = window.RH.checkFormatIncomplete(formatType, emps);
    let noteText = "";
    if (incompleteCount > 0) {
        noteText = `\n\n⚠️ NOTA: Esta solicitud contiene colaborador(es) con información pendiente por registrar ("AÚN FALTAN DATOS POR REGISTRAR").`;
    }
    const defaultBody = `Buen día equipo, comparto los ingresos del día (${fechaStr}).${noteText}\n\nQuedo atento a cualquier duda o aclaración.\n\nAtentamente,\nRecursos Humanos - Safran`;

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
            title: `3. Formato Badge (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatarios: Seguridad Patrimonial',
            subject: `Alta de Badges - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'transporte') {
        return {
            title: `4. Formato Transporte (Carga Masiva - ${count} Colaboradores)`,
            dest: 'Destinatarios: Transporte',
            subject: `Alta de Transporte - Ingresos (${fechaStr})`,
            body: defaultBody
        };
    } else if (formatType === 'medico') {
        return {
            title: `5. Formato Servicio Médico (Carga Masiva - ${count} Colaboradores)`,
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

    const incompleteCount = window.RH.checkFormatIncomplete(formatType, targetEmpData);
    let statusNoticeEl = document.getElementById('format-status-notice');
    if (!statusNoticeEl) {
        statusNoticeEl = document.createElement('div');
        statusNoticeEl.id = 'format-status-notice';
        if (cardTitle && cardTitle.parentElement) {
            cardTitle.parentElement.insertBefore(statusNoticeEl, cardTitle.nextSibling);
        }
    }
    if (incompleteCount > 0 && statusNoticeEl) {
        statusNoticeEl.style.display = 'flex';
        statusNoticeEl.style.alignItems = 'center';
        statusNoticeEl.style.gap = '0.5rem';
        statusNoticeEl.style.margin = '0.5rem 0 1rem';
        statusNoticeEl.style.padding = '0.75rem 1rem';
        statusNoticeEl.style.background = '#fef2f2';
        statusNoticeEl.style.border = '1.5px solid #fca5a5';
        statusNoticeEl.style.borderRadius = '8px';
        statusNoticeEl.style.color = '#991b1b';
        statusNoticeEl.style.fontSize = '0.88rem';
        statusNoticeEl.style.fontWeight = '700';
        statusNoticeEl.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.15)';
        statusNoticeEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#dc2626" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>🚨 ALERTA DE DATOS PENDIENTES: ${incompleteCount} registro(s) contienen información requerida sin llenar. En el reporte de Excel se marcarán en ROJO con "AÚN FALTAN DATOS POR REGISTRAR".</span>
        `;
    } else if (statusNoticeEl) {
        statusNoticeEl.style.display = 'none';
    }

    // Cargar destinatarios y copia guardados
    const cfg = window.RH.getStoredEmailConfig();
    const tabCfg = cfg[formatType] || { to: '', cc: '' };
    if (toInput) toInput.value = tabCfg.to || '';
    if (ccInput) ccInput.value = tabCfg.cc || '';

    const dropzone = document.getElementById('badge-photo-dropzone');
    if (dropzone) {
        if (formatType === 'badge') {
            dropzone.style.display = 'block';
            window.RH.renderBadgePhotosList();
        } else {
            dropzone.style.display = 'none';
        }
    }
};

// ============================================
// LANZAR OUTLOOK (mailto:)
// ============================================
// ============================================
// LANZAR OUTLOOK (mailto:)
// ============================================
window.RH.openOutlookFormat = async function(formatType) {
    const currentTab = formatType || window.RH.activeFormatTab || 'it';
    const targetEmpData = window.RH.currentBatchEmps || window.RH.currentFormatEmp;
    if (!targetEmpData) return;

    const incompleteCount = window.RH.checkFormatIncomplete(currentTab, targetEmpData);
    if (incompleteCount > 0) {
        const areaNames = {
            it: 'IT (Servicios de TI)',
            epp: 'EPP, HSE, Almacén y RH',
            badge: 'Badge (Seguridad Patrimonial)',
            transporte: 'Transporte',
            medico: 'Servicio Médico'
        };
        const areaLabel = areaNames[currentTab] || currentTab.toUpperCase();

        if (window.Swal) {
            const result = await Swal.fire({
                title: '⚠️ ¡Aún Faltan Datos por Registrar!',
                html: `Se detectaron <strong>${incompleteCount} registro(s)</strong> con datos incompletos requeridos para el formato de <strong>${areaLabel}</strong>.<br><br>En la solicitud y reporte de Excel se incluirá la leyenda <span style="color:#dc2626; font-weight:bold;">"AÚN FALTAN DATOS POR REGISTRAR"</span>.<br><br>¿Deseas continuar y abrir el correo en Outlook de todos modos?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '📧 Sí, abrir Outlook',
                cancelButtonText: '✏️ Cancelar y completar datos',
                confirmButtonColor: '#0078d4',
                cancelButtonColor: '#6e7881',
                customClass: {
                    popup: 'safran-swal-popup'
                }
            });
            if (!result.isConfirmed) return;
        } else {
            const ok = confirm(`Atención: Existen ${incompleteCount} registro(s) con datos incompletos para el área de ${areaLabel}. ¿Deseas abrir Outlook de todos modos?`);
            if (!ok) return;
        }
    }

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

    // ZIP GENERATION para fotos de Badge
    if (currentTab === 'badge' && window.RH.badgePhotos.length > 0 && typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        window.RH.badgePhotos.forEach(fileObj => {
            zip.file(fileObj.file.name, fileObj.file);
        });
        zip.generateAsync({ type: 'blob' }).then(function(content) {
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Fotos_Badge_${window.RH.badgePhotos.length}_Ingresos_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            if (typeof window.showAlert === 'function') {
                window.showAlert("El archivo ZIP con las fotos se descargó. Arrástralo al correo que acaba de abrirse.", "ZIP Descargado", "info");
            }
        });
    }

    let mailtoUrl = `mailto:${encodeURIComponent(cleanTo)}?`;
    const params = [];
    if (cleanCc) params.push(`cc=${encodeURIComponent(cleanCc)}`);
    if (subjectVal) params.push(`subject=${encodeURIComponent(subjectVal)}`);
    if (bodyVal) params.push(`body=${encodeURIComponent(bodyVal)}`);

    mailtoUrl += params.join('&');
    
    // Mostrar Animación
    const overlay = document.getElementById('email-animation-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Forzar reflow
        void overlay.offsetWidth;
        overlay.classList.add('show');
        overlay.querySelector('.email-animation-content').classList.add('email-animating');
        
        // Esperar a que la carta entre (1.2s) y el sobre empiece a volar
        setTimeout(() => {
            window.location.href = mailtoUrl;
            
            // Ocultar después de un tiempo
            setTimeout(() => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.querySelector('.email-animation-content').classList.remove('email-animating');
                }, 300);
            }, 1000); // 1 segundo extra para que termine de volar
            
        }, 1200);
    } else {
        window.location.href = mailtoUrl;
    }
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
        title = "Formato de Alta de Badge (Seguridad Patrimonial)";
        filename = `Formato_Badge_${emps.length}_Ingresos`;
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
    } else if (currentTab === 'transporte') {
        title = "Formato de Alta de Transporte";
        filename = `Formato_Transporte_${emps.length}_Ingresos`;
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

    const mappedData = emps.map(emp => {
        const nombreComp = `${emp.nombre || ''} ${emp.apellido_paterno || ''} ${emp.apellido_materno || ''}`.trim();
        return {
            mug: getValOrMissing(emp.mug),
            numero_nomina: getValOrMissing(emp.numero_nomina),
            nombreCompleto: getValOrMissing(nombreComp),
            puesto: getValOrMissing(emp.puesto),
            jefe_directo: getValOrMissing(emp.jefe_directo),
            nombre_area: getValOrMissing(emp.nombre_area || emp.area),
            nombre_planta: getValOrMissing(emp.nombre_planta || emp.planta),
            fecha_ingreso: getValOrMissing(emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : ''),
            imss: getValOrMissing(emp.imss),
            curp: getValOrMissing(emp.curp),
            domicilio: getValOrMissing(emp.domicilio),
            tipo_alta: getValOrMissing(emp.tipo_alta),
            talla_zapato: getValOrMissing(emp.talla_zapato),
            talla_pantalon: getValOrMissing(emp.talla_pantalon),
            talla_playera: getValOrMissing(emp.talla_playera),
            camisola: getValOrMissing(emp.camisola),
            sobrelente: getValOrMissing(emp.sobrelente),
            tarjeta_solicitada: getValOrMissing(emp.tarjeta_solicitada),
            numero_tarjeta: getValOrMissing(emp.numero_tarjeta),
            ruta_acceso: getValOrMissing(emp.ruta_acceso),
            ruta_entrada: getValOrMissing(emp.ruta_entrada),
            parada_entrada: getValOrMissing(emp.parada_entrada),
            ruta_salida: getValOrMissing(emp.ruta_salida),
            parada_salida: getValOrMissing(emp.parada_salida)
        };
    });

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

window.RH = window.RH || {};
window.RH.badgePhotos = [];

// ============================================
// LÓGICA DE FOTOS DE BADGE (DRAG & DROP)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('badge-photo-dropzone');
    const fileInput = document.getElementById('badge-photo-input');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.style.background = 'rgba(14, 165, 233, 0.15)', false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.style.background = 'rgba(14, 165, 233, 0.05)', false);
    });

    dropzone.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                // Verificar si ya existe para reemplazar o agregar
                const existingIndex = window.RH.badgePhotos.findIndex(f => f.file.name === file.name);
                if (existingIndex >= 0) {
                    window.RH.badgePhotos[existingIndex] = { file: file, url: URL.createObjectURL(file) };
                } else {
                    window.RH.badgePhotos.push({ file: file, url: URL.createObjectURL(file) });
                }
            }
        });
        window.RH.renderBadgePhotosList();
    }
});

window.RH.renderBadgePhotosList = function() {
    const listContainer = document.getElementById('badge-photo-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    // Obtener nóminas actuales si existen
    const targetEmpData = window.RH.currentBatchEmps || window.RH.currentFormatEmp;
    let expectedNominas = [];
    if (targetEmpData) {
        const emps = Array.isArray(targetEmpData) ? targetEmpData : [targetEmpData];
        expectedNominas = emps.map(e => String(e.numero_nomina));
    }

    window.RH.badgePhotos.forEach((fileObj, index) => {
        const fileNameBase = fileObj.file.name.split('.')[0];
        const isMatched = expectedNominas.includes(fileNameBase);
        const matchIcon = isMatched ? 
            `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#10b981" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>` : 
            `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#f59e0b" stroke-width="3" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        
        const item = document.createElement('div');
        item.style.display = 'inline-flex';
        item.style.alignItems = 'center';
        item.style.gap = '0.4rem';
        item.style.padding = '0.2rem 0.5rem';
        item.style.background = isMatched ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
        item.style.border = isMatched ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)';
        item.style.borderRadius = '20px';
        item.style.fontSize = '0.75rem';
        item.style.color = isMatched ? '#047857' : '#b45309';

        item.innerHTML = `
            ${matchIcon}
            <span>${fileObj.file.name}</span>
            <button type="button" onclick="window.RH.removeBadgePhoto(${index})" style="background:none; border:none; cursor:pointer; color:inherit; display:flex; align-items:center; padding:0 0.2rem;">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        listContainer.appendChild(item);
    });
};

window.RH.removeBadgePhoto = function(index) {
    if (window.RH.badgePhotos[index]) {
        URL.revokeObjectURL(window.RH.badgePhotos[index].url);
        window.RH.badgePhotos.splice(index, 1);
        window.RH.renderBadgePhotosList();
    }
};
window.copyFormatTemplate = window.RH.copyFormatTemplate;
window.exportAreaExcel = window.RH.exportAreaExcel;

