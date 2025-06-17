let logo = null;

window.onload = function () {
    const img = new Image();
    img.src = 'assets/logo-linea-gris.png';
    img.onload = function () {
        logo = img;
    };
};

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
}

function formatearMoneda(numero) {
    if (numero === "" || isNaN(numero)) return "";
    return "$ " + parseFloat(numero).toLocaleString("es-AR");
}

async function generarPDF() {
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

    // Encabezado texto
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
    let cantidadFilas = detalles.length;
    let filaAltura = 10;
    let tablaInicioY = 100;
    let tablaFinY = tablaInicioY + (cantidadFilas + 1) * filaAltura;

    doc.setDrawColor(0);
    doc.setLineWidth(0.2);

    doc.line(20, tablaInicioY, 20, tablaFinY);
    doc.line(150, tablaInicioY, 150, tablaFinY);
    doc.line(190, tablaInicioY, 190, tablaFinY);

    

        // Línea superior de la tabla (encima del encabezado)
    doc.line(20, tablaInicioY, 190, tablaInicioY);

    // Línea debajo del encabezado (separador)
    doc.line(20, tablaInicioY + filaAltura, 190, tablaInicioY + filaAltura);



    for (let i = 1; i <= cantidadFilas; i++) {
        let y = tablaInicioY + filaAltura * (i + 1);
        doc.line(20, y, 190, y);
    }

    doc.setFontSize(10);
    doc.text("DETALLE", 25, tablaInicioY + 7);
    doc.text("IMPORTE", 155, tablaInicioY + 7);

    let yData = tablaInicioY + filaAltura * 2;
    for (let i = 0; i < cantidadFilas; i++) {
        doc.text(detalles[i].value, 22, yData);
        doc.text(formatearMoneda(importes[i].value), 188, yData, { align: 'right' });
        yData += filaAltura;
    }

    // Totales
    let totalesInicioY = tablaFinY + 5;
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

    // ⚠ El logo lo agregamos AL FINAL:
    doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    doc.save("nota_pedido.pdf");
}
