// ------------------- VER PDF -------------------
function verPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const codigoNota = generarCodigoUnico();
    const datos = obtenerDatosFormulario();

    dibujarPDF(doc, datos, codigoNota);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
}

// ------------------- GENERAR PDF -------------------
async function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const codigoNota = generarCodigoUnico();
    const datos = obtenerDatosFormulario();

    // Aseguramos cliente por defecto si está vacío
    if (!datos.seniores || datos.seniores.trim() === "") {
        datos.seniores = "Sin cliente";
    }

    // Dibujamos el PDF
    dibujarPDF(doc, datos, codigoNota);

    // Guardar en disco
    doc.save(`nota_pedido_${codigoNota}.pdf`);

    // Guardar en backend
    try {
        const pdfBlob = doc.output('blob');
        console.log("Cliente:", datos.seniores);
        console.log("Código de Nota:", codigoNota);

        const formData = prepararFormData(datos, pdfBlob, codigoNota);
        formData.append("codigoNota", codigoNota); // <-- NUEVO

        const response = await fetch(`${API_URL}/notas`, { method: "POST", body: formData });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Respuesta del backend:", errorText);
            throw new Error("Error al guardar la nota");
        }

        Swal.fire({ icon: "success", title: "¡Guardada!", text: "La nota fue guardada.", confirmButtonText: "OK" });
    } catch (err) {
        console.error("Error enviando nota al backend:", err);
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar la nota.", confirmButtonText: "OK" });
    }
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

// ------------------- GENERAR PDF (Proveedor) -------------------
function generarNotaProveedor() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fecha = document.getElementById('fecha').value;
    const vendedor = document.getElementById('vendedor').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    const codigoNota = generarCodigoUnico();

    doc.setFontSize(16);
    doc.setTextColor(97, 95, 95);
    doc.text("NOTA DE PEDIDO - PROVEEDOR", 40, 25);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 40, 32);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 40, 39);

    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 50);
    doc.text(`Vendedor: ${vendedor}`, 120, 50);
    doc.text(`Entrega: ${fechaEntrega}`, 20, 58);

    let yTabla = 70;
    doc.rect(20, yTabla, 170, 10);
    doc.line(40, yTabla, 40, yTabla + 10);
    doc.text("CANT.", 22, yTabla + 7);
    doc.text("DETALLE", 100, yTabla + 7, { align: 'center' });
    yTabla += 10;

    const filas = document.querySelectorAll('#detalles .row');
    filas.forEach(fila => {
        const cantidad = fila.querySelector('.cantidad').value || 0;
        const productoSelect = fila.querySelector('.producto-select');
        const inputCustom = fila.querySelector('.input-personalizado')?.value.trim();
        const detalleCustom = fila.querySelector('.detalle-personalizado')?.value.trim();

        let textoProducto = '';
        if (productoSelect.value === 'custom' || (inputCustom && inputCustom.length > 0)) {
            const base = inputCustom || "Producto sin nombre";
            textoProducto = detalleCustom ? `${base} - ${detalleCustom}` : base;
        } else {
            textoProducto = productoSelect.options[productoSelect.selectedIndex]?.text || "Sin producto";
        }

        let detalleTexto = doc.splitTextToSize(textoProducto, 145);
        let alturaFila = Math.max(detalleTexto.length * 5, 10);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);

        doc.text(String(cantidad), 30, yTabla + 6);
        doc.text(detalleTexto, 45, yTabla + 6);

        yTabla += alturaFila;
    });

    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);
    doc.save(`nota_proveedor_${codigoNota}.pdf`);
}
