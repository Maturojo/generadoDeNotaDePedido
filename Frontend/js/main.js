// ------------------- VARIABLES GLOBALES -------------------
let productos = [];
let logo = null;

// ------------------- INICIALIZACIÓN -------------------
window.onload = function () {
    // Cargar logo
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };

    // Establecer fecha actual
    const hoy = new Date();
    document.getElementById('fecha').value = hoy.toISOString().split('T')[0];

    // Cargar productos y actualizar fechas
    cargarProductos();
    actualizarOpcionesEntrega();
    cambiarEntrega();

    // Listeners
    document.getElementById('sena').addEventListener('input', calcularTotal);

    // Formatear y validar teléfono mientras escribe
    const telefonoInput = document.getElementById('telefono');
    telefonoInput.addEventListener('input', function (e) {
        formatearTelefono(e);
        validarTelefonoEnTiempoReal();
    });
};

// ------------------- FORMATEAR Y VALIDAR TELÉFONO -------------------
function formatearTelefono(e) {
    let input = e.target.value.replace(/\D/g, ''); // Solo dígitos
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
        const response = await fetch('http://localhost:3000/productos');
        productos = await response.json();
        actualizarSelects();
        inicializarSelect2();
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
            }
            calcularTotal();
        });
    }
}

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
    actualizarSelects();
    inicializarSelect2();
}

// ------------------- CALCULO DE TOTALES -------------------
function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#detalles .row').forEach(row => {
        const precio = parseFloat(row.querySelector('.precio').value) || 0;
        const cantidad = parseInt(row.querySelector('.cantidad').value) || 0;
        total += precio * cantidad;
    });
    document.getElementById('total').value = total.toFixed(2);

    const sena = parseFloat(document.getElementById('sena').value) || 0;
    document.getElementById('resta').value = (total - sena).toFixed(2);
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

    // Validar formato de teléfono
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

    const filas = document.querySelectorAll('#detalles .row');
    if (filas.length === 0 || !filas[0].querySelector('.producto-select').value) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin productos',
            text: 'Por favor, ingrese al menos un producto.',
            confirmButtonText: 'Aceptar'
        });
        return false;
    }
    return true;
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

// ------------------- CODIGO UNICO -------------------
function generarCodigoUnico() {
    const hoy = new Date();
    const fecha = hoy.getFullYear().toString() +
                  String(hoy.getMonth() + 1).padStart(2, '0') +
                  String(hoy.getDate()).padStart(2, '0');
    let contador = parseInt(localStorage.getItem('contador_' + fecha) || '0') + 1;
    localStorage.setItem('contador_' + fecha, contador);
    return `${fecha}-${contador}`;
}

// ------------------- GENERAR PDF -------------------
function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fondo
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 190, 277, 'F');

    const codigoNota = generarCodigoUnico();

    // Datos
    const fecha = document.getElementById('fecha').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    const seniores = document.getElementById('seniores').value;
    const telefono = document.getElementById('telefono').value;
    const vendedor = document.getElementById('vendedor').value;
    const transferidoA = document.getElementById('transferidoA').value;
    const tipoPago = document.getElementById('tipoPago').value;
    const total = document.getElementById('total').value;
    const sena = document.getElementById('sena').value;
    const resta = document.getElementById('resta').value;

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(97, 95, 95);
    doc.text("NOTA DE PEDIDO", 60, 25);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 60, 32);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 60, 39);

    // Datos cliente
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 50);
    doc.text(`Entrega: ${fechaEntrega}`, 120, 50);
    doc.text(`Señores: ${seniores}`, 20, 58);
    doc.text(`Teléfono: ${telefono}`, 20, 66);
    doc.text(`Vendedor: ${vendedor}`, 20, 74);
    doc.text(`Transferido a: ${transferidoA}`, 20, 82);
    doc.text(`Tipo de pago: ${tipoPago}`, 20, 90);

    // Tabla de productos
    let yTabla = 110;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(20, yTabla, 170, 10);
    doc.line(40, yTabla, 40, yTabla + 10);
    doc.line(150, yTabla, 150, yTabla + 10);

    doc.setFontSize(10);
    doc.text("CANT.", 22, yTabla + 7);
    doc.text("DETALLE", 60, yTabla + 7);
    doc.text("IMPORTE", 185, yTabla + 7, { align: 'right' });
    yTabla += 10;

    const filas = document.querySelectorAll('#detalles .row');
    filas.forEach(fila => {
        const productoSelect = fila.querySelector('.producto-select');
        const cantidad = parseFloat(fila.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        const textoProducto = productoSelect.options[productoSelect.selectedIndex].text;
        let detalleTexto = doc.splitTextToSize(textoProducto, 105);
        let alturaFila = Math.max(detalleTexto.length * 5, 10);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        doc.text(String(cantidad), 30, yTabla + 6);
        doc.text(detalleTexto, 45, yTabla + 6);
        doc.text(`$ ${(cantidad * precio).toFixed(2)}`, 188, yTabla + 6, { align: 'right' });

        yTabla += alturaFila;
    });

    // Totales
    let totalesInicioY = yTabla + 5;
    doc.rect(150, totalesInicioY, 40, 10);
    doc.rect(150, totalesInicioY + 10, 40, 10);
    doc.rect(150, totalesInicioY + 20, 40, 10);

    doc.text("TOTAL $", 110, totalesInicioY + 7);
    doc.text("SEÑA $", 110, totalesInicioY + 17);
    doc.text("RESTA $", 110, totalesInicioY + 27);

    doc.text(`$ ${parseFloat(total).toFixed(2)}`, 188, totalesInicioY + 7, { align: 'right' });
    doc.text(`$ ${parseFloat(sena).toFixed(2)}`, 188, totalesInicioY + 17, { align: 'right' });
    doc.text(`$ ${parseFloat(resta).toFixed(2)}`, 188, totalesInicioY + 27, { align: 'right' });

    // Logo
    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    // Guardar PDF
    doc.save(`nota_pedido_${codigoNota}.pdf`);
}