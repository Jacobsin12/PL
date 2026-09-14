window.RH = window.RH || {};

window.RH.initMultiple = function() {
    // ============================================
    // INGRESO MÚLTIPLE - FLUJO INLINE
    // ============================================

    window.RH.openNumModal = function() {
        if(window.RH.DOM.modalNumFilas) window.RH.DOM.modalNumFilas.classList.add('show');
        if(window.RH.DOM.inputNumFilas) window.RH.DOM.inputNumFilas.focus();
    };

    window.RH.closeNumModal = function() {
        if(window.RH.DOM.modalNumFilas) window.RH.DOM.modalNumFilas.classList.remove('show');
    };

    if (window.RH.DOM.btnNuevoMultiple) window.RH.DOM.btnNuevoMultiple.addEventListener('click', window.RH.openNumModal);
    if (window.RH.DOM.btnCloseNum) window.RH.DOM.btnCloseNum.addEventListener('click', window.RH.closeNumModal);
    if (window.RH.DOM.btnCancelarNum) window.RH.DOM.btnCancelarNum.addEventListener('click', window.RH.closeNumModal);

    if (window.RH.DOM.btnConfirmarNum) {
        window.RH.DOM.btnConfirmarNum.addEventListener('click', () => {
            let num = parseInt(window.RH.DOM.inputNumFilas.value) || 1;
            num = Math.min(50, Math.max(1, num));
            window.RH.closeNumModal();
            window.RH.showInlineBulk(num);
        });
    }

    if (window.RH.DOM.inputNumFilas) {
        window.RH.DOM.inputNumFilas.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                let num = parseInt(window.RH.DOM.inputNumFilas.value) || 1;
                num = Math.min(50, Math.max(1, num));
                window.RH.closeNumModal();
                window.RH.showInlineBulk(num);
            }
        });
    }

    window.RH.buildOptions = function(dataArray, valProp, textProp) {
        let html = '<option value="">Seleccionar...</option>';
        if (dataArray) {
            dataArray.forEach(item => {
                html += `<option value="${item[valProp]}">${item[textProp]}</option>`;
            });
        }
        return html;
    };
    window.RH.showInlineBulk = function(numRows) {
        if (typeof window.RH.updateDOM === 'function') window.RH.updateDOM();

        const container = window.RH.DOM.inlineBulkContainer || document.getElementById('inline-bulk-container');
        const tbody = window.RH.DOM.bulkTbody || document.getElementById('bulk-tbody');

        if (!container || !tbody) return;

        // Ensure navigation active
        const targetNav = document.querySelector('.nav-item[data-target="view-rh-directorio"]');
        if (targetNav && !targetNav.classList.contains('active')) {
            targetNav.click();
        }

        container.style.display = 'block';
        container.style.animation = 'none';
        container.offsetHeight; // reflow
        container.style.animation = '';

        tbody.innerHTML = '';
        
        const optsPlanta = window.RH.buildOptions(window.RH.catalogosData.plantas, 'id_planta', 'nombre_completo');
        const optsArea = window.RH.buildOptions(window.RH.catalogosData.areas, 'id_area', 'nombre_area');
        const optsTipo = window.RH.buildOptions(window.RH.catalogosData.tipos, 'id_tipo', 'descripcion');

        for (let i = 0; i < numRows; i++) {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${i * 60}ms`;
            tr.innerHTML = `
                <td class="row-number">${i + 1}</td>
                <td><input type="text" name="mug[]" required placeholder="MUG"></td>
                <td><input type="text" name="numero_nomina[]" required placeholder="Nómina"></td>
                <td><input type="text" name="nombre[]" required placeholder="Nombre"></td>
                <td><input type="text" name="apellido_paterno[]" required placeholder="Ap. Paterno"></td>
                <td><input type="text" name="apellido_materno[]" required placeholder="Ap. Materno"></td>
                <td><input type="text" name="puesto[]" required placeholder="Puesto"></td>
                <td><input type="text" name="jefe_directo[]" placeholder="Jefe"></td>
                <td><select name="id_planta[]" required>${optsPlanta}</select></td>
                <td><select name="id_area[]" required>${optsArea}</select></td>
                <td><select name="id_tipo[]" required>${optsTipo}</select></td>
                <td><input type="date" name="fecha_ingreso[]" required></td>
                <td><input type="text" name="imss[]" placeholder="IMSS / NSS"></td>
                <td><input type="text" name="curp[]" placeholder="CURP"></td>
                <td><input type="text" name="domicilio[]" placeholder="Domicilio"></td>
                <td>
                    <select name="tipo_alta[]">
                        <option value="Nuevo">Nuevo</option>
                        <option value="Reingreso">Reingreso</option>
                    </select>
                </td>
                <td><input type="text" name="tarjeta_solicitada[]" placeholder="Tarjeta Solic."></td>
                <td><input type="text" name="numero_tarjeta[]" placeholder="No. Tarjeta"></td>
                <td><input type="text" name="ruta_acceso[]" placeholder="Ruta Acceso"></td>
                <td><input type="text" name="ruta_entrada[]" placeholder="Ruta Entrada"></td>
                <td><input type="text" name="parada_entrada[]" placeholder="Parada Entrada"></td>
                <td><input type="text" name="ruta_salida[]" placeholder="Ruta Salida"></td>
                <td><input type="text" name="parada_salida[]" placeholder="Parada Salida"></td>
                <td><input type="text" name="talla_zapato[]" placeholder="Talla Zapato"></td>
                <td><input type="text" name="talla_pantalon[]" placeholder="Talla Pantalón"></td>
                <td><input type="text" name="talla_playera[]" placeholder="Talla Playera"></td>
                <td><input type="text" name="camisola[]" placeholder="Camisola"></td>
                <td><input type="text" name="sobrelente[]" placeholder="Sobrelente"></td>
            `;
            tbody.appendChild(tr);
            if (typeof window.RH.attachInputValidations === 'function') {
                window.RH.attachInputValidations(tr);
            }
        }

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (window.RH.DOM.btnCancelarInline) {
        window.RH.DOM.btnCancelarInline.addEventListener('click', () => {
            window.RH.DOM.inlineBulkContainer.style.display = 'none';
            if(window.RH.DOM.formBulk) window.RH.DOM.formBulk.reset();
        });
    }

    if (window.RH.DOM.formBulk) {
        window.RH.DOM.formBulk.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(window.RH.DOM.formBulk);
            
            try {
                window.RH.DOM.btnGuardarInline.disabled = true;
                window.RH.DOM.btnGuardarInline.innerHTML = '<span class="loader" style="width:16px;height:16px;margin-right:5px;border-width:2px;display:inline-block;"></span> Guardando...';

                const res = await fetch('../back/api/api_empleados.php', {
                    method: 'POST',
                    body: formData 
                });
                const json = await res.json();
                
                if (json.status === 'success') {
                    window.RH.DOM.inlineBulkContainer.style.display = 'none';
                    window.RH.DOM.formBulk.reset();
                    await window.RH.loadEmpleados();

                    if (window.Swal) {
                        const result = await Swal.fire({
                            title: '¡Carga Múltiple Completada!',
                            text: 'Se han guardado los registros con éxito. ¿Deseas abrir el generador de formatos por área?',
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonText: '📧 Abrir Formatos',
                            cancelButtonText: 'Cerrar',
                            confirmButtonColor: '#0078d4'
                        });

                        if (result.isConfirmed) {
                            const lastCreated = window.RH.empleadosData && window.RH.empleadosData.length > 0 
                                ? window.RH.empleadosData[0] 
                                : null;
                            if (lastCreated && typeof window.openFormatsModal === 'function') {
                                window.openFormatsModal(lastCreated);
                            }
                        }
                    } else {
                        window.showAlert("Carga múltiple completada con éxito.", "¡Éxito!", "success");
                    }
                } else {
                    window.showAlert(json.message || "Error al procesar la carga múltiple", "Error", "error");
                }
            } catch(error) {
                console.error(error);
                window.showAlert("Error de red durante la carga masiva", "Error de Red", "error");
            } finally {
                window.RH.DOM.btnGuardarInline.disabled = false;
                window.RH.DOM.btnGuardarInline.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar Registros';
            }
        });
    }

    // ============================================
    // ILUMINACIÓN DE FILA ACTIVA AL EDITAR
    // ============================================
    document.addEventListener('focusin', function(e) {
        const tr = e.target.closest('tr');
        if (tr && (tr.closest('#bulk-tbody') || tr.closest('#table-multiple') || tr.closest('.excel-grid') || tr.closest('.table-multiple-input'))) {
            const tbody = tr.parentElement;
            if (tbody) {
                tbody.querySelectorAll('tr.row-active').forEach(r => r.classList.remove('row-active'));
            }
            tr.classList.add('row-active');
        }
    });

    document.addEventListener('focusout', function(e) {
        const tr = e.target.closest('tr');
        if (tr) {
            setTimeout(() => {
                if (!tr.contains(document.activeElement)) {
                    tr.classList.remove('row-active');
                }
            }, 50);
        }
    });

    // ============================================
    // NAVEGACIÓN ESTILO EXCEL (TECLAS DE DIRECCIÓN Y ENTER)
    // ============================================
    document.addEventListener('keydown', function(e) {
        const activeEl = document.activeElement;
        if (!activeEl || !['INPUT', 'SELECT', 'TEXTAREA'].includes(activeEl.tagName)) return;

        const tr = activeEl.closest('tr');
        if (!tr) return;

        const tbody = tr.parentElement;
        if (!tbody || (!tbody.closest('#bulk-tbody') && !tbody.closest('#table-multiple') && !tbody.closest('.excel-grid') && !tbody.closest('.table-multiple-input'))) return;

        const rowInputs = Array.from(tr.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        const colIndex = rowInputs.indexOf(activeEl);
        if (colIndex === -1) return;

        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const rowIndex = allRows.indexOf(tr);

        let targetInput = null;

        if (e.key === 'ArrowRight') {
            const isTextType = activeEl.tagName === 'INPUT' && ['text', 'search', 'url', 'tel', 'password'].includes(activeEl.type);
            const atEnd = isTextType ? (activeEl.selectionStart === activeEl.value.length && activeEl.selectionEnd === activeEl.value.length) : true;
            
            if (atEnd || e.ctrlKey || e.altKey) {
                if (colIndex < rowInputs.length - 1) {
                    targetInput = rowInputs[colIndex + 1];
                } else if (rowIndex < allRows.length - 1) {
                    const nextRowInputs = Array.from(allRows[rowIndex + 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                    targetInput = nextRowInputs[0];
                }
            }
        } else if (e.key === 'ArrowLeft') {
            const isTextType = activeEl.tagName === 'INPUT' && ['text', 'search', 'url', 'tel', 'password'].includes(activeEl.type);
            const atStart = isTextType ? (activeEl.selectionStart === 0 && activeEl.selectionEnd === 0) : true;

            if (atStart || e.ctrlKey || e.altKey) {
                if (colIndex > 0) {
                    targetInput = rowInputs[colIndex - 1];
                } else if (rowIndex > 0) {
                    const prevRowInputs = Array.from(allRows[rowIndex - 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                    targetInput = prevRowInputs[prevRowInputs.length - 1];
                }
            }
        } else if (e.key === 'ArrowDown') {
            if (activeEl.tagName === 'SELECT' && !e.altKey && !e.ctrlKey) {
                // Permitir elegir opciones en desplegables sin saltar de fila salvo con Alt/Ctrl o Enter
                return;
            }
            e.preventDefault();
            if (rowIndex < allRows.length - 1) {
                const nextRowInputs = Array.from(allRows[rowIndex + 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                targetInput = nextRowInputs[Math.min(colIndex, nextRowInputs.length - 1)];
            }
        } else if (e.key === 'ArrowUp') {
            if (activeEl.tagName === 'SELECT' && !e.altKey && !e.ctrlKey) {
                return;
            }
            e.preventDefault();
            if (rowIndex > 0) {
                const prevRowInputs = Array.from(allRows[rowIndex - 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                targetInput = prevRowInputs[Math.min(colIndex, prevRowInputs.length - 1)];
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                if (rowIndex > 0) {
                    const prevRowInputs = Array.from(allRows[rowIndex - 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                    targetInput = prevRowInputs[Math.min(colIndex, prevRowInputs.length - 1)];
                }
            } else {
                if (colIndex < rowInputs.length - 1) {
                    targetInput = rowInputs[colIndex + 1];
                } else if (rowIndex < allRows.length - 1) {
                    const nextRowInputs = Array.from(allRows[rowIndex + 1].querySelectorAll('input:not([type="hidden"]), select, textarea'));
                    targetInput = nextRowInputs[0];
                }
            }
        }

        if (targetInput) {
            targetInput.focus();
            if (typeof targetInput.select === 'function' && targetInput.tagName === 'INPUT' && targetInput.type !== 'date') {
                setTimeout(() => targetInput.select(), 10);
            }
        }
    });
};