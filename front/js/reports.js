let pdfChartInstance = null;
let pdfTimelineInstance = null;

window.getWeekRangeText = function() {
    let refDate = new Date();
    const day = refDate.getDay();
    if (day === 0) refDate.setDate(refDate.getDate() - 2);
    else if (day === 6) refDate.setDate(refDate.getDate() - 1);
    
    let startDate = new Date(refDate);
    const refDay = startDate.getDay();
    const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
    startDate.setDate(startDate.getDate() + diffToMonday);

    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const pad = (n) => String(n).padStart(2, '0');
    const d1 = `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`;
    const d2 = `${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}`;
    return `Del ${d1} al ${d2}`;
};

window.renderReport = async () => {
    const pdfDate = document.getElementById("pdf-date");
    const pdfTitle = document.getElementById("pdf-title");
    
    if(pdfDate) pdfDate.textContent = `Fecha: ${new Date().toLocaleDateString('es-MX')}`;
    if(pdfTitle) pdfTitle.textContent = `Reporte Ejecutivo Service Desk`;
    
    // Asegurar que existan los datos
    if (!window.currentTableData || window.currentTableData.length === 0) {
        if (typeof window.loadDashboardData === 'function') {
            await window.loadDashboardData();
        }
    }

    const data = window.currentTableData || [];

    const elHistorico = document.getElementById('pdf-kpi-historico');
    const elMensual = document.getElementById('pdf-kpi-mensual');
    const elSemanal = document.getElementById('pdf-kpi-semanal');
    const elSemanalRango = document.getElementById('pdf-kpi-semanal-rango');
    const elPlantas = document.getElementById('pdf-kpi-plantas');
    
    const weekRangeText = typeof window.getWeekRangeText === 'function' ? window.getWeekRangeText() : '';

    if (elHistorico) elHistorico.textContent = window.getFilteredData('all', 'all', 'all', data).length;
    if (elMensual) elMensual.textContent = window.getFilteredData('monthly', 'all', 'all', data).length;
    if (elSemanal) elSemanal.textContent = window.getFilteredData('report_week', 'all', 'all', data).length;
    if (elSemanalRango) elSemanalRango.textContent = weekRangeText;

    // Actualizar leyendas de selectores con el rango de fechas de la semana actual
    document.querySelectorAll('#table-period option[value="report_week"], #pie-period option[value="report_week"]').forEach(opt => {
        opt.textContent = `Ingresos de la Semana (Actual: ${weekRangeText})`;
    });

    // Calcular Desglose por Planta
    if (elPlantas) {
        const plantaCounts = {};
        data.forEach(item => {
            const p = item.planta || 'SIN PLANTA';
            plantaCounts[p] = (plantaCounts[p] || 0) + 1;
        });

        let badgesHtml = '';
        Object.keys(plantaCounts).forEach(pName => {
            badgesHtml += `<span class="badge-planta-kpi" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.25rem 0.6rem; border-radius:6px; background:rgba(16,185,129,0.12); color:#10b981; font-weight:600; font-size:0.8rem; border:1px solid rgba(16,185,129,0.25);">${pName}: <strong>${plantaCounts[pName]}</strong></span> `;
        });
        elPlantas.innerHTML = badgesHtml || '<span style="color:var(--text-muted); font-size:0.85rem;">Sin registros</span>';
    }

    updatePieChart();
    updateTimelineChart();
    updatePdfTable();
};

function updatePieChart() {
    const piePeriod = document.getElementById('pie-period');
    const period = piePeriod ? piePeriod.value : 'report_week';
    const data = window.currentTableData || [];
    const filtered = window.getFilteredData(period, 'all', 'all', data);
    
    const areasCount = {};
    filtered.forEach(item => {
        const areaName = item.area || 'SIN ÁREA';
        if(!areasCount[areaName]) areasCount[areaName] = 0;
        areasCount[areaName]++;
    });
    if(typeof window.renderChart === 'function') {
        window.renderChart(areasCount, 'pdfChart', pdfChartInstance, (newInst) => { pdfChartInstance = newInst; });
    }
}

function updateTimelineChart() {
    const timelinePeriod = document.getElementById('timeline-period');
    const timelineArea = document.getElementById('timeline-area');
    const timelinePlanta = document.getElementById('timeline-planta');
    const timelineKpiValue = document.getElementById('timeline-kpi-value');
    
    const periodVal = timelinePeriod ? timelinePeriod.value : 'all';
    const areaVal = timelineArea ? timelineArea.value : 'all';
    const plantaVal = timelinePlanta ? timelinePlanta.value : 'all';
    const data = window.currentTableData || [];
    
    const filtered = window.getFilteredData(periodVal, areaVal, plantaVal, data);

    if (timelineKpiValue) timelineKpiValue.textContent = filtered.length;

    const timelineCount = {};
    filtered.forEach(item => {
        let dateObj = null;
        const targetDateStr = item.fechaCarga || item.fechaIngreso;
        if (targetDateStr) {
            const rawStr = targetDateStr.split(' ')[0];
            if (rawStr.includes('-')) {
                const p = rawStr.split('-');
                if (p.length >= 3) dateObj = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
            } else if (rawStr.includes('/')) {
                const p = rawStr.split('/');
                if (p.length >= 3) dateObj = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
            } else {
                dateObj = new Date(targetDateStr);
            }
        }
        
        if (!dateObj || isNaN(dateObj.getTime())) {
            dateObj = new Date();
        }

        let dateKey = dateObj.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
        if(!timelineCount[dateKey]) timelineCount[dateKey] = 0;
        timelineCount[dateKey]++;
    });
    
    renderTimelineChart(timelineCount, 'pdfTimelineChart', pdfTimelineInstance, (newInst) => { pdfTimelineInstance = newInst; });
}

function renderTimelineChart(dataObj, canvasId, instance, setInstanceCallback) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const sortedDates = Object.keys(dataObj);
    const labels = sortedDates.length > 0 ? sortedDates : ['Sin registros'];
    const data = sortedDates.length > 0 ? sortedDates.map(date => dataObj[date]) : [0];

    if (instance) instance.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const newInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: data,
                backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                borderColor: isDark ? '#60a5fa' : '#1d4ed8',
                borderWidth: 1.5,
                borderRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 }
                }
            }
        }
    });
    setInstanceCallback(newInst);
}

window.lastFilteredReportData = [];

window.updatePdfSelectionCounter = function() {
    const allCheckboxes = document.querySelectorAll('#pdf-table .pdf-row-select');
    const checkedCheckboxes = document.querySelectorAll('#pdf-table .pdf-row-select:checked');
    const counterEl = document.getElementById('pdf-selection-counter');
    const headerCheck = document.getElementById('pdf-check-all-rows');

    if (counterEl) {
        counterEl.textContent = `${checkedCheckboxes.length} de ${allCheckboxes.length} Seleccionados`;
    }

    if (headerCheck && allCheckboxes.length > 0) {
        headerCheck.checked = (allCheckboxes.length === checkedCheckboxes.length);
    }
};

function updatePdfTable() {
    const tablePeriod = document.getElementById('table-period');
    const tableArea = document.getElementById('table-area');
    const tablePlanta = document.getElementById('table-planta');
    
    const periodVal = tablePeriod ? tablePeriod.value : 'report_week';
    const areaVal = tableArea ? tableArea.value : 'all';
    const plantaVal = tablePlanta ? tablePlanta.value : 'all';
    const data = window.currentTableData || [];

    const filtered = window.getFilteredData(periodVal, areaVal, plantaVal, data);
    const sortedData = [...filtered].sort((a, b) => new Date(b.fechaCarga || b.fechaIngreso) - new Date(a.fechaCarga || a.fechaIngreso));
    
    window.lastFilteredReportData = sortedData;

    const tbody = document.querySelector("#pdf-table tbody");
    if (typeof window.renderTableDOM === 'function' && tbody) {
        window.renderTableDOM(sortedData, tbody, true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const piePeriod = document.getElementById('pie-period');
    const timelinePeriod = document.getElementById('timeline-period');
    const timelineArea = document.getElementById('timeline-area');
    const timelinePlanta = document.getElementById('timeline-planta');
    const tablePeriod = document.getElementById('table-period');
    const tableArea = document.getElementById('table-area');
    const tablePlanta = document.getElementById('table-planta');
    
    if(piePeriod) piePeriod.addEventListener('change', updatePieChart);
    [timelinePeriod, timelineArea, timelinePlanta].forEach(el => el && el.addEventListener('change', updateTimelineChart));
    [tablePeriod, tableArea, tablePlanta].forEach(el => el && el.addEventListener('change', updatePdfTable));

    // Eventos de Selección de Filas en la Tabla del PDF
    const headerCheck = document.getElementById('pdf-check-all-rows');
    if (headerCheck) {
        headerCheck.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('#pdf-table .pdf-row-select').forEach(cb => {
                cb.checked = isChecked;
            });
            window.updatePdfSelectionCounter();
        });
    }

    const pdfTable = document.getElementById('pdf-table');
    if (pdfTable) {
        pdfTable.addEventListener('change', (e) => {
            if (e.target.classList.contains('pdf-row-select')) {
                window.updatePdfSelectionCounter();
            }
        });
    }

    const btnSelectAll = document.getElementById('btn-pdf-select-all');
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            document.querySelectorAll('#pdf-table .pdf-row-select').forEach(cb => cb.checked = true);
            window.updatePdfSelectionCounter();
        });
    }

    const btnDeselectAll = document.getElementById('btn-pdf-deselect-all');
    if (btnDeselectAll) {
        btnDeselectAll.addEventListener('click', () => {
            document.querySelectorAll('#pdf-table .pdf-row-select').forEach(cb => cb.checked = false);
            window.updatePdfSelectionCounter();
        });
    }

    const btnDownloadPdf = document.getElementById("btn-download-pdf");
    if(btnDownloadPdf) {
        btnDownloadPdf.addEventListener("click", () => {
            const selectedRows = document.querySelectorAll('#pdf-table tbody tr');
            let checkedCheckboxes = document.querySelectorAll('#pdf-table .pdf-row-select:checked');
            
            // Si el usuario desmarcó todo, seleccionar automáticamente la semana actual / filtro activo
            if (checkedCheckboxes.length === 0) {
                document.querySelectorAll('#pdf-table .pdf-row-select').forEach(cb => cb.checked = true);
                if (typeof window.updatePdfSelectionCounter === 'function') window.updatePdfSelectionCounter();
                checkedCheckboxes = document.querySelectorAll('#pdf-table .pdf-row-select:checked');
            }

            if (checkedCheckboxes.length === 0) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert('No hay datos disponibles para generar el reporte PDF en el periodo seleccionado.', 'Sin Registros', 'info');
                } else {
                    alert('No hay datos disponibles para generar el reporte PDF.');
                }
                return;
            }

            const element = document.getElementById('pdf-container');
            if (element) element.classList.add('pdf-exporting');

            // Ocultar filas desmarcadas
            const rowsToRestore = [];
            selectedRows.forEach(tr => {
                const cb = tr.querySelector('.pdf-row-select');
                if (cb && !cb.checked) {
                    tr.style.display = 'none';
                    rowsToRestore.push(tr);
                }
            });

            // Ocultar checkboxes y controles de selección/filtros para el PDF
            const selectColsToHide = element.querySelectorAll('.pdf-select-col, .pdf-table-header-controls, select, button');
            selectColsToHide.forEach(el => el.style.display = 'none');
            
            const opt = {
                margin:       [0.25, 0.35, 0.25, 0.35],
                filename:     `ServiceDesk_Reporte_Ingresos_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' },
                pagebreak:    { mode: ['css', 'legacy'] }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                // Restaurar vista
                if (element) element.classList.remove('pdf-exporting');
                selectColsToHide.forEach(el => el.style.display = '');
                rowsToRestore.forEach(tr => tr.style.display = '');
            }).catch(() => {
                if (element) element.classList.remove('pdf-exporting');
                selectColsToHide.forEach(el => el.style.display = '');
                rowsToRestore.forEach(tr => tr.style.display = '');
            });
        });
    }

    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener("click", () => {
            let checkedCheckboxes = document.querySelectorAll('#pdf-table .pdf-row-select:checked');
            if (checkedCheckboxes.length === 0) {
                document.querySelectorAll('#pdf-table .pdf-row-select').forEach(cb => cb.checked = true);
                if (typeof window.updatePdfSelectionCounter === 'function') window.updatePdfSelectionCounter();
            }

            const tbodyRows = document.querySelectorAll('#pdf-table tbody tr');
            const selectedItems = [];
            
            tbodyRows.forEach(tr => {
                const cb = tr.querySelector('.pdf-row-select');
                if (cb && cb.checked) {
                    const idx = parseInt(cb.dataset.index, 10);
                    if (!isNaN(idx) && window.lastFilteredReportData[idx]) {
                        selectedItems.push(window.lastFilteredReportData[idx]);
                    }
                }
            });

            if (selectedItems.length === 0) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert('No hay registros en el periodo seleccionado para exportar.', 'Sin Datos', 'info');
                } else {
                    alert('No hay registros en el periodo seleccionado para exportar.');
                }
                return;
            }

            const columns = [
                { header: 'MUG', field: 'mug' },
                { header: 'Número Nómina', field: 'numero_nomina' },
                { header: 'Nombre Completo', field: 'nombreCompleto' },
                { header: 'Puesto', field: 'puesto' },
                { header: 'Área', field: 'area' },
                { header: 'Planta', field: 'planta' },
                { header: 'Fecha de Registro / Ingreso', field: 'fechaCarga' }
            ];

            if (typeof window.exportStyledExcel === 'function') {
                window.exportStyledExcel({
                    title: 'Reporte Personalizado de Usuarios - Service Desk',
                    filename: `Reporte_Usuarios_Seleccionados_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}`,
                    columns: columns,
                    data: selectedItems
                });
            }
        });
    }
});
