window.currentTableData = [];
let chartInstance = null;

window.getFilteredData = (period, area, planta, dataToFilter) => {
    const data = dataToFilter || window.currentTableData || [];
    const now = new Date();
    let startDate = new Date(0);
    let endDate = new Date('9999-12-31');

    if (period === "weekly") {
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else if (period === "monthly") {
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    } else if (period === "report_week") {
        let refDate = new Date();
        const day = refDate.getDay();
        if (day === 0) refDate.setDate(refDate.getDate() - 2);
        else if (day === 6) refDate.setDate(refDate.getDate() - 1);
        
        startDate = new Date(refDate);
        const refDay = startDate.getDay();
        const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
        startDate.setDate(startDate.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Lunes a Domingo (+6 días)
        endDate.setHours(23, 59, 59, 999);
    }

    return data.filter(item => {
        // Priorizar Fecha de Carga / Registro (cuándo se ingresó en el sistema)
        const targetDate = item.fechaCarga || item.fechaRegistro || item.fechaIngreso;
        let compareDate = null;
        if (targetDate) {
            const parts = targetDate.trim().split(' ');
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
                const y = parseInt(dateParts[0], 10);
                const m = parseInt(dateParts[1], 10) - 1;
                const d = parseInt(dateParts[2], 10);
                let hh = 0, mm = 0, ss = 0;
                if (parts[1]) {
                    const timeParts = parts[1].split(':');
                    hh = parseInt(timeParts[0], 10) || 0;
                    mm = parseInt(timeParts[1], 10) || 0;
                    ss = parseInt(timeParts[2], 10) || 0;
                }
                compareDate = new Date(y, m, d, hh, mm, ss);
            } else {
                compareDate = new Date(targetDate);
            }
        }
        if (!compareDate || isNaN(compareDate.getTime())) compareDate = new Date();

        let periodMatch = compareDate >= startDate && compareDate <= endDate;
        if (period === "last-upload" || period === "all") periodMatch = true;
        
        let areaMatch = (area === 'all' || item.area === area);
        let plantaMatch = (planta === 'all' || item.planta === planta);
        return periodMatch && areaMatch && plantaMatch;
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    const isLogged = await checkSession(true);
    if (typeof setupLogout === 'function') setupLogout('btn-logout');

    if(isLogged) {
        await loadCatalogos();
        await loadDashboardData();
    }
    
    setupClearFilters();
});

function setupClearFilters() {
    document.querySelectorAll('.btn-clear-filters').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.currentTarget.dataset.group;
            if (!group) return;
            
            const period = document.getElementById(`${group}-period`);
            const area = document.getElementById(`${group}-area`);
            const planta = document.getElementById(`${group}-planta`);
            
            if (period) {
                period.value = (group === 'pie' || group === 'timeline' || group === 'table') ? 'report_week' : 'all';
            }
            if (area) area.value = 'all';
            if (planta) planta.value = 'all';
            
            if (period) period.dispatchEvent(new Event('change'));
            else if (area) area.dispatchEvent(new Event('change'));
        });
    });
}

async function loadDashboardData() {
    if (window.isFetchingDashboardData) return;
    window.isFetchingDashboardData = true;
    try {
        const res = await fetch('../back/api/api_empleados.php');
        const json = await res.json();
        
        if(json.status === 'success' && Array.isArray(json.data)) {
            window.currentTableData = json.data.map(item => ({
                mug: item.mug,
                numero_nomina: item.numero_nomina,
                nombreCompleto: `${item.nombre} ${item.apellido_paterno} ${item.apellido_materno || ''}`.trim(),
                area: item.nombre_area || "SIN ÁREA",
                puesto: item.puesto || "SIN PUESTO",
                planta: item.nombre_planta || "SIN PLANTA",
                fechaCarga: item.fecha_ingreso || item.fecha_registro,
                fechaRegistro: item.fecha_registro,
                fechaIngreso: item.fecha_ingreso
            }));
            updateDashboard();
            if (typeof window.renderReport === 'function' && !window.isRenderingReport) {
                window.isRenderingReport = true;
                try {
                    await window.renderReport();
                } finally {
                    window.isRenderingReport = false;
                }
            }
        }
    } catch(e) {
        console.error("Error cargando datos del dashboard", e);
        if (!window.currentTableData) window.currentTableData = [];
    } finally {
        window.isFetchingDashboardData = false;
    }
}

function updateDashboard() {
    const kpiTotal = document.getElementById("kpi-total");
    const kpiCompanies = document.getElementById("kpi-companies");
    const data = window.currentTableData || [];
    
    if (kpiTotal) kpiTotal.textContent = data.length;
    
    const areasCount = {};
    const allAreas = new Set();
    const allPlantas = new Set();
    
    data.forEach(item => {
        if(!areasCount[item.area]) areasCount[item.area] = 0;
        areasCount[item.area]++;
        
        if (item.area !== "SIN ÁREA") allAreas.add(item.area);
        if (item.planta !== "SIN PLANTA") allPlantas.add(item.planta);
    });
    
    if (kpiCompanies) kpiCompanies.textContent = Object.keys(areasCount).length;
    
    populateSelects(globalAreas, globalPlantas);
    renderChart(areasCount, 'areasChart', chartInstance, (newInst) => { chartInstance = newInst; });
    updateDashboardTable();
}

let globalAreas = [];
let globalPlantas = [];

async function loadCatalogos() {
    try {
        const res = await fetch('../back/api/api_catalogos.php');
        const json = await res.json();
        if(json.status === 'success') {
            globalAreas = json.data.areas.map(a => a.nombre_area);
            globalPlantas = json.data.plantas.map(p => p.nombre_completo);
        }
    } catch(e) {
        console.error("Error cargando catálogos", e);
    }
}

function populateSelects(areasData, plantasData) {
    const mainArea = document.getElementById('main-area');
    const mainPlanta = document.getElementById('main-planta');
    const timelineArea = document.getElementById('timeline-area');
    const timelinePlanta = document.getElementById('timeline-planta');
    const tableArea = document.getElementById('table-area');
    const tablePlanta = document.getElementById('table-planta');

    const areaSelects = [mainArea, timelineArea, tableArea];
    areaSelects.forEach(select => {
        if (select) {
            const currentSelected = select.value || 'all';
            select.innerHTML = '<option value="all">Todas las Áreas</option>';
            areasData.forEach(area => {
                select.innerHTML += `<option value="${area}">${area}</option>`;
            });
            select.value = Array.from(select.options).some(o => o.value === currentSelected) ? currentSelected : 'all';
        }
    });

    const plantaSelects = [mainPlanta, timelinePlanta, tablePlanta];
    plantaSelects.forEach(select => {
        if (select) {
            const currentSelected = select.value || 'all';
            select.innerHTML = '<option value="all">Todas las Plantas</option>';
            plantasData.forEach(planta => {
                select.innerHTML += `<option value="${planta}">${planta}</option>`;
            });
            select.value = Array.from(select.options).some(o => o.value === currentSelected) ? currentSelected : 'all';
        }
    });
}

function updateDashboardTable() {
    const mainPeriod = document.getElementById('main-period');
    const mainArea = document.getElementById('main-area');
    const mainPlanta = document.getElementById('main-planta');
    const searchInput = document.getElementById("search-input");
    const data = window.currentTableData || [];
    
    const period = mainPeriod ? mainPeriod.value : 'all';
    const area = mainArea ? mainArea.value : 'all';
    const planta = mainPlanta ? mainPlanta.value : 'all';
    
    let filtered = window.getFilteredData(period, area, planta, data);
    
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (term) {
        filtered = filtered.filter(item => 
            (item.mug && item.mug.toLowerCase().includes(term)) || 
            (item.nombreCompleto && item.nombreCompleto.toLowerCase().includes(term)) ||
            (item.area && item.area.toLowerCase().includes(term))
        );
    }
    
    const sortedData = [...filtered].sort((a, b) => new Date(b.fechaIngreso || b.fechaCarga) - new Date(a.fechaIngreso || a.fechaCarga));
    renderTableDOM(sortedData.slice(0, 100), document.querySelector("#recent-table tbody"), false);
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById("search-input");
    if(searchInput) searchInput.addEventListener('input', updateDashboardTable);
    
    const mainPeriod = document.getElementById('main-period');
    const mainArea = document.getElementById('main-area');
    const mainPlanta = document.getElementById('main-planta');
    
    [mainPeriod, mainArea, mainPlanta].forEach(el => el && el.addEventListener('change', updateDashboardTable));
});

window.renderChart = function(dataObj, canvasId, instance, setInstanceCallback) {
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const sortedAreas = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
    let labels = sortedAreas.map(item => item[0]);
    let data = sortedAreas.map(item => item[1]);
    const isDark = document.body.classList.contains('dark-mode');
    
    let bgColors = ['#0f172a', '#1e293b', '#2563eb', '#3b82f6', '#475569', '#6366f1', '#0ea5e9', '#8b5cf6', '#64748b', '#94a3b8'];
    
    if (labels.length === 0) {
        labels = ['Sin registros en el periodo'];
        data = [1];
        bgColors = [isDark ? '#334155' : '#e2e8f0'];
    }

    if (instance) instance.destroy();

    Chart.defaults.color = isDark ? '#a1a1aa' : '#64748b';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const newInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: isDark ? '#141414' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'right', labels: { boxWidth: 15, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (labels[0] === 'Sin registros en el periodo') return ' 0 ingresos';
                            return ' ' + context.parsed + ' ingresos';
                        }
                    }
                }
            }
        }
    });
    setInstanceCallback(newInst);
};

window.renderTableDOM = function(dataArray, tbodyElement, isPdf = false) {
    if(!tbodyElement) return;
    tbodyElement.innerHTML = "";
    
    if (!dataArray || dataArray.length === 0) {
        tbodyElement.innerHTML = `<tr><td colspan="${isPdf ? 6 : 6}" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No hay usuarios registrados.</td></tr>`;
        if (isPdf && typeof window.updatePdfSelectionCounter === 'function') {
            window.updatePdfSelectionCounter();
        }
        return;
    }

    dataArray.forEach((item, idx) => {
        const tr = document.createElement("tr");
        const displayDate = item.fechaCarga ? item.fechaCarga.split(' ')[0] : (item.fechaIngreso ? item.fechaIngreso.split(' ')[0] : '-');
        
        const mugHTML = item.mug ? `<span class="copyable-mug" data-mug="${item.mug}" title="Clic para copiar MUG">
            <span>${item.mug}</span>
            <svg class="copy-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </span>` : '-';
        
        if (isPdf) {
            tr.innerHTML = `
                <td class="pdf-select-col" style="text-align:center;"><input type="checkbox" class="pdf-row-select" checked data-index="${idx}"></td>
                <td>${mugHTML}</td>
                <td><strong>${item.nombreCompleto || 'N/A'}</strong></td>
                <td><span style="color:#2563eb; font-weight:600;">${item.area || 'SIN ÁREA'}</span></td>
                <td><span style="color:#059669; font-weight:500;">${item.planta || 'SIN PLANTA'}</span></td>
                <td>${displayDate}</td>
            `;
        } else {
            tr.innerHTML = `
                <td>${mugHTML}</td>
                <td>${item.nombreCompleto || 'N/A'}</td>
                <td><span class="badge" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--card-border);">${item.puesto || 'SIN PUESTO'}</span></td>
                <td><span style="color:#2563eb; font-weight:600;">${item.area || 'SIN ÁREA'}</span></td>
                <td><span style="color:#059669; font-weight:500;">${item.planta || 'SIN PLANTA'}</span></td>
                <td>${displayDate}</td>
            `;
        }
        tbodyElement.appendChild(tr);
    });

    if (isPdf && typeof window.updatePdfSelectionCounter === 'function') {
        window.updatePdfSelectionCounter();
    }
};

window.loadDashboardData = loadDashboardData;
window.updateDashboard = updateDashboard;
