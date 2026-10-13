window.RH = window.RH || {};

window.RH.initDirectorio = function() {
    // Aplicar validaciones al formulario individual
    if (window.RH.DOM.formEmpleado) {
        window.RH.attachInputValidations(window.RH.DOM.formEmpleado);
    }
    
    // ============================================
    // TABLA DIRECTORIO
    // ============================================
    window.RH.renderTable = function(data) {
        if (!window.RH.DOM.tableBody) return;
        window.RH.DOM.tableBody.innerHTML = '';
        data.forEach(emp => {
            const tr = document.createElement('tr');
            const isIncomplete = window.RH.isEmpIncompleteGeneral ? window.RH.isEmpIncompleteGeneral(emp) : (!emp.mug || emp.mug.trim() === '' || emp.mug.trim() === '-');

            const missingList = window.RH.getEmpMissingFields ? window.RH.getEmpMissingFields(emp) : [];
            const missingTitle = missingList.length > 0 ? `Faltan por registrar: ${missingList.join(', ')}` : 'Información completa';

            if (isIncomplete) {
                tr.style.backgroundColor = 'rgba(245, 158, 11, 0.12)'; // Amarillo suave (Información incompleta)
                tr.style.borderLeft = '4px solid #f59e0b';
                tr.title = missingTitle;
            }

            const warningIconSVG = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#d97706" stroke-width="2.5" fill="none" style="vertical-align:-2px; margin-left:4px;" title="${missingTitle}"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

            const mugHTML = emp.mug && emp.mug.trim() !== '' && emp.mug.trim() !== '-' ? `<span class="copyable-mug" data-mug="${emp.mug}" title="Clic para copiar MUG">
                <span>${emp.mug}</span>
                <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </span>` : '<span style="color:#b45309; font-weight:700; font-size:0.75rem; background:#fef3c7; border:1px solid #fde68a; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:2px;" title="MUG Pendiente"><svg viewBox="0 0 24 24" width="11" height="11" stroke="#b45309" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>Sin MUG</span>';

            const nominaHTML = emp.numero_nomina && emp.numero_nomina.trim() !== '' && emp.numero_nomina.trim() !== '-' ? emp.numero_nomina : '<span style="color:#b45309; font-weight:600; font-size:0.8rem;" title="Nómina Pendiente">-</span>';

            const statusBadgeHTML = isIncomplete 
                ? `<span class="badge-status-custom" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:0.25rem;" title="${missingTitle}"><svg viewBox="0 0 24 24" width="13" height="13" stroke="#b45309" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Faltan datos</span>`
                : `<span class="badge-status completada" style="font-size:0.75rem;">Completo</span>`;

            tr.innerHTML = `
                <td>${mugHTML}</td>
                <td>${nominaHTML}</td>
                <td><strong>${emp.nombre || ''} ${emp.apellido_paterno || ''} ${emp.apellido_materno || ''}</strong> ${isIncomplete ? warningIconSVG : ''} ${statusBadgeHTML}</td>
                <td><span class="badge" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--card-border);">${emp.puesto || 'Sin asignar'}</span></td>
                <td><span style="color:#2563eb; font-weight:600;">${emp.nombre_area || 'Sin área'}</span></td>
                <td><span style="color:#059669; font-weight:500;">${emp.nombre_planta || 'Sin planta'}</span></td>
                <td class="actions-cell">
                    <button class="btn-formats" onclick="window.RH.openFormatsModal(${emp.id_ingreso})" title="Formatos de Envío a Áreas (Outlook)" style="background: none; border: none; color: #0055a5; cursor: pointer; padding: 4px; display: inline-flex; align-items: center;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </button>
                    <button class="btn-edit" onclick="window.RH.editEmpleado(${emp.id_ingreso})" title="Editar">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete" onclick="window.RH.deleteEmpleado(${emp.id_ingreso})" title="Eliminar">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            window.RH.DOM.tableBody.appendChild(tr);
        });
    };

    // ============================================
    // BÚSQUEDA DIRECTORIO
    // ============================================
    if (window.RH.DOM.searchInput) {
        window.RH.DOM.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = window.RH.empleadosData.filter(emp => 
                (emp.mug && emp.mug.toLowerCase().includes(term)) || 
                (emp.nombre && emp.nombre.toLowerCase().includes(term)) ||
                (emp.apellido_paterno && emp.apellido_paterno.toLowerCase().includes(term)) ||
                (emp.numero_nomina && emp.numero_nomina.toLowerCase().includes(term))
            );
            window.RH.renderTable(filtered);
        });
    }

    // ============================================
    // MODAL EMPLEADO INDIVIDUAL (Nuevo / Editar)
    // ============================================
    window.RH.openModal = function() {
        const mugEl = document.getElementById('mug');
        if (mugEl) mugEl.removeAttribute('required');
        const nomEl = document.getElementById('numero_nomina');
        if (nomEl) nomEl.removeAttribute('required');

        if(window.RH.DOM.modalEmpleado) {
            window.RH.DOM.modalEmpleado.classList.add('show');
            
            // Auto-restaurar borrador solo si es un "Nuevo Empleado" (id_ingreso está vacío)
            const idIngresoEl = document.getElementById('id_ingreso');
            if (idIngresoEl && !idIngresoEl.value && window.RH.DOM.formEmpleado) {
                const draft = sessionStorage.getItem('rh_empleado_draft');
                if (draft) {
                    try {
                        const data = JSON.parse(draft);
                        Object.keys(data).forEach(key => {
                            const el = window.RH.DOM.formEmpleado.elements[key];
                            if (el && el.type !== 'hidden' && el.name !== 'fecha_registro') {
                                el.value = data[key];
                            }
                        });
                        console.log("Borrador restaurado.");
                    } catch(e) {
                        console.error("Error al restaurar borrador:", e);
                    }
                }
            }
            if (typeof window.RH.highlightFilledInputs === 'function' && window.RH.DOM.formEmpleado) {
                window.RH.highlightFilledInputs(window.RH.DOM.formEmpleado);
            }
        }
    };
    
    window.RH.closeModal = function() {
        if(window.RH.DOM.modalEmpleado) window.RH.DOM.modalEmpleado.classList.remove('show');
        if(window.RH.DOM.formEmpleado) window.RH.DOM.formEmpleado.reset();
        const idIngresoEl = document.getElementById('id_ingreso');
        if (idIngresoEl) idIngresoEl.value = '';
        const fechaRegEl = document.getElementById('fecha_registro');
        if (fechaRegEl) fechaRegEl.value = '';
        if(window.RH.DOM.modalTitle) window.RH.DOM.modalTitle.textContent = "Nuevo Empleado";
        if (typeof window.RH.highlightFilledInputs === 'function' && window.RH.DOM.formEmpleado) {
            window.RH.highlightFilledInputs(window.RH.DOM.formEmpleado);
        }
    };

    window.RH.addToCarga = function(dateKey) {
        if (dateKey === 'Sin fecha') dateKey = '';
        if(window.RH.DOM.modalTitle) window.RH.DOM.modalTitle.textContent = dateKey ? "Nuevo Empleado (Carga: " + dateKey + ")" : "Nuevo Empleado";
        
        let frInput = document.getElementById('fecha_registro');
        if(!frInput) {
            frInput = document.createElement('input');
            frInput.type = 'hidden';
            frInput.id = 'fecha_registro';
            frInput.name = 'fecha_registro';
            if (window.RH.DOM.formEmpleado) window.RH.DOM.formEmpleado.appendChild(frInput);
        }
        
        const d = new Date();
        const timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0');
        frInput.value = dateKey ? (dateKey + ' ' + timeStr) : '';
        
        window.RH.openModal();
    };

    if (window.RH.DOM.btnNuevoEmpleado) window.RH.DOM.btnNuevoEmpleado.addEventListener('click', () => {
        window.RH.closeModal(); // Ensure reset before opening
        window.RH.openModal();
    });
    if (window.RH.DOM.btnCloseModal) window.RH.DOM.btnCloseModal.addEventListener('click', window.RH.closeModal);
    if (window.RH.DOM.btnCancelar) window.RH.DOM.btnCancelar.addEventListener('click', window.RH.closeModal);

    if (window.RH.DOM.formEmpleado) {
        // Autoguardado en sessionStorage cuando el usuario escribe (solo para nuevos ingresos)
        window.RH.DOM.formEmpleado.addEventListener('input', () => {
            const idIngresoEl = document.getElementById('id_ingreso');
            if (idIngresoEl && !idIngresoEl.value) {
                const formData = new FormData(window.RH.DOM.formEmpleado);
                const data = Object.fromEntries(formData.entries());
                sessionStorage.setItem('rh_empleado_draft', JSON.stringify(data));
            }
        });

        window.RH.DOM.formEmpleado.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(window.RH.DOM.formEmpleado);
            const data = Object.fromEntries(formData.entries());
            
            const isEdit = data.id_ingreso !== '';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const res = await fetch('../back/api/api_empleados.php', {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const json = await res.json();
                if (json.status === 'success') {
                    // Limpiar el borrador al guardar exitosamente
                    sessionStorage.removeItem('rh_empleado_draft');
                    
                    const savedId = isEdit ? data.id_ingreso : (json.inserted_ids && json.inserted_ids[0] ? json.inserted_ids[0] : null);
                    window.RH.closeModal();
                    await window.RH.loadEmpleados();

                    const savedEmp = (window.RH.empleadosData || []).find(e => e.id_ingreso == savedId);
                    
                    if (savedEmp && typeof window.showConfirm === 'function') {
                        const askOutlook = await window.showConfirm(
                            "Empleado guardado correctamente. ¿Deseas abrir el Centro de Envío de Formatos por Correo (Outlook)?",
                            "Éxito al Guardar",
                            "success",
                            "Sí, ver Formatos",
                            "No por ahora"
                        );
                        if (askOutlook && typeof window.RH.openFormatsModal === 'function') {
                            window.RH.openFormatsModal(savedEmp);
                        }
                    } else {
                        window.showAlert("Empleado guardado correctamente", "Éxito", "success");
                    }
                } else {
                    window.showAlert(json.message || "Error al guardar el empleado", "Error", "error");
                }
            } catch(e) {
                console.error(e);
                window.showAlert("Error de conexión al servidor", "Error de Red", "error");
            }
        });
    }

    // ============================================
    // FUNCIONES GLOBALES (Edit / Delete)
    // ============================================
    window.RH.editEmpleado = function(id) {
        const emp = window.RH.empleadosData.find(e => e.id_ingreso == id);
        if (!emp) return;
        
        window.RH.DOM.modalTitle.textContent = "Editar Empleado";
        const setVal = (elemId, val) => {
            const el = document.getElementById(elemId);
            if (el) el.value = val || '';
        };

        setVal('id_ingreso', emp.id_ingreso);
        setVal('numero_nomina', emp.numero_nomina);
        setVal('mug', emp.mug);
        setVal('nombre', emp.nombre);
        setVal('apellido_paterno', emp.apellido_paterno);
        setVal('apellido_materno', emp.apellido_materno);
        setVal('puesto', emp.puesto);
        setVal('jefe_directo', emp.jefe_directo);
        setVal('id_planta', emp.id_planta);
        setVal('id_area', emp.id_area);
        setVal('id_tipo', emp.id_tipo);
        
        // Campos extendidos EPP, Seguridad y Transporte
        setVal('imss', emp.imss);
        setVal('curp', emp.curp);
        setVal('domicilio', emp.domicilio);
        setVal('tipo_alta', emp.tipo_alta || 'Nuevo Ingreso');
        setVal('talla_zapato', emp.talla_zapato);
        setVal('talla_pantalon', emp.talla_pantalon);
        setVal('talla_playera', emp.talla_playera);
        setVal('camisola', emp.camisola);
        setVal('sobrelente', emp.sobrelente);
        setVal('tarjeta_solicitada', emp.tarjeta_solicitada);
        setVal('numero_tarjeta', emp.numero_tarjeta);
        setVal('ruta_acceso', emp.ruta_acceso);
        setVal('ruta_entrada', emp.ruta_entrada);
        setVal('parada_entrada', emp.parada_entrada);
        setVal('ruta_salida', emp.ruta_salida);
        setVal('parada_salida', emp.parada_salida);

        if(emp.fecha_ingreso) {
            setVal('fecha_ingreso', emp.fecha_ingreso.split(' ')[0]);
        }
        
        window.RH.openModal();
        if (typeof window.RH.highlightFilledInputs === 'function' && window.RH.DOM.formEmpleado) {
            window.RH.highlightFilledInputs(window.RH.DOM.formEmpleado);
        }
    };

    window.RH.deleteEmpleado = async function(id) {
        if (!id) {
            window.showAlert("No se especificó el ID del empleado a eliminar.", "Error", "error");
            return;
        }

        const ok = await window.showConfirm(
            "¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.",
            "Eliminar Empleado",
            "warning",
            "Sí, eliminar",
            "Cancelar"
        );
        if(!ok) return;

        try {
            const res = await fetch('../back/api/api_empleados.php?id=' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_ingreso: id })
            });
            const json = await res.json();
            if(json.status === 'success') {
                window.showAlert("El empleado ha sido eliminado correctamente.", "Eliminado", "success");
                window.RH.loadEmpleados();
            } else {
                window.showAlert(json.message || "Error al eliminar el empleado", "Error", "error");
            }
        } catch(e) {
            console.error(e);
            window.showAlert("Error de conexión al servidor", "Error de Red", "error");
        }
    };

    window.deleteEmpleado = window.RH.deleteEmpleado;
};