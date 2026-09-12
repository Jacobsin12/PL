async function initDashboard() {
    // Elementos del DOM
    const btnLogout = document.getElementById('btn-logout');
    const btnNuevoEmpleado = document.getElementById('btn-nuevo-empleado');
    const modalEmpleado = document.getElementById('modal-empleado');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formEmpleado = document.getElementById('form-empleado');
    const tableBody = document.querySelector('#empleados-table tbody');
    const searchInput = document.getElementById('search-input');
    const modalTitle = document.getElementById('modal-title');

    // Elementos inline bulk
    const btnNuevoMultiple = document.getElementById('btn-nuevo-multiple');
    const inlineBulkContainer = document.getElementById('inline-bulk-container');
    const btnCancelarInline = document.getElementById('btn-cancelar-inline');
    const btnGuardarInline = document.getElementById('btn-guardar-inline');
    const formBulk = document.getElementById('form-bulk');
    const bulkTbody = document.getElementById('bulk-tbody');

    // Elementos modal nÃºmero de filas
    const modalNumFilas = document.getElementById('modal-num-filas');
    const inputNumFilas = document.getElementById('num-filas');
    const btnCloseNum = document.getElementById('btn-close-num');
    const btnCancelarNum = document.getElementById('btn-cancelar-num');
    const btnConfirmarNum = document.getElementById('btn-confirmar-num');



    // Altas
    const altasTbody = document.getElementById('altas-tbody');
    const searchAltas = document.getElementById('search-altas');
    const altasCargasView = document.getElementById('altas-cargas-view');
    const altasGeneralView = document.getElementById('altas-general-view');
    const viewModeBtns = document.querySelectorAll('.view-mode-btn');

    let empleadosData = [];
    let catalogosData = { plantas: [], areas: [], tipos: [] };
    let altasViewMode = 'cargas'; // 'cargas' or 'general'

    // ============================================
    // VALIDAR SESIÃ“N
    // ============================================
    const isLogged = await window.checkSession(true);
    if (isLogged) {
        window.setupLogout('btn-logout');
        loadCatalogos();
        loadEmpleados();
    }

    // ============================================
    // CATÃLOGOS
    // ============================================
    async function loadCatalogos() {
        try {
            const res = await fetch('../back/api/api_catalogos.php');
            const json = await res.json();
            if(json.status === 'success') {
                catalogosData = json.data;
                populateSelect('id_planta', json.data.plantas, 'id_planta', 'nombre_completo');
                populateSelect('id_area', json.data.areas, 'id_area', 'nombre_area');
                populateSelect('id_tipo', json.data.tipos, 'id_tipo', 'descripcion');
            }
        } catch(e) {
            console.error("Error al cargar catÃ¡logos", e);
        }
    }

    function populateSelect(selectId, dataArray, valProp, textProp) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione una opciÃ³n...</option>';
        dataArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valProp];
            option.textContent = item[textProp];
            select.appendChild(option);
        });
    }

    // ============================================
    // CARGAR EMPLEADOS
    // ============================================
    async function loadEmpleados() {
        try {
            const res = await fetch('../back/api/api_empleados.php');
            const json = await res.json();
            if(json.status === 'success') {
                empleadosData = json.data;
                renderTable(empleadosData);
                refreshAltas();
            }
        } catch(e) {
            console.error("Error al cargar empleados", e);
        }
    }

    // ============================================
    // TABLA DIRECTORIO
    // ============================================
    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.mug}</strong></td>
                <td>${emp.numero_nomina}</td>
                <td>${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}</td>
                <td><span class="badge" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--card-border);">${emp.puesto}</span></td>
                <td><span style="color:#2563eb; font-weight:600;">${emp.nombre_area || ''}</span></td>
                <td><span style="color:#059669; font-weight:500;">${emp.nombre_planta || ''}</span></td>
                <td class="actions-cell">
                    <button class="btn-edit" onclick="editEmpleado(${emp.id_ingreso})" title="Editar">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete" onclick="deleteEmpleado(${emp.id_ingreso})" title="Eliminar">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ============================================
    // ALTAS - VIEW MODES
    // ============================================
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            altasViewMode = btn.dataset.mode;
            switchAltasView(altasViewMode);
            refreshAltas();
        });
    });

    function switchAltasView(mode) {
        if (mode === 'cargas') {
            altasCargasView.style.display = '';
            altasGeneralView.style.display = 'none';
        } else {
            altasCargasView.style.display = 'none';
            altasGeneralView.style.display = '';
        }
    }

    function refreshAltas() {
        const term = searchAltas ? searchAltas.value.toLowerCase() : '';
        let data = empleadosData;
        if (term) {
            data = data.filter(emp =>
                emp.mug.toLowerCase().includes(term) ||
                emp.nombre.toLowerCase().includes(term) ||
                emp.apellido_paterno.toLowerCase().includes(term)
            );
        }
        renderAltasCargas(data);
        renderAltasGeneral(data);
    }

    // ============================================
    // ALTAS - VISTA "POR CARGAS" (agrupado por fecha_registro)
    // ============================================
    function getDateKey(dateStr) {
        if (!dateStr) return 'Sin fecha';
        const d = new Date(dateStr);
        if (isNaN(d)) return 'Sin fecha';
        return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
    }

    function formatDateLabel(dateKey) {
        if (dateKey === 'Sin fecha') return 'Sin fecha de registro';
        const d = new Date(dateKey + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const label = d.toLocaleDateString('es-MX', options);
        // Capitalizar primera letra
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function renderAltasCargas(data) {
        if (!altasCargasView) return;
        altasCargasView.innerHTML = '';

        // Agrupar por fecha_registro (solo la parte de la fecha)
        const groups = {};
        data.forEach(emp => {
            const key = getDateKey(emp.fecha_registro);
            if (!groups[key]) groups[key] = [];
            groups[key].push(emp);
        });

        // Ordenar las claves de mÃ¡s reciente a mÃ¡s antigua
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Sin fecha') return 1;
            if (b === 'Sin fecha') return -1;
            return b.localeCompare(a);
        });

        if (sortedKeys.length === 0) {
            altasCargasView.innerHTML = `
                <div class="altas-empty">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <p>No hay registros de altas aÃºn</p>
                </div>
            `;
            return;
        }

        sortedKeys.forEach((key, idx) => {
            const emps = groups[key];
            const block = document.createElement('div');
            block.className = 'carga-block';
            block.style.animationDelay = `${idx * 100}ms`;

            // Header
            const header = document.createElement('div');
            header.className = 'carga-block-header';
            header.innerHTML = `
                <div class="carga-block-title">
                    <h4>${formatDateLabel(key)}</h4>
                    <span class="carga-badge">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        ${emps.length} ${emps.length === 1 ? 'ingreso' : 'ingresos'}
                    </span>
                    <button class="btn-export-carga" title="Exportar esta carga a Excel" style="background: none; border: none; color: #059669; cursor: pointer; padding: 0.2rem; display: flex; align-items: center; margin-left: 0.5rem;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </button>
                </div>
                <svg class="carga-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
            `;
            
            // Event listener for the Excel export button
            const btnExport = header.querySelector('.btn-export-carga');
            btnExport.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent toggling the accordion
                exportToExcel(emps, `Reporte_Carga_${key}`);
            });

            header.addEventListener('click', () => {
                block.classList.toggle('collapsed');
            });

            // Body (table)
            const body = document.createElement('div');
            body.className = 'carga-block-body';

            let tableHTML = `
                <div class="table-responsive">
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">MUG</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">NÃ³mina</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Nombre Completo</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Puesto</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Jefe Directo</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Ãrea</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Planta</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Tipo Ingreso</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Fecha Ingreso</th>
                                <th style="padding: 0.6rem 1rem; text-align:left; font-size:0.8rem; color:var(--text-muted); border-bottom: 1px solid var(--card-border);">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            emps.forEach(emp => {
                tableHTML += `
                    <tr>
                        <td style="padding: 0.6rem 1rem;"><strong>${emp.mug}</strong></td>
                        <td style="padding: 0.6rem 1rem;">${emp.numero_nomina}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.puesto}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.jefe_directo || ''}</td>
                        <td style="padding: 0.6rem 1rem;"><span style="color:#2563eb; font-weight:600;">${emp.nombre_area || ''}</span></td>
                        <td style="padding: 0.6rem 1rem;"><span style="color:#059669; font-weight:500;">${emp.nombre_planta || ''}</span></td>
                        <td style="padding: 0.6rem 1rem;">${emp.tipo_ingreso_desc || ''}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : ''}</td>
                        <td style="padding: 0.6rem 1rem;">${emp.fecha_registro ? emp.fecha_registro.split(' ')[0] : ''}</td>
                    </tr>
                `;
            });
            tableHTML += '</tbody></table></div>';
            body.innerHTML = tableHTML;

            block.appendChild(header);
            block.appendChild(body);
            altasCargasView.appendChild(block);
        });
    }

    // ============================================
    // ALTAS - VISTA "GENERAL" (tabla plana)
    // ============================================
    function renderAltasGeneral(data) {
        if (!altasTbody) return;
        altasTbody.innerHTML = '';
        const sorted = [...data].sort((a, b) => {
            const da = new Date(a.fecha_registro || 0);
            const db = new Date(b.fecha_registro || 0);
            return db - da;
        });
        sorted.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.mug}</strong></td>
                <td>${emp.numero_nomina}</td>
                <td>${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}</td>
                <td>${emp.puesto}</td>
                <td>${emp.jefe_directo || ''}</td>
                <td><span style="color:#2563eb; font-weight:600;">${emp.nombre_area || ''}</span></td>
                <td><span style="color:#059669; font-weight:500;">${emp.nombre_planta || ''}</span></td>
                <td>${emp.tipo_ingreso_desc || ''}</td>
                <td>${emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : ''}</td>
                <td>${emp.fecha_registro ? emp.fecha_registro.split(' ')[0] : ''}</td>
            `;
            altasTbody.appendChild(tr);
        });
    }

    // ============================================
    // BÃšSQUEDA DIRECTORIO
    // ============================================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = empleadosData.filter(emp => 
                emp.mug.toLowerCase().includes(term) || 
                emp.nombre.toLowerCase().includes(term) ||
                emp.apellido_paterno.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });
    }

    // ============================================
    // BÃšSQUEDA ALTAS
    // ============================================
    if (searchAltas) {
        searchAltas.addEventListener('input', () => {
            refreshAltas();
        });
    }

    // ============================================
    // MODAL EMPLEADO INDIVIDUAL (Nuevo / Editar)
    // ============================================
    function openModal() {
        modalEmpleado.classList.add('show');
    }
    
    function closeModal() {
        modalEmpleado.classList.remove('show');
        formEmpleado.reset();
        document.getElementById('id_ingreso').value = '';
        modalTitle.textContent = "Nuevo Empleado";
    }

    if (btnNuevoEmpleado) btnNuevoEmpleado.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelar) btnCancelar.addEventListener('click', closeModal);

    formEmpleado.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(formEmpleado);
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
                closeModal();
                loadEmpleados();
            } else {
                alert("Error: " + json.message);
            }
        } catch(e) {
            console.error(e);
            alert("Error de red");
        }
    });

    // ============================================
    // INGRESO MÃšLTIPLE - FLUJO INLINE
    // ============================================

    // Paso 1: Clic en "Ingreso MÃºltiple" â†’ mostrar modal pequeÃ±o
    function openNumModal() {
        modalNumFilas.classList.add('show');
        inputNumFilas.focus();
    }

    function closeNumModal() {
        modalNumFilas.classList.remove('show');
    }

    if (btnNuevoMultiple) btnNuevoMultiple.addEventListener('click', openNumModal);
    if (btnCloseNum) btnCloseNum.addEventListener('click', closeNumModal);
    if (btnCancelarNum) btnCancelarNum.addEventListener('click', closeNumModal);

    // Paso 2: Confirmar nÃºmero â†’ cerrar modal, mostrar grid inline con animaciÃ³n
    if (btnConfirmarNum) {
        btnConfirmarNum.addEventListener('click', () => {
            const num = parseInt(inputNumFilas.value) || 1;
            closeNumModal();
            showInlineBulk(num);
        });
    }

    // TambiÃ©n permitir Enter en el input
    if (inputNumFilas) {
        inputNumFilas.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const num = parseInt(inputNumFilas.value) || 1;
                closeNumModal();
                showInlineBulk(num);
            }
        });
    }

    function buildOptions(dataArray, valProp, textProp) {
        let html = '<option value="">Seleccionar...</option>';
        dataArray.forEach(item => {
            html += `<option value="${item[valProp]}">${item[textProp]}</option>`;
        });
        return html;
    }

    function showInlineBulk(numRows) {
        // Mostrar contenedor
        inlineBulkContainer.style.display = 'block';
        // Reset animation
        inlineBulkContainer.style.animation = 'none';
        inlineBulkContainer.offsetHeight; // trigger reflow
        inlineBulkContainer.style.animation = '';

        bulkTbody.innerHTML = '';
        
        const optsPlanta = buildOptions(catalogosData.plantas, 'id_planta', 'nombre_completo');
        const optsArea = buildOptions(catalogosData.areas, 'id_area', 'nombre_area');
        const optsTipo = buildOptions(catalogosData.tipos, 'id_tipo', 'descripcion');

        for (let i = 0; i < numRows; i++) {
            const tr = document.createElement('tr');
            // Staggered animation delay
            tr.style.animationDelay = `${i * 60}ms`;
            tr.innerHTML = `
                <td class="row-number">${i + 1}</td>
                <td><input type="text" name="mug[]" required placeholder="MUG"></td>
                <td><input type="text" name="numero_nomina[]" required placeholder="NÃ³mina"></td>
                <td><input type="text" name="nombre[]" required placeholder="Nombre"></td>
                <td><input type="text" name="apellido_paterno[]" required placeholder="Ap. Paterno"></td>
                <td><input type="text" name="apellido_materno[]" required placeholder="Ap. Materno"></td>
                <td><input type="text" name="puesto[]" required placeholder="Puesto"></td>
                <td><input type="text" name="jefe_directo[]" placeholder="Jefe"></td>
                <td><select name="id_planta[]" required>${optsPlanta}</select></td>
                <td><select name="id_area[]" required>${optsArea}</select></td>
                <td><select name="id_tipo[]" required>${optsTipo}</select></td>
                <td><input type="date" name="fecha_ingreso[]" required></td>
            `;
            bulkTbody.appendChild(tr);
            attachInputValidations(tr);
        }

        // Scroll to the grid
        inlineBulkContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function attachInputValidations(container) {
        const attachHandler = (selector, type) => {
            const inputs = container.querySelectorAll(selector);
            inputs.forEach(inp => {
                inp.addEventListener('input', (e) => {
                    let val = e.target.value;
                    if (type === 'numeric') {
                        val = val.replace(/[^0-9]/g, '');
                    } else if (type === 'alphanumeric') {
                        val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    } else if (type === 'alpha_upper') {
                        val = val.replace(/[0-9]/g, '').toUpperCase();
                    }
                    e.target.value = val;
                });
            });
        };

        attachHandler('input[name="numero_nomina"], input[name="numero_nomina[]"]', 'numeric');
        attachHandler('input[name="mug"], input[name="mug[]"]', 'alphanumeric');
        attachHandler('input[name="nombre"], input[name="nombre[]"], input[name="apellido_paterno"], input[name="apellido_paterno[]"], input[name="apellido_materno"], input[name="apellido_materno[]"], input[name="puesto"], input[name="puesto[]"], input[name="jefe_directo"], input[name="jefe_directo[]"]', 'alpha_upper');
    }
    
    // Attach validations to individual modal
    attachInputValidations(document.getElementById('form-empleado'));

    function hideInlineBulk() {
        inlineBulkContainer.style.display = 'none';
        bulkTbody.innerHTML = '';
        if (formBulk) formBulk.reset();
    }

    if (btnCancelarInline) btnCancelarInline.addEventListener('click', hideInlineBulk);

    // Paso 3: Guardar todos los registros
    if (btnGuardarInline) {
        btnGuardarInline.addEventListener('click', async () => {
            const formData = new FormData(formBulk);
            const rowsCount = bulkTbody.querySelectorAll('tr').length;
            
            if (rowsCount === 0) return alert("No hay filas para guardar.");

            // Validar campos required manualmente
            const requiredInputs = formBulk.querySelectorAll('[required]');
            let allValid = true;
            requiredInputs.forEach(inp => {
                if (!inp.value) {
                    inp.style.boxShadow = 'inset 0 0 0 2px #ef4444';
                    allValid = false;
                } else {
                    inp.style.boxShadow = '';
                }
            });
            if (!allValid) return alert("Por favor completa todos los campos obligatorios.");

            const bulkData = [];
            const getArr = (name) => formData.getAll(name);
            
            const mugs = getArr('mug[]');
            const nominas = getArr('numero_nomina[]');
            const nombres = getArr('nombre[]');
            const apePat = getArr('apellido_paterno[]');
            const apeMat = getArr('apellido_materno[]');
            const puestos = getArr('puesto[]');
            const jefes = getArr('jefe_directo[]');
            const plantas = getArr('id_planta[]');
            const areas = getArr('id_area[]');
            const tipos = getArr('id_tipo[]');
            const fechas = getArr('fecha_ingreso[]');

            for (let i = 0; i < rowsCount; i++) {
                bulkData.push({
                    mug: mugs[i],
                    numero_nomina: nominas[i],
                    nombre: nombres[i],
                    apellido_paterno: apePat[i],
                    apellido_materno: apeMat[i],
                    puesto: puestos[i],
                    jefe_directo: jefes[i] || null,
                    id_planta: plantas[i],
                    id_area: areas[i],
                    id_tipo: tipos[i],
                    fecha_ingreso: fechas[i]
                });
            }

            const originalText = btnGuardarInline.innerHTML;
            btnGuardarInline.disabled = true;
            btnGuardarInline.innerHTML = 'Guardando...';

            try {
                const res = await fetch('../back/api/api_empleados.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bulkData)
                });
                
                const json = await res.json();
                if (json.status === 'success') {
                    hideInlineBulk();
                    loadEmpleados();
                    alert(json.message);
                } else {
                    alert("Error: " + json.message);
                }
            } catch (error) {
                console.error(error);
                alert("Error de red al guardar mÃºltiple");
            }
            
            btnGuardarInline.disabled = false;
            btnGuardarInline.innerHTML = originalText;
        });
    }

    // ============================================
    // FUNCIONES GLOBALES (onclick en HTML)
    // ============================================
    // ============================================
    // EXPORTAR A EXCEL (ALTAS)
    // ============================================
    async function exportToExcel(data, filename) {
        if (typeof ExcelJS === 'undefined') {
            alert('La librerÃ­a ExcelJS no se ha cargado.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Altas');

        // 1. Agregar tÃ­tulo y estilo
        worksheet.mergeCells('A1:J2');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Reporte de Nuevos Ingresos (Altas)';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' } // Dark blue
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // 2. Definir encabezados
        worksheet.getRow(4).values = [
            'MUG', 'NÃ³mina', 'Nombre Completo', 'Puesto', 'Jefe Directo',
            'Ãrea', 'Planta', 'Tipo Ingreso', 'Fecha Ingreso', 'Fecha Registro'
        ];
        
        const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell((cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563EB' } // Primary blue
            };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
            };
        });

        // Set column widths
        worksheet.columns = [
            { width: 15 }, // MUG
            { width: 12 }, // Nomina
            { width: 35 }, // Nombre
            { width: 25 }, // Puesto
            { width: 25 }, // Jefe
            { width: 25 }, // Area
            { width: 20 }, // Planta
            { width: 15 }, // Tipo
            { width: 15 }, // F. Ingreso
            { width: 20 }, // F. Registro
        ];

        // 4. Agregar filas
        data.forEach(emp => {
            const row = worksheet.addRow([
                emp.mug,
                emp.numero_nomina,
                `${emp.nombre} ${emp.apellido_paterno} ${emp.apellido_materno}`,
                emp.puesto,
                emp.jefe_directo || '',
                emp.nombre_area || '',
                emp.nombre_planta || '',
                emp.tipo_ingreso_desc || '',
                emp.fecha_ingreso ? emp.fecha_ingreso.split(' ')[0] : '',
                emp.fecha_registro ? emp.fecha_registro.split(' ')[0] : ''
            ]);
            row.eachCell(cell => {
                cell.border = {
                    top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
                };
            });
        });

        const downloadExcel = async () => {
            const buffer = await workbook.xlsx.writeBuffer();
            const blobOut = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blobOut);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        };

        // 5. Agregar logo
        try {
            const response = await fetch('assets/images/Safran-logo.png');
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.readAsDataURL(blob); 
                reader.onloadend = async function() {
                    const base64data = reader.result;
                    const imageId = workbook.addImage({
                        base64: base64data,
                        extension: 'png',
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: 0 },
                        ext: { width: 120, height: 40 }
                    });
                    await downloadExcel();
                }
            } else {
                await downloadExcel();
            }
        } catch(e) {
            console.error("Error agregando logo al excel", e);
            await downloadExcel();
        }
    }

    window.editEmpleado = (id) => {
        const emp = empleadosData.find(e => e.id_ingreso == id);
        if(emp) {
            modalTitle.textContent = "Editar Empleado";
            document.getElementById('id_ingreso').value = emp.id_ingreso;
            document.getElementById('mug').value = emp.mug;
            document.getElementById('numero_nomina').value = emp.numero_nomina;
            document.getElementById('nombre').value = emp.nombre;
            document.getElementById('apellido_paterno').value = emp.apellido_paterno;
            document.getElementById('apellido_materno').value = emp.apellido_materno;
            document.getElementById('puesto').value = emp.puesto;
            document.getElementById('jefe_directo').value = emp.jefe_directo || '';
            document.getElementById('id_planta').value = emp.id_planta;
            document.getElementById('id_area').value = emp.id_area;
            document.getElementById('id_tipo').value = emp.id_tipo;
            document.getElementById('fecha_ingreso').value = emp.fecha_ingreso;
            openModal();
        }
    };

    window.deleteEmpleado = async (id) => {
        if(confirm("Â¿EstÃ¡s seguro de que deseas eliminar este empleado?")) {
            try {
                const res = await fetch('../back/api/api_empleados.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_ingreso: id })
                });
                const json = await res.json();
                if (json.status === 'success') {
                    loadEmpleados();
                } else {
                    alert("Error: " + json.message);
                }
            } catch(e) {
                console.error(e);
            }
        }
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
