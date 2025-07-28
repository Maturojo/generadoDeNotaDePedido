// ------------------- GUARDAR NOTA (CON O SIN PDF) -------------------
async function guardarNotaEnBackend(datos, pdfBlob = null, codigoNota = generarCodigoUnico()) {
    const cliente = datos.seniores?.trim() || "Sin cliente";

    try {
        const formData = new FormData();
        formData.append("codigo", codigoNota);
        formData.append("cliente", cliente);
        formData.append("telefono", datos.telefono);
        formData.append("vendedor", datos.vendedor);
        formData.append("fecha", datos.fecha);
        formData.append("fechaEntrega", datos.fechaEntrega);
        formData.append("transferidoA", datos.transferidoA);
        formData.append("total", datos.total);
        formData.append("descuento", datos.descuento);
        formData.append("adelanto", datos.adelanto);
        formData.append("resta", datos.resta);
        formData.append("productos", JSON.stringify(datos.productos));
   
        // Adjuntar PDF solo si existe
        if (pdfBlob) {
            formData.append("pdf", pdfBlob, `nota_pedido_${codigoNota}.pdf`);
        }

        const response = await fetch(`${API_URL}/notas`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Respuesta del backend:", errorText);
            throw new Error("Error al guardar la nota");
        }

        return codigoNota;
    } catch (err) {
        console.error("Error enviando nota al backend:", err);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo guardar la nota en el servidor.",
            confirmButtonText: "OK"
        });
        return null;
    }
}

// ------------------- GENERAR Y GUARDAR PDF -------------------
async function generarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const datos = obtenerDatosFormulario();

    // Cliente por defecto
    datos.seniores = datos.seniores?.trim() || "Sin cliente";

    // Generamos el código una sola vez
    const codigoNota = generarCodigoUnico();

    // Dibujamos el PDF y generamos el blob
    dibujarPDF(doc, datos, codigoNota);
    const pdfBlob = doc.output('blob');

    // Guardamos la nota en el backend con el mismo código
    const codigoGuardado = await guardarNotaEnBackend(datos, pdfBlob, codigoNota);
    if (!codigoGuardado) return;

    // Guardar PDF en disco con el mismo código
    doc.save(`nota_pedido_${codigoGuardado}.pdf`);

    Swal.fire({
        icon: "success",
        title: "¡Nota Guardada!",
        text: `Se guardó la nota con el código ${codigoGuardado}.`,
        confirmButtonText: "OK"
    });
}

// ------------------- SOLO GUARDAR NOTA SIN PDF -------------------
async function guardarNota() {
    if (!validarCampos()) return;

    const datos = obtenerDatosFormulario();
    datos.seniores = datos.seniores?.trim() || "Sin cliente";

    // Generamos el código una sola vez y guardamos
    const codigo = await guardarNotaEnBackend(datos, null, generarCodigoUnico());
    if (codigo) {
        Swal.fire({
            icon: "success",
            title: "¡Guardada!",
            text: `La nota fue guardada con el código ${codigo}.`,
            confirmButtonText: "OK"
        });
    }
}
