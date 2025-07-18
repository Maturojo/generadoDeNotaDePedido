let logo = null;

window.onload = function () {
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };

    // Eventos para recalcular resta
    document.getElementById('total').addEventListener('input', actualizarResta);
    document.getElementById('sena').addEventListener('input', actualizarResta);

    // Evento al primer importe
    const importes = document.getElementsByName("importe[]");
    for (let i = 0; i < importes.length; i++) {
        importes[i].addEventListener('input', actualizarTotal);
    }
};

function actualizarTotal() {
    const importes = document.getElementsByName("importe[]");
    let suma = 0;
    for (let i = 0; i < importes.length; i++) {
        let val = parseFloat(importes[i].value);
        if (!isNaN(val)) suma += val;
    }
    document.getElementById('total').value = suma.toFixed(2);
    actualizarResta();
}

function actualizarResta() {
    const total = parseFloat(document.getElementById('total').value) || 0;
    const sena = parseFloat(document.getElementById('sena').value) || 0;
    document.getElementById('resta').value = (total - sena).toFixed(2);
}

function agregarDetalle() {
    const detalleHTML = `
    <div class="row mb-2">
        <div class="col-8">
            <input type="text" class="form-control" placeholder="Detalle" name="detalle[]">
        </div>
        <div class="col-4">
            <input type="number" class="form-control" placeholder="Importe" name="importe[]">
        </div>
    </div>
    `;
    document.getElementById('detalles').insertAdjacentHTML('beforeend', detalleHTML);

    // Evento para el nuevo importe
    const nuevosImportes = document.getElementsByName("importe[]");
    nuevosImportes[nuevosImportes.length - 1].addEventListener('input', actualizarTotal);
}

function formatearMoneda(numero) {
    if (numero === "" || isNaN(numero)) return "";
    return "$ " + parseFloat(numero).toLocaleString("es-AR");
}

// Validación de campos
function validarCampos() {
    const camposObligatorios = [
        'fecha',
        'fechaEntrega',
        'seniores',
        'domicilio',
        'localidad',
        'telefono'
    ];

    for (let campo of camposObligatorios) {
        let valor = document.getElementById(campo).value.trim();
        if (valor === "") {
            alert("Por favor, complete el campo: " + campo);
            return false;
        }
    }

    // Al menos un detalle
    const detalles = document.getElementsByName("detalle[]");
    if (detalles.length === 0 || detalles[0].value.trim() === "") {
        alert("Por favor, ingrese al menos un detalle del pedido.");
        return false;
    }

    return true;
}

async function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 190, 277, 'F');

    // Datos del formulario
    const fecha = document.getElementById('fecha').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    const seniores = document.getElementById('seniores').value;
    const domicilio = document.getElementById('domicilio').value;
    const localidad = document.getElementById('localidad').value;
    const telefono = document.getElementById('telefono').value;
    const total = document.getElementById('total').value;
    const sena = document.getElementById('sena').value;
    const resta = document.getElementById('resta').value;
    const detalles = document.getElementsByName("detalle[]");
    const importes = document.getElementsByName("importe[]");

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
    doc.text(`Domicilio: ${domicilio}`, 20, 66);
    doc.text(`Localidad: ${localidad}`, 20, 74);
    doc.text(`Teléfono: ${telefono}`, 20, 82);

    // Tabla dinámica
    let yTabla = 100;

    // Cabecera
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(20, yTabla, 170, 10);
    doc.line(150, yTabla, 150, yTabla + 10);

    doc.setFontSize(10);
    doc.text("DETALLE", 25, yTabla + 7);
    doc.text("IMPORTE", 185, yTabla + 7, { align: 'right' });

    yTabla += 10;

    // Filas de datos
    for (let i = 0; i < detalles.length; i++) {
        let detalleTexto = doc.splitTextToSize(detalles[i].value, 120);
        let alturaFila = detalleTexto.length * 5 * 2;

        // Marco de la fila
        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        // Texto dentro de la fila
        doc.text(detalleTexto, 24, yTabla + 6);
        doc.text(formatearMoneda(importes[i].value), 186, yTabla + 6, { align: 'right' });

        yTabla += alturaFila;
    }

    // Totales
    let totalesInicioY = yTabla + 5;
    doc.rect(150, totalesInicioY, 40, 10);
    doc.rect(150, totalesInicioY + 10, 40, 10);
    doc.rect(150, totalesInicioY + 20, 40, 10);

    doc.text("TOTAL $", 110, totalesInicioY + 7);
    doc.text("SEÑA $", 110, totalesInicioY + 17);
    doc.text("RESTA $", 110, totalesInicioY + 27);

    doc.text(formatearMoneda(total), 188, totalesInicioY + 7, { align: 'right' });
    doc.text(formatearMoneda(sena), 188, totalesInicioY + 17, { align: 'right' });
    doc.text(formatearMoneda(resta), 188, totalesInicioY + 27, { align: 'right' });

    // Pie de página
    doc.setFontSize(8);
    doc.text("Lunes a Viernes de 8:00 a 17:00 - Sábados de 9:00 a 13:00", 20, 275);
    doc.text("www.surmaderas.com.ar - info@surmaderas.com.ar", 20, 280);

    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    doc.save("nota_pedido.pdf");
}
