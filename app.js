const DB_NAME = "ServiceDeskDB";
const DB_VERSION = 2; // Versión actualizada para usar MUG
const STORE_NAME = "ingresos_v2";

let db;
let chartInstance = null;

// Initialize Database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error("Error al abrir IndexedDB", event);
            reject("Error de base de datos");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Usar 'mug' como identificador único principal
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "mug" });
                // Crear índices para buscar y ordenar
                objectStore.createIndex("area", "area", { unique: false });
                objectStore.createIndex("fechaCarga", "fechaCarga", { unique: false });
            }
        };
    });
}

// UI Elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadStatus = document.getElementById("upload-status");
const kpiTotal = document.getElementById("kpi-total");
const kpiCompanies = document.getElementById("kpi-companies");
const recentTableBody = document.querySelector("#recent-table tbody");
const btnClearDb = document.getElementById("btn-clear-db");

// Novedades: Navegación, Buscador y Reportes
const navItems = document.querySelectorAll(".nav-item");
const viewSections = document.querySelectorAll(".view-section");
const searchInput = document.getElementById("search-input");
const piePeriod = document.getElementById('pie-period');
const timelinePeriod = document.getElementById('timeline-period');
const timelineArea = document.getElementById('timeline-area');
const timelinePlanta = document.getElementById('timeline-planta');
const timelineKpiValue = document.getElementById('timeline-kpi-value');
const tablePeriod = document.getElementById('table-period');
const tableArea = document.getElementById('table-area');
const tablePlanta = document.getElementById('table-planta');
const btnExportExcel = document.getElementById('btn-export-excel');
const btnDownloadPdf = document.getElementById("btn-download-pdf");
const pdfTitle = document.getElementById("pdf-title");
const pdfDate = document.getElementById("pdf-date");
const pdfKpiTotal = document.getElementById("pdf-kpi-total");
const pdfTableBody = document.querySelector("#pdf-table tbody");

// Global Chart Instances
let pdfChartInstance = null;
let pdfTimelineInstance = null;

let currentTableData = [];

// Tab Navigation Logic
navItems.forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Remover activo de todos
        navItems.forEach(nav => nav.classList.remove("active"));
        viewSections.forEach(view => view.classList.remove("active"));
        
        // Poner activo al clickeado
        item.classList.add("active");
        const targetId = item.getAttribute("data-target");
        document.getElementById(targetId).classList.add("active");

        if (targetId === "view-reports") {
            renderReport(); // Dibujar reporte si entramos a la pestaña
        }
    });
});

// Search Logic
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filtrar los datos en memoria
    const filteredData = currentTableData.filter(item => {
        return item.mug.toLowerCase().includes(searchTerm) || 
               item.nombreCompleto.toLowerCase().includes(searchTerm) ||
               item.area.toLowerCase().includes(searchTerm);
    });
    
    renderTableDOM(filteredData, recentTableBody);
});

// Drag and Drop Events
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

btnClearDb.addEventListener("click", async () => {
    if(confirm("¿Estás seguro de que deseas borrar TODOS los registros de ingresos? Esta acción no se puede deshacer.")) {
        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => {
            updateDashboard();
            alert("Base de datos borrada con éxito.");
        };
    }
});

// File Processing
function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
        setStatus("Por favor sube un archivo Excel válido (.xlsx, .xls, .csv)", "error");
        return;
    }

    setStatus("Procesando archivo...", "");
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Suponemos que los datos están en la primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir a JSON como matriz (array de arrays)
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            processExcelData(json, worksheet);
        } catch (error) {
            console.error(error);
            setStatus("Error al leer el archivo. Verifica el formato.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseExcelDate(excelDate) {
    if (!excelDate) return null;
    
    if (excelDate instanceof Date) {
        if (!isNaN(excelDate.getTime())) return excelDate.toISOString();
        return null;
    }
    
    if (typeof excelDate === 'number') {
        // Excel serial date to JS Date
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        if (!isNaN(date.getTime())) return date.toISOString();
    }
    
    if (typeof excelDate === 'string') {
        let date = new Date(excelDate);
        if (!isNaN(date.getTime())) return date.toISOString();
        
        const parts = excelDate.split(/[/-]/);
        if (parts.length === 3) {
            // Asumimos DD/MM/YYYY o DD-MM-YYYY
            date = new Date(parts[2], parts[1] - 1, parts[0]);
            if (!isNaN(date.getTime())) return date.toISOString();
        }
    }
    return null;
}

function processExcelData(data2D, worksheet) {
    let newRecords = 0;
    let duplicateRecords = 0;
    let errorRecords = 0;
    let hiddenRecords = 0;

    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // Obtener la fecha seleccionada por el usuario (o usar la actual por defecto)
    const dateInputVal = document.getElementById('upload-date').value;
    let uploadDate = new Date();
    if(dateInputVal) {
        // Parsear 'YYYY-MM-DD' de manera local
        const parts = dateInputVal.split('-');
        uploadDate = new Date(parts[0], parts[1] - 1, parts[2], uploadDate.getHours(), uploadDate.getMinutes());
    }
    const currentDate = uploadDate.toISOString();

    // 1. Encontrar la fila de encabezados verdaderos (buscando MUG o ID)
    let headerRowIndex = -1;
    let colIndices = { id: -1, mug: -1, nombre: -1, apellido: -1, area: -1, puesto: -1, planta: -1, fechaIngreso: -1 };

    for (let i = 0; i < data2D.length; i++) {
        const row = data2D[i];
        if (!row || !row.length) continue;
        
        // Convertir la fila a un array de strings en mayúsculas sin acentos
        const rowStrings = row.map(cell => cell ? String(cell).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "");
        
        // Verificar si esta fila tiene el MUG y el ID
        const mugIndex = rowStrings.findIndex(val => val === "MUG" || val === "USUARIO");
        const idIndex = rowStrings.findIndex(val => val === "ID EMPLEADO" || val === "ID_EMPLEADO" || val === "ID" || val === "NUMERO DE EMPLEADO" || val === "NO. EMP.");
        
        if (mugIndex !== -1 || idIndex !== -1) {
            headerRowIndex = i;
            colIndices.mug = mugIndex;
            colIndices.id = idIndex;
            colIndices.nombre = rowStrings.findIndex(val => val === "NOMBRE COMPLETO" || val === "NOMBRE" || val === "EMPLEADO");
            colIndices.apellido = rowStrings.findIndex(val => val === "APELLIDO PATERNO" || val === "APELLIDO" || val === "PATERNO");
            colIndices.area = rowStrings.findIndex(val => val === "AREA" || val === "DEPARTAMENTO" || val === "DEPTO");
            colIndices.puesto = rowStrings.findIndex(val => val === "PUESTO" || val === "CARGO" || val === "POSICION");
            
            // Detección de nueva columna: Planta
            colIndices.planta = rowStrings.findIndex(val => ["PLANTA", "SUCURSAL", "UBICACION", "LOCATION", "CENTRO", "CECO", "SITIO", "COMPANIA", "COMPANY", "NEGOCIO"].includes(val));
            
            // Detección de nueva columna: Fecha de Ingreso
            colIndices.fechaIngreso = rowStrings.findIndex(val => ["FECHA INGRESO", "FECHA DE INGRESO", "FECHA ALTA", "FECHA DE ALTA", "ALTA", "FECHA", "INGRESO", "START DATE", "FECHA DE CARGA"].includes(val));
            break;
        }
    }

    if (headerRowIndex === -1 || colIndices.mug === -1) {
        setStatus("Error: No se encontró la columna MUG en el Excel.", "error");
        return;
    }

    // 2. Procesar los datos (desde la fila siguiente al encabezado)
    for (let i = headerRowIndex + 1; i < data2D.length; i++) {
        // Verificar si la fila está oculta por un filtro en Excel
        const rowProps = worksheet['!rows'] ? worksheet['!rows'][i] : null;
        if (rowProps && rowProps.hidden) {
            hiddenRecords++;
            continue; // Ignorar filas ocultas por filtros
        }

        const row = data2D[i];
        if (!row || row.length === 0) continue;

        const idVal = colIndices.id !== -1 ? row[colIndices.id] : "";
        const mugVal = colIndices.mug !== -1 ? row[colIndices.mug] : "";
        const nombreVal = colIndices.nombre !== -1 ? row[colIndices.nombre] : "";
        const apellidoVal = colIndices.apellido !== -1 ? row[colIndices.apellido] : "";
        const areaVal = colIndices.area !== -1 ? row[colIndices.area] : "";
        const puestoVal = colIndices.puesto !== -1 ? row[colIndices.puesto] : "";
        const plantaVal = colIndices.planta !== -1 ? row[colIndices.planta] : "";
        const fechaIngresoVal = colIndices.fechaIngreso !== -1 ? row[colIndices.fechaIngreso] : null;

        // Función para detectar si una celda tiene errores de fórmula de Excel
        const isJunk = (val) => {
            if (val === undefined || val === null) return false;
            const s = String(val).trim().toUpperCase();
            return s.includes("#REF!") || s.includes("#ERROR!");
        };

        const cleanMug = mugVal ? String(mugVal).trim() : "";

        // Si el MUG está vacío, o si cualquier columna importante tiene error, descartamos la fila
        if (!cleanMug || isJunk(cleanMug) || isJunk(idVal) || isJunk(nombreVal) || isJunk(areaVal) || isJunk(puestoVal)) {
            errorRecords++;
            continue;
        }

        const finalArea = areaVal ? String(areaVal).trim().toUpperCase() : "SIN ÁREA";
        const finalPuesto = puestoVal ? String(puestoVal).trim() : "SIN PUESTO";
        const finalPlanta = plantaVal ? String(plantaVal).trim().toUpperCase() : "SIN PLANTA";
        
        // Usar la fecha del Excel si existe, si no, usar la del UI
        let finalFechaCarga = currentDate;
        if (fechaIngresoVal) {
            const parsed = parseExcelDate(fechaIngresoVal);
            if (parsed) finalFechaCarga = parsed;
        }

        const record = {
            idEmpleado: idVal ? String(idVal).trim() : "",
            mug: cleanMug,
            nombreCompleto: `${nombreVal || ""} ${apellidoVal || ""}`.trim(),
            area: finalArea,
            puesto: finalPuesto,
            planta: finalPlanta,
            fechaCarga: finalFechaCarga
        };

        const request = store.add(record);
        
        request.onsuccess = () => { newRecords++; };
        request.onerror = (e) => {
            // Error de restricción única (ya existe el MUG)
            e.preventDefault();
            duplicateRecords++;
        };
    }

    tx.oncomplete = () => {
        let msg = `Carga completada: ${newRecords} registros nuevos.`;
        if (duplicateRecords > 0) msg += ` (${duplicateRecords} ignorados por duplicidad).`;
        if (hiddenRecords > 0) msg += ` (${hiddenRecords} ignorados por estar filtrados/ocultos).`;
        if (errorRecords > 0) msg += ` (${errorRecords} omitidos por errores).`;
        
        setStatus(msg, "success");
        updateDashboard();
        
        // Reset file input
        fileInput.value = "";
    };
}

function setStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = "status-message";
    if (type) {
        uploadStatus.classList.add(`status-${type}`);
    }
}

// Dashboard Update
function updateDashboard() {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const data = request.result;
        currentTableData = data; // Guardamos en memoria para el buscador
        
        // Update KPIs
        kpiTotal.textContent = data.length;
        
        // Group by Area
        const areasCount = {};
        data.forEach(item => {
            if(!areasCount[item.area]) areasCount[item.area] = 0;
            areasCount[item.area]++;
        });
        
        const uniqueAreas = Object.keys(areasCount).length;
        kpiCompanies.textContent = uniqueAreas;
        
        const allAreas = new Set();
        // Catálogo oficial de Plantas
        const allPlantas = new Set([
            "SAEM", "SAFRAN MEXICO", "MDS", "SLSM", "P3", "SSNA", "SLSSA", "SAESA SHOP", "SAESA REP"
        ]);
        
        data.forEach(item => {
            if (item.area && item.area !== "SIN ÁREA") allAreas.add(item.area);
            if (item.planta && item.planta !== "SIN PLANTA") allPlantas.add(item.planta);
        });

        // Actualizar selectores de áreas en Reportes
        const areaSelects = [timelineArea, tableArea];
        areaSelects.forEach(select => {
            if (select) {
                const currentSelected = select.value;
                select.innerHTML = '<option value="all">Todas las Áreas</option>';
                Array.from(allAreas).sort().forEach(area => {
                    const opt = document.createElement("option");
                    opt.value = area;
                    opt.textContent = area;
                    select.appendChild(opt);
                });
                if(Array.from(select.options).some(o => o.value === currentSelected)) {
                    select.value = currentSelected;
                }
            }
        });
        
        // Actualizar selectores de plantas en Reportes
        const plantaSelects = [timelinePlanta, tablePlanta];
        plantaSelects.forEach(select => {
            if (select) {
                const currentSelected = select.value;
                select.innerHTML = '<option value="all">Todas las Plantas</option>';
                Array.from(allPlantas).sort().forEach(planta => {
                    const opt = document.createElement("option");
                    opt.value = planta;
                    opt.textContent = planta;
                    select.appendChild(opt);
                });
                if(Array.from(select.options).some(o => o.value === currentSelected)) {
                    select.value = currentSelected;
                }
            }
        });
        
        // Update Chart
        renderChart(areasCount, 'areasChart', chartInstance, (newInst) => { chartInstance = newInst; });
        
        // Update Table
        // Sort descending by date
        const sortedData = [...data].sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga));
        renderTableDOM(sortedData.slice(0, 50), recentTableBody, false); // Mostramos los últimos 50 en la tabla principal
    };
}

function renderChart(dataObj, canvasId, instance, setInstanceCallback) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Sort areas by count
    const sortedAreas = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
    const labels = sortedAreas.map(item => item[0]);
    const data = sortedAreas.map(item => item[1]);

    if (instance) {
        instance.destroy();
    }

    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const newInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos por Área',
                data: data,
                backgroundColor: [
                    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
                    '#06b6d4', '#6366f1', '#ec4899', '#84cc16', '#f97316'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
    setInstanceCallback(newInst);
}

function renderTableDOM(dataArray, tbodyElement, isPdf = false) {
    tbodyElement.innerHTML = "";
    
    dataArray.forEach(item => {
        const tr = document.createElement("tr");
        const dateObj = new Date(item.fechaCarga);
        const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        if (isPdf) {
            tr.innerHTML = `
                <td><strong>${item.mug}</strong></td>
                <td>${item.nombreCompleto || 'N/A'}</td>
                <td><span style="color:#2563eb; font-weight:600;">${item.area}</span></td>
                <td><span style="color:#059669; font-weight:500;">${item.planta || 'SIN PLANTA'}</span></td>
                <td>${formattedDate}</td>
            `;
        } else {
            tr.innerHTML = `
                <td><strong>${item.mug}</strong></td>
                <td>${item.nombreCompleto || 'N/A'}</td>
                <td><span class="badge" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--card-border);">${item.puesto}</span></td>
                <td><span style="color:#2563eb; font-weight:600;">${item.area}</span></td>
                <td><span style="color:#059669; font-weight:500;">${item.planta || 'SIN PLANTA'}</span></td>
                <td>${formattedDate}</td>
            `;
        }
        tbodyElement.appendChild(tr);
    });
}

function renderTimelineChart(dataObj, canvasId, instance, setInstanceCallback) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Sort chronologically
    const sortedDates = Object.keys(dataObj).sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedDates;
    const data = sortedDates.map(date => dataObj[date]);

    if (instance) {
        instance.destroy();
    }

    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const newInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos por Día',
                data: data,
                backgroundColor: 'rgba(124, 58, 237, 0.2)', // var(--primary-purple)
                borderColor: 'rgba(124, 58, 237, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(124, 58, 237, 1)',
                pointRadius: 4,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
    setInstanceCallback(newInst);
}

// --- LOGICA INDEPENDIENTE DE REPORTES ---
const getFilteredData = (period, area, planta, dataToFilter) => {
    const allSorted = [...dataToFilter].sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga));
    const lastUploadStr = allSorted.length > 0 ? allSorted[0].fechaCarga : null;
    
    let startDate = new Date(0);
    const now = new Date();
    if (period === "weekly") startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    else if (period === "monthly") startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    return dataToFilter.filter(item => {
        let periodMatch = true;
        if (period === "last-upload") {
            periodMatch = item.fechaCarga === lastUploadStr;
        } else {
            periodMatch = new Date(item.fechaCarga) >= startDate;
        }
        let areaMatch = (area === 'all' || item.area === area);
        let plantaMatch = (planta === 'all' || item.planta === planta);
        return periodMatch && areaMatch && plantaMatch;
    });
};

function updatePieChart() {
    if (!piePeriod) return;
    const period = piePeriod.value;
    const filtered = getFilteredData(period, 'all', 'all', currentTableData);
    
    const areasCount = {};
    filtered.forEach(item => {
        if(!areasCount[item.area]) areasCount[item.area] = 0;
        areasCount[item.area]++;
    });
    renderChart(areasCount, 'pdfChart', pdfChartInstance, (newInst) => { pdfChartInstance = newInst; });
}

function updateTimelineChart() {
    if (!timelinePeriod || !timelineArea || !timelinePlanta) return;
    const period = timelinePeriod.value;
    const area = timelineArea.value;
    const planta = timelinePlanta.value;
    const filtered = getFilteredData(period, area, planta, currentTableData);

    // Actualizar KPI gigante
    if (timelineKpiValue) {
        timelineKpiValue.textContent = filtered.length;
    }

    const timelineCount = {};
    filtered.forEach(item => {
        const dateObj = new Date(item.fechaCarga);
        let dateKey = "";
        
        if (period === "weekly" || period === "last-upload") {
            // Agrupar por día (si es muy corto el periodo)
            dateKey = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (period === "monthly") {
            // Agrupar por semana (ej. "Semana 34")
            const weekNumber = Math.ceil((dateObj - new Date(dateObj.getFullYear(),0,1)) / 86400000 / 7);
            dateKey = `Semana ${weekNumber}`;
        } else {
            // Agrupar por mes (ej. "Agosto 2026")
            dateKey = dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        }
        
        if(!timelineCount[dateKey]) timelineCount[dateKey] = 0;
        timelineCount[dateKey]++;
    });
    renderTimelineChart(timelineCount, 'pdfTimelineChart', pdfTimelineInstance, (newInst) => { pdfTimelineInstance = newInst; });
}

function updatePdfTable() {
    if (!tablePeriod || !tableArea || !tablePlanta) return;
    const period = tablePeriod.value;
    const area = tableArea.value;
    const planta = tablePlanta.value;
    const filtered = getFilteredData(period, area, planta, currentTableData);
    
    // Sort descending
    const sortedData = [...filtered].sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga));
    renderTableDOM(sortedData, document.querySelector("#pdf-table tbody"), true);
    
    if (pdfKpiTotal) {
        // En lugar de un solo total, podríamos sumar el total de la tabla actual.
        pdfKpiTotal.textContent = filtered.length; 
    }
}

// Event Listeners
[piePeriod].forEach(el => el && el.addEventListener('change', updatePieChart));
[timelinePeriod, timelineArea, timelinePlanta].forEach(el => el && el.addEventListener('change', updateTimelineChart));
[tablePeriod, tableArea, tablePlanta].forEach(el => el && el.addEventListener('change', updatePdfTable));

function renderReport() {
    // Se llama cuando inicializa la vista
    const now = new Date();
    pdfDate.textContent = `Fecha de generación: ${now.toLocaleDateString()}`;
    pdfTitle.textContent = `Reporte Ejecutivo Service Desk`;
    
    updatePieChart();
    updateTimelineChart();
    updatePdfTable();
}

// PDF Export
btnDownloadPdf.addEventListener("click", () => {
    const element = document.getElementById('pdf-container');
    const opt = {
        margin:       0.5,
        filename:     `ServiceDesk_Reporte_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Cambiar temporalmente el botón a cargando
    const originalText = btnDownloadPdf.innerHTML;
    btnDownloadPdf.innerHTML = "Generando PDF...";
    
    html2pdf().set(opt).from(element).save().then(() => {
        btnDownloadPdf.innerHTML = originalText;
    });
});

// Excel Export
if (btnExportExcel) {
    btnExportExcel.addEventListener("click", () => {
        const period = tablePeriod.value;
        const area = tableArea.value;
        const filtered = getFilteredData(period, area, currentTableData);
        
        // Sort descending
        const sortedData = [...filtered].sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga));
        
        // Limpiar los datos para Excel
        const dataForExcel = sortedData.map(item => ({
            "MUG": item.mug,
            "Nombre": item.nombreCompleto,
            "Puesto": item.puesto,
            "Área": item.area,
            "Planta": item.planta || 'SIN PLANTA',
            "Fecha de Ingreso": item.fechaCarga
        }));

        // Crear Worksheet y Workbook
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");

        // Descargar archivo
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        XLSX.writeFile(workbook, `Usuarios_Limpios_${dateStr}.xlsx`);
    });
}

// Boot up
window.addEventListener('DOMContentLoaded', () => {
    // Set default upload date to today
    const uploadDateInput = document.getElementById('upload-date');
    if(uploadDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        uploadDateInput.value = `${year}-${month}-${day}`;
    }

    initDB().then(() => {
        updateDashboard();
    }).catch(err => {
        console.error(err);
        setStatus("Error crítico: No se pudo inicializar la base de datos local.", "error");
    });
});
