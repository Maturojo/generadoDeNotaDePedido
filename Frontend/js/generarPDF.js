let logo = null;

window.onload = function () {
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };

    const hoy = new Date();
    document.getElementById('fecha').value = hoy.toISOString().split('T')[0];

    actualizarOpcionesEntrega();
    cambiarEntrega();

    document.getElementById('sena').addEventListener('input', () => {
        calcularTotales();
    });
};

// ---- Calcular totales desde las filas ----
function calcularTotales() {
    let total = 0;
    const filas = document.querySelectorAll('#detalles .row');
    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        total += cantidad * precio;
    });
    document.getElementById('total').value = total.toFixed(2);
    const sena = parseFloat(document.getElementById('sena').value) || 0;
    document.getElementById('resta').value = (total - sena).toFixed(2);
}

// ---- Validación ----
function validarCampos() {
    const camposObligatorios = ['fecha', 'fechaEntrega', 'seniores', 'telefono', 'vendedor', 'transferidoA', 'tipoPago'];
    for (let campo of camposObligatorios) {
        let valor = document.getElementById(campo).value.trim();
        if (valor === "") {
            alert("Por favor, complete el campo: " + campo);
            return false;
        }
    }
    const filas = document.querySelectorAll('#detalles .row');
    if (filas.length === 0 || !filas[0].querySelector('.producto-select').value) {
        alert("Por favor, ingrese al menos un producto.");
        return false;
    }
    return true;
}

// ---- Generar PDF ----
async function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 190, 277, 'F');

    // Datos del formulario
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

    // Cabecera tabla
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(20, yTabla, 170, 10);
    doc.line(40, yTabla, 40, yTabla + 10);  // separador cantidad
    doc.line(150, yTabla, 150, yTabla + 10); // separador importe

    doc.setFontSize(10);
    doc.text("CANT.", 22, yTabla + 7);
    doc.text("DETALLE", 60, yTabla + 7);
    doc.text("IMPORTE", 185, yTabla + 7, { align: 'right' });

    yTabla += 10;

    // Filas de productos
    const filas = document.querySelectorAll('#detalles .row');
    filas.forEach(fila => {
        const productoSelect = fila.querySelector('.producto-select');
        const cantidad = parseFloat(fila.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        const textoProducto = productoSelect.options[productoSelect.selectedIndex].text;

        let detalleTexto = doc.splitTextToSize(textoProducto, 105);
        let alturaFila = Math.max(detalleTexto.length * 5, 10);

        // Dibujar fila
        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        // Escribir contenido
        doc.text(String(cantidad), 30, yTabla + 6);
        doc.text(detalleTexto, 45, yTabla + 6);
        doc.text(`$ ${ (cantidad * precio).toFixed(2) }`, 188, yTabla + 6, { align: 'right' });

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

    // Pie de página
    doc.setFontSize(8);
    doc.text("Lunes a Viernes de 8:00 a 17:00 - Sábados de 9:00 a 13:00", 20, 275);
    doc.text("www.surmaderas.com.ar - info@surmaderas.com.ar", 20, 280);

    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    doc.save("nota_pedido.pdf");
}

// ---- Funciones de entrega ----
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
        inputFecha.style.display = "none";
        const dias = parseInt(opcion);
        const fechaEntrega = sumarDiasHabiles(hoy, dias);
        document.getElementById('fechaEntrega').value = fechaEntrega.toISOString().split('T')[0];
    }
}

// ---- WhatsApp ----
function enviarPorWhatsApp() {
    const telefono = document.getElementById('telefono').value.trim();
    if (telefono === "") {
        alert("Por favor, ingrese un número de teléfono.");
        return;
    }
    const mensaje = encodeURIComponent("¡Hola! Te envío la nota de pedido generada desde Sur Maderas.");
    const url = `https://wa.me/54${telefono}?text=${mensaje}`;
    window.open(url, '_blank');
}
