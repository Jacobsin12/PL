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

window.RH.highlightFilledInputs = function(container) {
    if (!container) return;
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        if (el.type === 'hidden' || el.type === 'button' || el.type === 'submit') return;
        const val = (el.value || '').trim();
        if (val !== '') {
            el.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; // Verde suave iluminado
            el.style.border = '1px solid #10b981';
            el.style.boxShadow = '0 0 4px rgba(16, 185, 129, 0.25)';
        } else {
            el.style.backgroundColor = '';
            el.style.border = '';
            el.style.boxShadow = '';
        }
    });
};

// Delegación global para asegurar mayúsculas y resaltado en tiempo real en todos los formularios
document.addEventListener('input', function(e) {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        const type = (target.getAttribute('type') || 'text').toLowerCase();
        
        // Lógica de mayúsculas y limpieza
        if (target.tagName !== 'SELECT' && (type === 'text' || type === 'search' || target.tagName === 'TEXTAREA')) {
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

        // Lógica de Color (Feedback Visual)
        if (target.closest('.excel-grid, #form-empleado, #modal-empleado')) {
            if (target.value.trim() !== '') {
                target.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; // Verde suave iluminado
                target.style.border = '1px solid #10b981';
                target.style.boxShadow = '0 0 4px rgba(16, 185, 129, 0.25)';
            } else {
                target.style.backgroundColor = ''; // Restablecer
                target.style.border = ''; // Restablecer
                target.style.boxShadow = ''; // Restablecer
            }

            // Verificar si la fila completa está lista en tablas múltiples
            const tr = target.closest('tr');
            if (tr) {
                const requireds = tr.querySelectorAll('input[required], select[required]');
                let allFilled = true;
                requireds.forEach(req => {
                    if(req.value.trim() === '') allFilled = false;
                });
                
                const rowNum = tr.querySelector('.row-number');
                if (rowNum) {
                    if (allFilled && requireds.length > 0) {
                        rowNum.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        rowNum.style.color = '#047857';
                    } else {
                        rowNum.style.backgroundColor = '';
                        rowNum.style.color = '';
                    }
                }
            }
        }
    }
});

// También escuchar change para los selects
document.addEventListener('change', function(e) {
    if (e.target && e.target.tagName === 'SELECT') {
        // Disparar manualmente el evento input para que corra la misma lógica
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
window.RH.initDashboard = async function() {
    window.RH.updateDOM();

    const mugEl = document.getElementById('mug');
    if (mugEl) mugEl.removeAttribute('required');
    const nomEl = document.getElementById('numero_nomina');
    if (nomEl) nomEl.removeAttribute('required');

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
