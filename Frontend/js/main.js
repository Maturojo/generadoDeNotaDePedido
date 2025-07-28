// ------------------- VARIABLES GLOBALES -------------------
let logo = null;

// ------------------- INICIALIZACIÓN -------------------
window.onload = function () {
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };

    // Ajustar fecha de hoy
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    document.getElementById('fecha').value = hoy.toISOString().split('T')[0];

    cargarProductos();
    actualizarOpcionesEntrega();
    cambiarEntrega();

    // Listeners seguros
    const adelantoInput = document.getElementById('adelanto');
    if (adelantoInput) adelantoInput.addEventListener('input', calcularTotal);

    const descuentoInput = document.getElementById('descuento');
    if (descuentoInput) {
        descuentoInput.addEventListener('input', calcularTotal);
        descuentoInput.addEventListener('click', solicitarClaveDescuento);
    }

    const tipoPagoSelect = document.getElementById('tipoPago');
    if (tipoPagoSelect) tipoPagoSelect.addEventListener('change', toggleResta);

    const generarProveedorBtn = document.getElementById("generarProveedor");
    if (generarProveedorBtn) generarProveedorBtn.addEventListener("click", generarNotaProveedor);

    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function (e) {
            formatearTelefono(e);
            validarTelefonoEnTiempoReal();
        });
    }

    // Listener para la primera fila
    const primeraFila = document.querySelector('#detalles .row');
    if (primeraFila) agregarListenersFila(primeraFila);

    toggleResta();
    calcularTotal(); // Calcular total al cargar
};

// ------------------- FORMATEAR Y VALIDAR TELÉFONO -------------------
function formatearTelefono(e) {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 3 && input.length <= 6) {
        e.target.value = `(${input.slice(0, 3)}) ${input.slice(3)}`;
    } else if (input.length > 6) {
        e.target.value = `(${input.slice(0, 3)}) ${input.slice(3, 6)} ${input.slice(6, 10)}`;
    } else {
        e.target.value = input;
    }
}

// ------------------- LISTENERS DE PRECIO Y CANTIDAD -------------------
function agregarListenersFila(row) {
    const precioInput = row.querySelector('.precio');
    const cantidadInput = row.querySelector('.cantidad');
    if (precioInput) precioInput.addEventListener('input', calcularTotal);
    if (cantidadInput) cantidadInput.addEventListener('input', calcularTotal);
}

// ------------------- AGREGAR FILAS -------------------
function agregarFilaProducto() {
    const detalles = document.getElementById('detalles');
    const filaHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <select class="form-control producto-select" name="producto[]">
                    <option value="">Seleccione un producto</option>
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control cantidad" name="cantidad[]" placeholder="Cant." value="1" min="1">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control precio" name="importe[]" placeholder="Precio">
            </div>
            <div class="col-md-2">
                <input type="checkbox" class="form-check-input precio-especial" title="Precio especial">
                <label class="form-check-label">Especial</label>
            </div>
        </div>`;
    detalles.insertAdjacentHTML('beforeend', filaHTML);

    const nuevaFila = detalles.lastElementChild;
    agregarListenersFila(nuevaFila);
    actualizarSelects();
    inicializarSelect2();
    habilitarProductoPersonalizado();
}

// ------------------- CALCULO DE TOTALES -------------------
function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#detalles .row').forEach(row => {
        const precio = parseFloat(row.querySelector('.precio')?.value) || 0;
        const cantidad = parseInt(row.querySelector('.cantidad')?.value) || 0;
        total += precio * cantidad;
    });

    const descuento = parseFloat(document.getElementById('descuento')?.value) || 0;
    total = Math.max(total - descuento, 0);

    const totalInput = document.getElementById('total');
    if (totalInput) totalInput.value = total.toFixed(2);

    const adelanto = parseFloat(document.getElementById('adelanto')?.value) || 0;
    const tipoPago = document.getElementById('tipoPago')?.value;

    const restaInput = document.getElementById('resta');
    if (restaInput) {
        if (tipoPago === "Pago completo") {
            restaInput.value = 0;
        } else {
            restaInput.value = (total - adelanto).toFixed(2);
        }
    }
}

function toggleResta() {
    const tipoPago = document.getElementById('tipoPago')?.value;
    const restaCol = document.getElementById('resta-col');
    if (restaCol) {
        restaCol.style.display = (tipoPago === "Pago completo") ? "none" : "block"; 
    }
    calcularTotal();
}

// ------------------- FECHAS DE ENTREGA -------------------
function sumarDiasHabiles(fecha, diasHabiles) {
    let contador = 0;
    let fechaTemp = new Date(fecha);
    while (contador < diasHabiles) {
        fechaTemp.setDate(fechaTemp.getDate() + 1);
        let dia = fechaTemp.getDay();
        if (dia !== 0 && dia !== 6) contador++;
    }
    return fechaTemp;
}

function formatearFecha(fecha) {
    let dia = fecha.getDate().toString().padStart(2, '0');
    let mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    let anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function actualizarOpcionesEntrega() {
    const hoy = new Date();
    const fecha15 = formatearFecha(sumarDiasHabiles(hoy, 15));
    const fecha20 = formatearFecha(sumarDiasHabiles(hoy, 20));

    const opcion15 = document.querySelector('#opcionEntrega option[value="15"]');
    const opcion20 = document.querySelector('#opcionEntrega option[value="20"]');
    if (opcion15) opcion15.textContent = `15 días hábiles (${fecha15})`;
    if (opcion20) opcion20.textContent = `20 días hábiles (${fecha20})`;
}

function cambiarEntrega() {
    const opcion = document.getElementById('opcionEntrega')?.value;
    const inputFecha = document.getElementById('fechaEntrega');
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());

    if (opcion === "especial") {
        inputFecha.style.display = "block";
        inputFecha.value = "";
    } else {
        inputFecha.style.display = "block";
        const dias = parseInt(opcion);
        const fechaEntrega = sumarDiasHabiles(hoy, dias);
        fechaEntrega.setMinutes(fechaEntrega.getMinutes() - fechaEntrega.getTimezoneOffset());
        inputFecha.value = fechaEntrega.toISOString().split('T')[0];
    }
}

// ------------------- VALIDACIÓN -------------------
function validarCampos() {
    const camposObligatorios = ['fecha', 'fechaEntrega', 'seniores', 'telefono', 'vendedor', 'transferidoA', 'tipoPago'];
    for (let campo of camposObligatorios) {
        let valor = document.getElementById(campo)?.value.trim();
        if (!valor) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo incompleto',
                text: `Por favor, complete el campo: ${campo}`,
                confirmButtonText: 'Aceptar'
            });
            return false;
        }
    }
    const telefono = document.getElementById('telefono')?.value.trim();
    const telefonoRegex = /^\(\d{3}\)\s\d{3}\s\d{4}$/;
    if (!telefonoRegex.test(telefono)) {
        Swal.fire({
            icon: 'error',
            title: 'Teléfono inválido',
            text: 'Por favor, ingrese un teléfono válido con formato (223) 595 4195.',
            confirmButtonText: 'Aceptar'
        });
        return false;
    }
    return true;
}

// ------------------- ENVIAR POR WHATSAPP -------------------
function verNotas() {
    window.location.href = '/pages/notas.html';
}
