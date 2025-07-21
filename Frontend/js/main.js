// ------------------- VARIABLES GLOBALES -------------------
let productos = [];
let logo = null;

// ------------------- INICIALIZACIÓN -------------------
window.onload = function () {
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };

    const hoy = new Date();
    document.getElementById('fecha').value = hoy.toISOString().split('T')[0];

    cargarProductos();
    actualizarOpcionesEntrega();
    cambiarEntrega();

    document.getElementById('sena').addEventListener('input', calcularTotal);
    document.getElementById('descuento').addEventListener('input', calcularTotal);
    document.getElementById('tipoPago').addEventListener('change', toggleResta);
    document.getElementById('descuento').addEventListener('click', solicitarClaveDescuento);

    const telefonoInput = document.getElementById('telefono');
    telefonoInput.addEventListener('input', function (e) {
        formatearTelefono(e);
        validarTelefonoEnTiempoReal();
    });

    agregarListenersFila(document.querySelector('#detalles .row'));
    toggleResta();
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

function validarTelefonoEnTiempoReal() {
    const telefonoInput = document.getElementById('telefono');
    const errorTelefono = document.getElementById('error-telefono');
    const telefonoRegex = /^\(\d{3}\)\s\d{3}\s\d{4}$/;

    if (telefonoRegex.test(telefonoInput.value.trim())) {
        telefonoInput.classList.remove('is-invalid');
        telefonoInput.classList.add('is-valid');
        errorTelefono.style.display = 'none';
    } else {
        telefonoInput.classList.remove('is-valid');
        telefonoInput.classList.add('is-invalid');
        errorTelefono.style.display = 'block';
    }
}

// ------------------- CARGA DE PRODUCTOS -------------------
async function cargarProductos() {
    try {
        const response = await fetch('https://generadodenotadepedido.onrender.com/productos');
        productos = await response.json();
        actualizarSelects();
        inicializarSelect2();
        habilitarProductoPersonalizado();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los productos. Verifique el servidor.',
            confirmButtonText: 'Aceptar'
        });
    }
}

function actualizarSelects() {
    const selects = document.querySelectorAll('.producto-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccione un producto</option>';
        productos.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.codigo;
            option.textContent = `${prod.codigo} - ${prod.detalle} ($${prod.precio})`;
            option.dataset.precio = prod.precio;
            select.appendChild(option);
        });
        const customOption = document.createElement('option');
        customOption.value = "custom";
        customOption.textContent = "Producto personalizado";
        select.appendChild(customOption);
    });
}

function inicializarSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.producto-select').select2({
            placeholder: "Seleccione o busque un producto",
            width: '100%'
        }).on('select2:select', function () {
            const selectedOption = this.options[this.selectedIndex];
            const precioInput = this.closest('.row').querySelector('.precio');
            if (selectedOption && selectedOption.dataset.precio) {
                precioInput.value = selectedOption.dataset.precio;
                calcularTotal();
            }
            mostrarInputsPersonalizados(this);
        });
    }
    habilitarProductoPersonalizado();
}

// ------------------- PRODUCTO PERSONALIZADO -------------------
function habilitarProductoPersonalizado() {
    document.querySelectorAll('.producto-select').forEach(select => {
        select.addEventListener('change', function () {
            mostrarInputsPersonalizados(this);
        });
    });
}

function mostrarInputsPersonalizados(select) {
    const fila = select.closest('.row');
    let inputCustom = fila.querySelector('.input-personalizado');
    let detalleCustom = fila.querySelector('.detalle-personalizado');

    if (select.value === 'custom') {
        if (!inputCustom) {
            const inputHTML = document.createElement('input');
            inputHTML.type = 'text';
            inputHTML.placeholder = 'Nombre del producto';
            inputHTML.className = 'form-control mt-2 input-personalizado';
            select.parentElement.appendChild(inputHTML);
        }
        if (!detalleCustom) {
            const detalleHTML = document.createElement('textarea');
            detalleHTML.placeholder = 'Detalle del producto';
            detalleHTML.className = 'form-control mt-2 detalle-personalizado';
            detalleHTML.rows = 2;
            select.parentElement.appendChild(detalleHTML);
        }
    } else {
        if (inputCustom) inputCustom.remove();
        if (detalleCustom) detalleCustom.remove();
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
        const precio = parseFloat(row.querySelector('.precio').value) || 0;
        const cantidad = parseInt(row.querySelector('.cantidad').value) || 0;
        total += precio * cantidad;
    });

    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    total = Math.max(total - descuento, 0);

    document.getElementById('total').value = total.toFixed(2);

    const sena = parseFloat(document.getElementById('sena').value) || 0;
    const tipoPago = document.getElementById('tipoPago').value;

    if (tipoPago === "Pago completo") {
        document.getElementById('resta').value = 0;
    } else {
        document.getElementById('resta').value = (total - sena).toFixed(2);
    }
}

function toggleResta() {
    const tipoPago = document.getElementById('tipoPago').value;
    const restaCol = document.getElementById('resta-col');
    restaCol.style.display = (tipoPago === "Pago completo") ? "none" : "block";
    calcularTotal();
}

// ------------------- CLAVE PARA DESCUENTO -------------------
function solicitarClaveDescuento() {
    const descuentoInput = document.getElementById('descuento');
    if (!descuentoInput.readOnly) return;

    Swal.fire({
        title: 'Clave requerida',
        input: 'password',
        inputLabel: 'Ingrese la clave para habilitar el descuento',
        inputPlaceholder: 'Clave...',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        preConfirm: (clave) => {
            return new Promise((resolve, reject) => {
                if (clave === '1234') {
                    resolve(true);
                } else {
                    reject('Clave incorrecta');
                }
            }).catch(err => {
                Swal.showValidationMessage(err);
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            descuentoInput.readOnly = false;
            descuentoInput.focus();
        }
    });
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

    document.querySelector('#opcionEntrega option[value="15"]').textContent = `15 días hábiles (${fecha15})`;
    document.querySelector('#opcionEntrega option[value="20"]').textContent = `20 días hábiles (${fecha20})`;
}

function cambiarEntrega() {
    const opcion = document.getElementById('opcionEntrega').value;
    const inputFecha = document.getElementById('fechaEntrega');
    const hoy = new Date();

    if (opcion === "especial") {
        inputFecha.style.display = "block";
        inputFecha.value = "";
    } else {
        inputFecha.style.display = "block";
        const dias = parseInt(opcion);
        const fechaEntrega = sumarDiasHabiles(hoy, dias);
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
    const telefono = document.getElementById('telefono').value.trim();
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

// ------------------- GENERAR PDF -------------------
// (Aquí continúa tu función generarPDF sin cambios)

// ------------------- CODIGO UNICO -------------------
// (Aquí continúa tu función generarCodigoUnico sin cambios)

// ------------------- ENVIAR POR WHATSAPP -------------------
// (Aquí continúa tu función enviarPorWhatsApp sin cambios)
