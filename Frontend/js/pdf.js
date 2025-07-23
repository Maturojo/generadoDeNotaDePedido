// ------------------- GENERAR PDF -------------------
async function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const datos = obtenerDatosFormulario();

    // Cliente por defecto
    datos.seniores = datos.seniores?.trim() || "Sin cliente";

    // Generamos el código único UNA sola vez
    const codigoNota = generarCodigoUnico();

    // Dibujamos el PDF
    dibujarPDF(doc, datos, codigoNota);
    const pdfBlob = doc.output('blob');

    // Guardamos en backend
    const codigoGuardado = await guardarNotaEnBackend(datos, pdfBlob, codigoNota);
    if (!codigoGuardado) return;

    // Guardar en disco con el mismo código
    doc.save(`nota_pedido_${codigoGuardado}.pdf`);

    Swal.fire({
        icon: "success",
        title: "¡Nota Guardada!",
        text: `Se generó y guardó la nota con el código ${codigoGuardado}.`,
        confirmButtonText: "OK"
    });
}

// ------------------- VER PDF (solo visualiza, no guarda) -------------------
function verPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const datos = obtenerDatosFormulario();
    datos.seniores = datos.seniores?.trim() || "Sin cliente";

    // Generamos un código temporal SOLO para visualizar
    const tempCodigo = generarCodigoUnico();
    dibujarPDF(doc, datos, tempCodigo);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
}

// ------------------- DIBUJAR PDF -------------------
function dibujarPDF(doc, datos, codigoNota) {
    const { fecha, fechaEntrega, seniores, telefono, vendedor, transferidoA, tipoPago, total, descuento, adelanto, resta, productos } = datos;

    doc.setFontSize(16);
    doc.setTextColor(97, 95, 95);
    doc.text("NOTA DE PEDIDO", 60, 25);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 60, 32);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 60, 39);

    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 50);
    doc.text(`Entrega: ${fechaEntrega}`, 120, 50);
    doc.text(`Señores: ${seniores}`, 20, 58);
    doc.text(`Teléfono: ${telefono}`, 20, 66);
    doc.text(`Vendedor: ${vendedor}`, 20, 74);
    doc.text(`Medio de pago: ${transferidoA}`, 20, 82);
    doc.text(`Tipo de pago: ${tipoPago}`, 20, 90);

    // TABLA DE PRODUCTOS
    let yTabla = 110;
    doc.rect(20, yTabla, 170, 10);
    doc.line(40, yTabla, 40, yTabla + 10);
    doc.line(150, yTabla, 150, yTabla + 10);
    doc.text("CANT.", 22, yTabla + 7);
    doc.text("DETALLE", 60, yTabla + 7);
    doc.text("IMPORTE", 185, yTabla + 7, { align: 'right' });
    yTabla += 10;

    productos.forEach(prod => {
        const textoProducto = prod.detalle;
        const detalleTexto = doc.splitTextToSize(textoProducto, 105);
        const alturaFila = Math.max(detalleTexto.length * 5, 10);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        doc.text(String(prod.cantidad), 30, yTabla + 6);
        doc.text(detalleTexto, 45, yTabla + 6);
        doc.text(`$ ${(prod.subtotal).toFixed(2)}`, 188, yTabla + 6, { align: 'right' });

        yTabla += alturaFila;
    });

    // TOTALES
    let yTotales = yTabla + 5;
    if (descuento > 0) {
        doc.text(`Descuento: $${descuento.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
    }

    doc.text(`TOTAL: $${total.toFixed(2)}`, 150, yTotales);
    if (tipoPago !== "Pago completo") {
        yTotales += 10;
        doc.text(`RESTA: $${resta.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
        doc.text(`ADELANTO: $${adelanto.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
    }

    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    if (tipoPago === "Pago completo") {
        doc.setFontSize(30);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PAGADO", 160, 30, { align: "center" });
    }
}
