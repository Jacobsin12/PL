function initUI() {
    // Theme Logic
    const themeSwitch = document.getElementById('theme-switch');
    const themeIcon = document.getElementById('theme-icon');

    const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    const sunIcon = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if(themeIcon) themeIcon.innerHTML = sunIcon;
        if(themeSwitch) themeSwitch.checked = true;
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if(themeIcon) themeIcon.innerHTML = isDark ? sunIcon : moonIcon;
            
            // Si hay gráficas, actualizarlas para que tomen el nuevo color de texto
            if (typeof window.updateDashboard === 'function') window.updateDashboard();
            if (typeof window.renderReport === 'function') window.renderReport();
        });
    }

    // Sidebar Toggle Logic
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (localStorage.getItem('sidebar') === 'collapsed' && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
        });
    }

    const navItems = document.querySelectorAll(".nav-item");
    const viewSections = document.querySelectorAll(".view-section");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            if(item.hasAttribute('data-target')) {
                e.preventDefault();
                
                navItems.forEach(nav => nav.classList.remove("active"));
                viewSections.forEach(view => view.classList.remove("active"));
                
                item.classList.add("active");
                const targetId = item.getAttribute("data-target");
                const targetEl = document.getElementById(targetId);
                if(targetEl) targetEl.classList.add("active");

                if (targetId === "view-reports" && typeof window.renderReport === 'function') {
                    window.renderReport();
                } else if (targetId === "view-it-pendientes" && typeof window.loadITPendientes === 'function') {
                    window.loadITPendientes();
                } else if (targetId === "view-it-completadas" && typeof window.loadITCompletadas === 'function') {
                    window.loadITCompletadas();
                } else if (targetId === "view-notificaciones" && typeof window.loadFullNotifications === 'function') {
                    window.loadFullNotifications();
                } else if ((targetId === "view-rh-directorio" || targetId === "view-rh-altas") && typeof window.RH?.loadEmpleados === 'function') {
                    window.RH.loadEmpleados();
                }
            }
        });
    });

    // Hash navigation support (e.g. index.html#view-rh-altas)
    function checkHashNavigation() {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const targetNav = document.querySelector(`.nav-item[data-target="${hash}"]`);
            if (targetNav && targetNav.style.display !== 'none') {
                targetNav.click();
            }
        }
    }

    setTimeout(checkHashNavigation, 250);
    window.addEventListener('hashchange', checkHashNavigation);
    
    // Inicializar Steppers con animación Zoom In / Out
    initSteppers();

    // Inicializar manejadores de cierre de modales (Escape y Clic Exterior)
    initModalDismissHandlers();
}

function initModalDismissHandlers() {
    function closeModalOverlay(modalEl) {
        if (!modalEl) return;
        // Ejecutar botón de cerrar si existe para activar handlers específicos de limpieza
        const closeBtn = modalEl.querySelector('.btn-close-modal, .btn-close, #btn-close-modal, #btn-close-num, #btn-close-multiple, #btn-close-config-it, #btn-close-masivo-it, .btn-cancelar, [data-dismiss="modal"]');
        if (closeBtn && typeof closeBtn.click === 'function') {
            closeBtn.click();
        }
        // Asegurar que el modal se oculte
        modalEl.classList.remove('show');
    }

    // 1. Cerrar al hacer clic fuera del contenedor (en el backdrop .modal-overlay)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
            closeModalOverlay(e.target);
        }
    });

    // 2. Cerrar al presionar la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const activeModals = document.querySelectorAll('.modal-overlay.show, .modal.show');
            activeModals.forEach(modal => {
                closeModalOverlay(modal);
            });
        }
    });
}

function initSteppers() {
    const stepperContainers = document.querySelectorAll('.custom-stepper-container');
    stepperContainers.forEach(container => {
        const input = container.querySelector('.input-num-filas, input[type="number"]');
        const btnMinus = container.querySelector('.stepper-btn-minus');
        const btnPlus = container.querySelector('.stepper-btn-plus');

        if (!input) return;

        let prevVal = parseInt(input.value) || 1;

        const triggerZoomAnimation = (newVal, oldVal) => {
            input.classList.remove('animate-zoom-up', 'animate-zoom-down');
            void input.offsetWidth; // Reflow

            if (newVal > oldVal) {
                input.classList.add('animate-zoom-up');
            } else if (newVal < oldVal) {
                input.classList.add('animate-zoom-down');
            }
        };

        const updateValue = (delta) => {
            const current = parseInt(input.value) || 1;
            const min = parseInt(input.min) || 1;
            const max = parseInt(input.max) || 50;
            const target = Math.min(max, Math.max(min, current + delta));

            if (target !== current) {
                triggerZoomAnimation(target, current);
                input.value = target;
                prevVal = target;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        if (btnMinus) {
            btnMinus.addEventListener('click', (e) => {
                e.preventDefault();
                updateValue(-1);
            });
        }

        if (btnPlus) {
            btnPlus.addEventListener('click', (e) => {
                e.preventDefault();
                updateValue(1);
            });
        }

        input.addEventListener('input', () => {
            const min = parseInt(input.min) || 1;
            const max = parseInt(input.max) || 50;
            let current = parseInt(input.value) || 0;

            if (current > max) {
                current = max;
                input.value = max;
            }

            if (current !== prevVal) {
                triggerZoomAnimation(current, prevVal);
                prevVal = current;
            }
        });

        input.addEventListener('blur', () => {
            const min = parseInt(input.min) || 1;
            const max = parseInt(input.max) || 50;
            let current = parseInt(input.value) || min;
            if (current < min) input.value = min;
            if (current > max) input.value = max;
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) updateValue(1);
            else if (e.deltaY > 0) updateValue(-1);
        }, { passive: false });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}

// ============================================
// MODALES Y ALERTAS ELEGANTES (SweetAlert2)
// ============================================
window.copyToClipboard = function(text, label = 'MUG') {
    if (!text || text === '-' || text === 'Sin fecha') return;
    
    const cleanText = String(text).trim();
    if (!cleanText) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanText).then(() => {
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `${label} "${cleanText}" copiado`,
                    showConfirmButton: false,
                    timer: 1600,
                    timerProgressBar: true
                });
            }
        }).catch(() => {
            fallbackCopy(cleanText, label);
        });
    } else {
        fallbackCopy(cleanText, label);
    }
};

function fallbackCopy(text, label) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand('copy');
        if (window.Swal) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `${label} "${text}" copiado`,
                showConfirmButton: false,
                timer: 1600
            });
        }
    } catch(e) {}
    document.body.removeChild(input);
}

document.addEventListener('click', (e) => {
    const mugTarget = e.target.closest('.copyable-mug, [data-copy-mug]');
    if (mugTarget) {
        e.stopPropagation();
        const mugVal = mugTarget.getAttribute('data-mug') || 
                       mugTarget.getAttribute('data-copy-mug') || 
                       mugTarget.innerText.replace(/\s+/g, ' ').trim();
        
        const cleanMug = mugVal.split(' ')[0];
        if (cleanMug) {
            window.copyToClipboard(cleanMug, 'MUG');
        }
    }
});

window.showAlert = function(message, title = 'Notificación', icon = 'info') {
    if (window.Swal) {
        return Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'safran-swal-popup',
                title: 'safran-swal-title',
                htmlContainer: 'safran-swal-html',
                confirmButton: 'safran-swal-confirm-btn'
            },
            buttonsStyling: false
        });
    } else {
        alert(message);
    }
};

window.showConfirm = async function(message, title = '¿Estás seguro?', icon = 'warning', confirmText = 'Sí, confirmar', cancelText = 'Cancelar') {
    if (window.Swal) {
        const isDanger = (title + ' ' + message).toLowerCase().includes('eliminar');
        const result = await Swal.fire({
            title: title,
            text: message,
            icon: icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            customClass: {
                popup: 'safran-swal-popup',
                title: 'safran-swal-title',
                htmlContainer: 'safran-swal-html',
                confirmButton: `safran-swal-confirm-btn ${isDanger ? 'danger-btn' : ''}`,
                cancelButton: 'safran-swal-cancel-btn'
            },
            buttonsStyling: false,
            focusCancel: true
        });
        return result.isConfirmed;
    } else {
        return confirm(message);
    }
};

// Sobrescribir alert nativo de browser por alerta animada elegante
window.alert = function(msg) {
    if (window.Swal) {
        window.showAlert(msg, 'Atención', 'info');
    } else {
        console.warn("Alert:", msg);
    }
};

window.exportStyledExcel = async function({ title, filename, columns, data }) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const cleanFilename = (filename || 'Reporte_Safran').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. Exportación Nativa .xlsx con ExcelJS (Estilos completos, sin advertencias)
    if (window.ExcelJS) {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Safran Group Service Desk';
            workbook.created = now;

            const worksheet = workbook.addWorksheet('Reporte Safran', {
                views: [{ showGridLines: true }]
            });

            const numCols = Math.max(columns.length, 1);
            const getColLetter = (n) => {
                let s = '';
                while (n > 0) {
                    let m = (n - 1) % 26;
                    s = String.fromCharCode(65 + m) + s;
                    n = Math.floor((n - m) / 26);
                }
                return s;
            };
            const lastColLetter = getColLetter(numCols);

            // FILA 1: Encabezado Safran Navy Banner
            worksheet.mergeCells(`A1:${lastColLetter}1`);
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'SAFRAN GROUP • SERVICE DESK';
            titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF002060' } // Azul Safran
            };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(1).height = 32;

            // FILA 2: Subtítulo
            worksheet.mergeCells(`A2:${lastColLetter}2`);
            const subTitleCell = worksheet.getCell('A2');
            subTitleCell.value = `${title || 'Reporte de Ingresos y Control de Credenciales'} | Generado: ${dateStr}`;
            subTitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FFE2E8F0' } };
            subTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' } // Gris Oscuro / Slate
            };
            subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(2).height = 22;

            // FILA 3: Espaciador
            worksheet.getRow(3).height = 10;

            // FILA 4: Encabezados de Tabla
            const headerRow = worksheet.getRow(4);
            headerRow.height = 26;

            columns.forEach((col, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = col.header;
                cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF0284C7' } // Azul Vibrante Header #0284C7
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF0284C7' } },
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    bottom: { style: 'medium', color: { argb: 'FF0369A1' } },
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                };
            });

            // FILAS 5+: Datos con Zebra Striping y Badges
            (data || []).forEach((row, rowIdx) => {
                const rowIndex = 5 + rowIdx;
                const dataRow = worksheet.getRow(rowIndex);
                dataRow.height = 22;
                const isEven = rowIdx % 2 === 0;
                const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

                columns.forEach((col, colIdx) => {
                    const cell = dataRow.getCell(colIdx + 1);
                    let val = row[col.field];

                    if (col.field === 'estatus_it' || col.field === 'estatus' || col.field === 'Estatus IT') {
                        const isComp = String(val || '').toLowerCase().includes('completad');
                        val = isComp ? 'Completado por IT' : 'Pendiente IT';
                    } else if (col.field === 'correo_asignado' || col.field === 'correo' || col.field === 'Correo Asignado IT') {
                        if (!val || val === '-') val = 'Sin asignar';
                    }
                    if (val === undefined || val === null) val = '-';

                    cell.value = val;
                    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
                    
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: rowBgColor }
                    };

                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };

                    const valStr = String(val);
                    const colNameLower = (col.header || '').toLowerCase();

                    if (valStr.includes('FALTAN DATOS POR REGISTRAR')) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFEE2E2' }
                        };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FCAF5555' } },
                            left: { style: 'thin', color: { argb: 'FCAF5555' } },
                            bottom: { style: 'thin', color: { argb: 'FCAF5555' } },
                            right: { style: 'thin', color: { argb: 'FCAF5555' } }
                        };
                    } else if (colNameLower.includes('estatus')) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        const isComp = valStr.includes('Completado');
                        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: isComp ? 'FF15803D' : 'FFB45309' } };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: isComp ? 'FFDCFCE7' : 'FFFEF3C7' }
                        };
                    } else if (colNameLower.includes('fecha') || colNameLower.includes('folio') || colNameLower.includes('nómina') || colNameLower.includes('mug') || col.field === 'id') {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    } else {
                        cell.alignment = { horizontal: 'left', vertical: 'middle' };
                    }
                });
            });

            // Autoajustar ancho de columnas
            columns.forEach((col, colIdx) => {
                let maxLen = (col.header || '').length;
                (data || []).forEach(row => {
                    let val = String(row[col.field] || '');
                    if (val.length > maxLen) maxLen = val.length;
                });
                worksheet.getColumn(colIdx + 1).width = Math.max(maxLen + 5, 14);
            });

            // Descargar buffer nativo .xlsx
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cleanFilename}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        } catch (err) {
            console.error("Error al exportar Excel con ExcelJS:", err);
        }
    }

    // 2. Fallback a SheetJS (XLSX)
    if (window.XLSX) {
        const sheetRows = [];
        sheetRows.push([`SAFRAN GROUP • SERVICE DESK`]);
        sheetRows.push([title || 'Reporte de Ingresos y Control de Credenciales']);
        sheetRows.push([`Fecha de Generación: ${dateStr}`]);
        sheetRows.push([]);
        
        const headers = columns.map(c => c.header);
        sheetRows.push(headers);
        
        data.forEach(row => {
            const rowData = columns.map(col => {
                let val = row[col.field];
                if (col.field === 'estatus_it' || col.field === 'estatus' || col.field === 'Estatus IT') {
                    const isComp = String(val || '').toLowerCase().includes('completad');
                    val = isComp ? 'Completado por IT' : 'Pendiente IT';
                } else if (col.field === 'correo_asignado' || col.field === 'correo' || col.field === 'Correo Asignado IT') {
                    if (!val || val === '-') val = 'Sin asignar';
                }
                if (val === undefined || val === null) val = '-';
                return val;
            });
            sheetRows.push(rowData);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
        const colWidths = columns.map((col) => {
            let maxLen = col.header.length;
            data.forEach(row => {
                const val = String(row[col.field] || '');
                if (val.length > maxLen) maxLen = val.length;
            });
            return { wch: Math.max(maxLen + 4, 16) };
        });
        worksheet['!cols'] = colWidths;

        const numCols = Math.max(columns.length - 1, 0);
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: numCols } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: numCols } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: numCols } }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Safran");
        XLSX.writeFile(workbook, `${cleanFilename}.xlsx`);
    } else {
        // Fallback a CSV
        let csvContent = "\uFEFF";
        const headers = columns.map(c => c.header);
        csvContent += headers.join(",") + "\n";
        
        data.forEach(row => {
            const line = columns.map(col => `"${String(row[col.field] || '').replace(/"/g, '""')}"`).join(",");
            csvContent += line + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanFilename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
