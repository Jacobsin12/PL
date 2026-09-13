window.RH = window.RH || {};
window.RH.empleadosData = [];
window.RH.catalogosData = { plantas: [], areas: [], tipos: [] };
window.RH.altasViewMode = 'cargas';

// ============================================
// DOM ELEMENTS (Core)
// ============================================
window.RH.DOM = {};

window.RH.updateDOM = function() {
    window.RH.DOM = {
        btnLogout: document.getElementById('btn-logout'),
        btnNuevoEmpleado: document.getElementById('btn-nuevo-empleado'),
        modalEmpleado: document.getElementById('modal-empleado'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        btnCancelar: document.getElementById('btn-cancelar'),
        formEmpleado: document.getElementById('form-empleado'),
        tableBody: document.querySelector('#empleados-table tbody'),
        searchInput: document.getElementById('search-input') || document.getElementById('rh-search-input'),
        modalTitle: document.getElementById('modal-title'),
        
        // Multiple
        btnNuevoMultiple: document.getElementById('btn-nuevo-multiple'),
        inlineBulkContainer: document.getElementById('inline-bulk-container'),
        btnCancelarInline: document.getElementById('btn-cancelar-inline'),
        btnGuardarInline: document.getElementById('btn-guardar-inline'),
        formBulk: document.getElementById('form-bulk'),
        bulkTbody: document.getElementById('bulk-tbody'),
        modalNumFilas: document.getElementById('modal-num-filas'),
        inputNumFilas: document.getElementById('num-filas'),
        btnCloseNum: document.getElementById('btn-close-num'),
        btnCancelarNum: document.getElementById('btn-cancelar-num'),
        btnConfirmarNum: document.getElementById('btn-confirmar-num'),
        
        // Altas
        altasTbody: document.getElementById('altas-tbody'),
        searchAltas: document.getElementById('search-altas') || document.getElementById('altas-search-input'),
        altasCargasView: document.getElementById('altas-cargas-view') || document.getElementById('cargas-container'),
        altasGeneralView: document.getElementById('altas-general-view') || document.getElementById('general-table-container'),
        viewModeBtns: document.querySelectorAll('.view-mode-btn, .toggle-btn')
    };
};

// ============================================
// CATÁLOGOS
// ============================================
window.RH.loadCatalogos = async function() {
    try {
        const res = await fetch('../back/api/api_catalogos.php');
        const json = await res.json();
        if(json.status === 'success') {
            window.RH.catalogosData = json.data;
            window.RH.populateSelect('id_planta', json.data.plantas, 'id_planta', 'nombre_completo');
            window.RH.populateSelect('id_area', json.data.areas, 'id_area', 'nombre_area');
            window.RH.populateSelect('id_tipo', json.data.tipos, 'id_tipo', 'descripcion');
        }
    } catch(e) {
        console.error("Error al cargar catálogos", e);
    }
};

window.RH.populateSelect = function(selectId, dataArray, valProp, textProp) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione una opción...</option>';
    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valProp];
        option.textContent = item[textProp];
        select.appendChild(option);
    });
};

// ============================================
// CARGAR EMPLEADOS GLOBALES
// ============================================
window.RH.loadEmpleados = async function() {
    try {
        const res = await fetch('../back/api/api_empleados.php');
        const json = await res.json();
        if(json.status === 'success') {
            window.RH.empleadosData = json.data;
            if (window.RH.renderTable) window.RH.renderTable(window.RH.empleadosData);
            if (window.RH.refreshAltas) window.RH.refreshAltas();
        }
    } catch(e) {
        console.error("Error al cargar empleados", e);
    }
};

window.RH.attachInputValidations = function(container) {
    if (!container) return;
    const inputs = container.querySelectorAll('input[type="text"], input:not([type]), textarea');
    inputs.forEach(inp => {
        inp.addEventListener('input', (e) => {
            let val = e.target.value;
            if (e.target.name === 'numero_nomina' || e.target.name === 'numero_nomina[]') {
                val = val.replace(/[^0-9]/g, '');
            } else {
                val = val.toUpperCase();
            }
            if (e.target.value !== val) {
                e.target.value = val;
            }
        });
    });
};

// Delegación global para asegurar mayúsculas en tiempo real en todos los formularios de ingreso (individual y múltiple)
document.addEventListener('input', function(e) {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const type = (target.getAttribute('type') || 'text').toLowerCase();
        if (type === 'text' || type === 'search') {
            const container = target.closest('#form-empleado, #form-bulk, #inline-bulk-container, .modal-content, .table-multiple');
            if (container) {
                if (target.name === 'numero_nomina' || target.name === 'numero_nomina[]') {
                    const clean = target.value.replace(/[^0-9]/g, '');
                    if (target.value !== clean) target.value = clean;
                } else {
                    const upper = target.value.toUpperCase();
                    if (target.value !== upper) target.value = upper;
                }
            }
        }
    }
});

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
window.RH.initDashboard = async function() {
    window.RH.updateDOM();
    const isLogged = await window.checkSession(true);
    if (isLogged) {
        window.setupLogout('btn-logout');
        
        window.RH.loadCatalogos();
        window.RH.loadEmpleados();
        
        // Disparar inits secundarios si existen
        if(window.RH.initDirectorio) window.RH.initDirectorio();
        if(window.RH.initAltas) window.RH.initAltas();
        if(window.RH.initMultiple) window.RH.initMultiple();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.RH.initDashboard);
} else {
    window.RH.initDashboard();
}
