window.RH = window.RH || {};

window.RH.initAltas = function() {
    // ============================================
    // ALTAS - VIEW MODES
    // ============================================
    if (window.RH.DOM.viewModeBtns) {
        window.RH.DOM.viewModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.RH.DOM.viewModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.RH.altasViewMode = btn.dataset.mode;
                window.RH.switchAltasView(window.RH.altasViewMode);
                window.RH.refreshAltas();
            });
        });
    }

    window.RH.switchAltasView = function(mode) {
        if (!window.RH.DOM.altasCargasView || !window.RH.DOM.altasGeneralView) return;
        if (mode === 'cargas') {
            window.RH.DOM.altasCargasView.style.display = '';
            window.RH.DOM.altasGeneralView.style.display = 'none';
        } else {
            window.RH.DOM.altasCargasView.style.display = 'none';
            window.RH.DOM.altasGeneralView.style.display = '';
        }
    };

    window.RH.refreshAltas = function() {
        const term = window.RH.DOM.searchAltas ? window.RH.DOM.searchAltas.value.toLowerCase() : '';
        let data = window.RH.empleadosData;
        if (term) {
            data = data.filter(emp =>
                (emp.mug && emp.mug.toLowerCase().includes(term)) ||
                (emp.nombre && emp.nombre.toLowerCase().includes(term)) ||
                (emp.apellido_paterno && emp.apellido_paterno.toLowerCase().includes(term)) ||
                (emp.correo_asignado && emp.correo_asignado.toLowerCase().includes(term))
            );
        }
        window.RH.renderAltasCargas(data);
        window.RH.renderAltasGeneral(data);
    };

    // BÚSQUEDA ALTAS
    if (window.RH.DOM.searchAltas) {
        window.RH.DOM.searchAltas.addEventListener('input', () => {
            window.RH.refreshAltas();
        });
    }

    // ============================================
    // ALTAS - VISTA "POR CARGAS" (agrupado)
    // ============================================
    window.RH.getDateKey = function(dateStr) {
        if (!dateStr) return 'Sin fecha';
        const cleanDate = dateStr.trim().split(' ')[0].split('T')[0];
        if (!cleanDate || !cleanDate.includes('-')) return 'Sin fecha';
        return cleanDate;
    };

    window.RH.formatDateLabel = function(dateKey) {
        if (dateKey === 'Sin fecha') return 'Sin fecha de registro';
        const parts = dateKey.split('-');
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
        return dateKey;
    };

    window.RH.renderAltasCargas = function(data) {
        if (!window.RH.DOM.altasCargasView) return;
        window.RH.DOM.altasCargasView.innerHTML = '';

        const groups = {};
        data.forEach(emp => {
            const key = window.RH.getDateKey(emp.fecha_registro);
            if (!groups[key]) groups[key] = [];
            groups[key].push(emp);
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Sin fecha') return 1;
            if (b === 'Sin fecha') return -1;
            return b.localeCompare(a);
        });

        if (sortedKeys.length === 0) {
            window.RH.DOM.altasCargasView.innerHTML = `
                <div class="altas-empty">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <p>No hay registros de altas aún</p>
                </div>
            `;
            return;
        }

        sortedKeys.forEach((key, idx) => {
            const emps = groups[key];
            const block = document.createElement('div');
            block.className = 'carga-block collapsed';
            block.style.animationDelay = `${idx * 100}ms`;

            const incompleteCount = emps.filter(e => !e.mug || e.mug.trim() === '' || e.mug.trim() === '-').length;
            const completedITCount = emps.filter(e => e.estatus_it === 'completada').length;
            const isFullyCompleted = completedITCount === emps.length && emps.length > 0;
            const isPartial = completedITCount > 0 && !isFullyCompleted;

            let badgeStyle = "background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;";
            let badgeIcon = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
            let badgeText = `Pendiente IT (${completedITCount}/${emps.length})`;

            if (incompleteCount > 0) {
                badgeStyle = "background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;";
                badgeIcon = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
                badgeText = `Incompleto (Falta MUG en ${incompleteCount})`;
            } else if (isFullyCompleted) {
                badgeStyle = "background: #dcfce7; color: #166534; border: 1px solid #86efac;";
                badgeIcon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
                badgeText = `IT Completado (${completedITCount}/${emps.length})`;
            } else if (isPartial) {
                badgeStyle = "background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;";
                badgeIcon = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
                badgeText = `En Proceso IT (${completedITCount}/${emps.length})`;
            }

            const header = document.createElement('div');
            header.className = 'carga-block-header';
            header.innerHTML = `
                <div class="carga-block-title">
                    <h4>${window.RH.formatDateLabel(key)}</h4>
                    <span class="carga-badge">
                        ${emps.length} ${emps.length === 1 ? 'ingreso' : 'ingresos'}
                    </span>
                    <span class="badge-status-custom" style="${badgeStyle}">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">${badgeIcon}</svg>
                        ${badgeText}
                    </span>
                </div>
                <div class="carga-block-actions">
                    <button class="btn-add-ingreso-block" title="Agregar nuevo ingreso a esta carga" style="padding: 0.5rem;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>

                    <button class="btn-email-carga" title="Enviar o copiar formatos por correo para toda esta carga" style="padding: 0.5rem;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </button>

                    <button class="btn-export-carga" title="Exportar esta carga a Excel" style="padding: 0.5rem;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
                    </button>
                    <svg class="carga-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            `;

            const btnAddIngreso = header.querySelector('.btn-add-ingreso-block');
            if (btnAddIngreso) {
                btnAddIngreso.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(window.RH && window.RH.openModal) window.RH.openModal();
                });
            }

            const btnEmailCarga = header.querySelector('.btn-email-carga');
            if (btnEmailCarga) {
                btnEmailCarga.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.openBatchFormatsModal === 'function') {
                        window.openBatchFormatsModal(emps, window.RH.formatDateLabel(key));
                    }
                });
            }

            const btnExport = header.querySelector('.btn-export-carga');
            btnExport.addEventListener('click', (e) => {
                e.stopPropagation();
                if(window.RH.exportToExcel) window.RH.exportToExcel(emps, `Reporte_Carga_${key}`);
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
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Nómina</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Nombre Completo</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Puesto / Área</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Estatus Datos / IT</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Correo Asignado (IT)</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Contraseña (IT)</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem;">Fecha Ingreso</th>
                                <th style="padding: 0.6rem 1rem; font-size:0.8rem; text-align:center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            emps.forEach(emp => {
                const isMugMissing = !emp.mug || emp.mug.trim() === '' || emp.mug.trim() === '-';
                let statusBadgeHTML = '';
                if (isMugMissing) {
                    statusBadgeHTML = `<span class="badge-status-custom" style="background:#fff7ed; color:#c2410c; border:1px solid #ffedd5; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;" title="Falta asignar MUG por RH"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Faltan datos (Sin MUG)</span>`;
                } else if (emp.estatus_it === 'completada') {
                    statusBadgeHTML = `<span class="badge-status completada">Completado IT</span>`;
                } else {
                    statusBadgeHTML = `<span class="badge-status pendiente">Pendiente IT</span>`;
                }

                const mugHTML = emp.mug ? `<span class="copyable-mug" data-mug="${emp.mug}" title="Clic para copiar MUG">
                    <span>${emp.mug}</span>
                    <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </span>` : '<span style="color:#c2410c; font-weight:600; font-size:0.8rem;">Sin MUG</span>';

                tableHTML += `
                    <tr>
                        <td style="padding: 0.6rem 1rem;">${mugHTML}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.numero_nomina || '-'}</td>
                        <td style="padding: 0.6rem 1rem;"><strong>${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno || ''}</strong></td>
                        <td style="padding: 0.6rem 1rem;">${emp.puesto}<br><span style="font-size:0.75rem; color:#2563eb;">${emp.nombre_area || ''}</span></td>
                        <td style="padding: 0.6rem 1rem;">
                            ${statusBadgeHTML}
                        </td>
                        <td style="padding: 0.6rem 1rem;">
                            <strong style="color: #059669; font-family: monospace; font-size: 0.85rem;">
                                ${emp.correo_asignado || '<span style="color:var(--text-muted); font-weight:normal;">En espera de IT</span>'}
                            </strong>
                        </td>
                        <td style="padding: 0.6rem 1rem;">
                            <span style="font-family: monospace; font-size: 0.85rem; color: var(--text-main);">
                                ${emp.password_asignado || 'QueretaroMex2026*'}
                            </span>
                        </td>
                        <td style="padding: 0.6rem 1rem;">${emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : ''}</td>
                        <td style="padding: 0.6rem 1rem; text-align:center;">
                            <button class="btn-edit btn-edit-emp-alta" data-id="${emp.id_ingreso}" title="Editar o completar datos de esta alta" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span>Editar</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tableHTML += '</tbody></table></div>';
            body.innerHTML = tableHTML;

            body.querySelectorAll('.btn-edit-emp-alta').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const empId = btn.dataset.id;
                    if (empId && window.RH && typeof window.RH.editEmpleado === 'function') {
                        window.RH.editEmpleado(empId);
                    }
                });
            });

            block.appendChild(header);
            block.appendChild(body);
            window.RH.DOM.altasCargasView.appendChild(block);
        });
    };

    // ============================================
    // ALTAS - VISTA "GENERAL" (tabla plana)
    // ============================================
    window.RH.renderAltasGeneral = function(data) {
        if (!window.RH.DOM.altasTbody) return;
        window.RH.DOM.altasTbody.innerHTML = '';
        const sorted = [...data].sort((a, b) => {
            const da = new Date(a.fecha_registro || 0);
            const db = new Date(b.fecha_registro || 0);
            return db - da;
        });
        sorted.forEach(emp => {
            const isMugMissing = !emp.mug || emp.mug.trim() === '' || emp.mug.trim() === '-';
            let statusBadgeHTML = '';
            if (isMugMissing) {
                statusBadgeHTML = `<span class="badge-status-custom" style="background:#fff7ed; color:#c2410c; border:1px solid #ffedd5; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Faltan datos (Sin MUG)</span>`;
            } else if (emp.estatus_it === 'completada') {
                statusBadgeHTML = `<span class="badge-status completada">Completado IT</span>`;
            } else {
                statusBadgeHTML = `<span class="badge-status pendiente">Pendiente IT</span>`;
            }

            const mugHTML = emp.mug ? `<span class="copyable-mug" data-mug="${emp.mug}" title="Clic para copiar MUG">
                <span>${emp.mug}</span>
                <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </span>` : '<span style="color:#c2410c; font-weight:600; font-size:0.8rem;">Sin MUG</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mugHTML}</td>
                <td>${emp.numero_nomina || '-'}</td>
                <td>${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno || ''}</td>
                <td>${emp.puesto}</td>
                <td><span style="color:#2563eb; font-weight:600;">${emp.nombre_area || ''}</span></td>
                <td>${emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : ''}</td>
                <td>${statusBadgeHTML}</td>
                <td><strong style="color: #059669; font-family: monospace;">${emp.correo_asignado || 'En espera'}</strong></td>
                <td><span style="font-family: monospace;">${emp.password_asignado || 'QueretaroMex2026*'}</span></td>
                <td style="text-align:center;">
                    <button class="btn-edit btn-edit-emp-alta-gen" data-id="${emp.id_ingreso}" title="Editar o completar datos" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Editar</span>
                    </button>
                </td>
            `;

            tr.querySelector('.btn-edit-emp-alta-gen').addEventListener('click', () => {
                if (window.RH && typeof window.RH.editEmpleado === 'function') {
                    window.RH.editEmpleado(emp.id_ingreso);
                }
            });

            window.RH.DOM.altasTbody.appendChild(tr);
        });
    };

    // ============================================
    // EXPORTAR A EXCEL GLOBAL (con todos los datos)
    // ============================================
    window.RH.exportToExcel = function(dataArray, filename = 'Reporte_Global_Altas_Safran') {
        if(!dataArray || dataArray.length === 0) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("No hay datos para exportar en este momento.", "Sin Datos", "warning");
            } else {
                alert("No hay datos para exportar.");
            }
            return;
        }

        const columns = [
            { header: 'MUG', field: 'mug' },
            { header: 'No. Nómina', field: 'numero_nomina' },
            { header: 'Nombre Completo', field: 'nombreCompleto' },
            { header: 'Puesto', field: 'puesto' },
            { header: 'Jefe Directo / Líder', field: 'jefe_directo' },
            { header: 'Área', field: 'nombre_area' },
            { header: 'Planta', field: 'nombre_planta' },
            { header: 'Tipo Ingreso', field: 'tipo_ingreso_desc' },
            { header: 'Fecha Ingreso', field: 'fecha_ingreso' },
            { header: 'Fecha Registro', field: 'fecha_registro' },
            // Datos Seguridad Patrimonial & Transporte
            { header: 'IMSS (NSS)', field: 'imss' },
            { header: 'CURP', field: 'curp' },
            { header: 'Domicilio Completo', field: 'domicilio' },
            { header: 'Tipo de Alta', field: 'tipo_alta' },
            { header: 'Tarjeta Solicitada', field: 'tarjeta_solicitada' },
            { header: 'No. Tarjeta', field: 'numero_tarjeta' },
            { header: 'Ruta Acceso', field: 'ruta_acceso' },
            { header: 'Ruta Entrada', field: 'ruta_entrada' },
            { header: 'Parada Entrada', field: 'parada_entrada' },
            { header: 'Ruta Salida', field: 'ruta_salida' },
            { header: 'Parada Salida', field: 'parada_salida' },
            // Tallas EPP (HSE / Almacén)
            { header: 'Talla Zapato', field: 'talla_zapato' },
            { header: 'Talla Pantalón', field: 'talla_pantalon' },
            { header: 'Talla Playera', field: 'talla_playera' },
            { header: 'Camisola', field: 'camisola' },
            { header: 'Sobrelente de Seguridad', field: 'sobrelente' },
            // Credenciales e IT
            { header: 'Estatus IT', field: 'estatus_it' },
            { header: 'Correo Asignado (IT)', field: 'correo_asignado' },
            { header: 'Contraseña (IT)', field: 'password_asignado' }
        ];

        const mappedData = dataArray.map(emp => ({
            mug: emp.mug || '-',
            numero_nomina: emp.numero_nomina || '-',
            nombreCompleto: `${emp.nombre || ''} ${emp.apellido_paterno || ''} ${emp.apellido_materno || ''}`.trim(),
            puesto: emp.puesto || '-',
            jefe_directo: emp.jefe_directo || '-',
            nombre_area: emp.nombre_area || emp.area || 'Sin área',
            nombre_planta: emp.nombre_planta || emp.planta || 'Sin planta',
            tipo_ingreso_desc: emp.tipo_ingreso_desc || emp.tipo_ingreso || 'Nuevo',
            fecha_ingreso: emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : '-',
            fecha_registro: emp.fecha_registro ? emp.fecha_registro.split(' ')[0] : '-',
            imss: emp.imss || '-',
            curp: emp.curp || '-',
            domicilio: emp.domicilio || '-',
            tipo_alta: emp.tipo_alta || 'Nuevo Ingreso',
            tarjeta_solicitada: emp.tarjeta_solicitada || '-',
            numero_tarjeta: emp.numero_tarjeta || '-',
            ruta_acceso: emp.ruta_acceso || '-',
            ruta_entrada: emp.ruta_entrada || '-',
            parada_entrada: emp.parada_entrada || '-',
            ruta_salida: emp.ruta_salida || '-',
            parada_salida: emp.parada_salida || '-',
            talla_zapato: emp.talla_zapato || '-',
            talla_pantalon: emp.talla_pantalon || '-',
            talla_playera: emp.talla_playera || '-',
            camisola: emp.camisola || '-',
            sobrelente: emp.sobrelente || '-',
            estatus_it: emp.estatus_it === 'completada' ? 'Completado por IT' : 'Pendiente IT',
            correo_asignado: emp.correo_asignado || 'Sin asignar',
            password_asignado: emp.password_asignado || '-'
        }));

        if (typeof window.exportStyledExcel === 'function') {
            window.exportStyledExcel({
                title: 'Reporte Global Completo de Altas e Ingresos Safran Group',
                filename: filename || 'Reporte_Global_Altas_Safran',
                columns: columns,
                data: mappedData
            });
        }
    };

    window.RH.exportGlobalExcel = function() {
        window.RH.exportToExcel(window.RH.empleadosData || [], 'Reporte_Global_Completo_Safran');
    };
};