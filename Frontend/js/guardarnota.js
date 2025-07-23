// ------------------- GUARDAR NOTA SIN PDF -------------------
// ------------------- GUARDAR NOTA SIN PDF -------------------
async function guardarNota() {
    if (!validarCampos()) return;

    const codigoNota = generarCodigoUnico();
    const datos = obtenerDatosFormulario();

    // Normalizamos el campo cliente (antes seniores)
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
        formData.append("tipoPago", datos.tipoPago);
        formData.append("total", datos.total);
        formData.append("descuento", datos.descuento);
        formData.append("adelanto", datos.adelanto);
        formData.append("resta", datos.resta);
        formData.append("productos", JSON.stringify(datos.productos));

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




// ------------------- OBTENER DATOS DEL FORMULARIO -------------------
function obtenerDatosFormulario() {
    const productos = [];
    const filas = document.querySelectorAll('#detalles .row');

    filas.forEach(fila => {
        const productoSelect = fila.querySelector('.producto-select');
        const inputCustom = fila.querySelector('.input-personalizado')?.value.trim();
        const detalleCustom = fila.querySelector('.detalle-personalizado')?.value.trim();

        let baseProducto = (productoSelect.value === 'custom' || inputCustom) 
            ? (inputCustom || "Producto sin nombre") 
            : productoSelect.options[productoSelect.selectedIndex]?.text || "Sin producto";
        let textoProducto = detalleCustom ? `${baseProducto} - ${detalleCustom}` : baseProducto;

        const cantidad = parseFloat(fila.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        productos.push({ detalle: textoProducto, cantidad, precioUnitario: precio, subtotal: cantidad * precio });
    });

    return {
        fecha: document.getElementById('fecha').value,
        fechaEntrega: document.getElementById('fechaEntrega').value,
        seniores: document.getElementById('seniores').value,
        telefono: document.getElementById('telefono').value,
        vendedor: document.getElementById('vendedor').value,
        transferidoA: document.getElementById('transferidoA').value,
        tipoPago: document.getElementById('tipoPago').value,
        total: parseFloat(document.getElementById('total').value) || 0,
        descuento: parseFloat(document.getElementById('descuento').value) || 0,
        adelanto: parseFloat(document.getElementById('adelanto').value) || 0,
        resta: parseFloat(document.getElementById('resta').value) || 0,
        productos
    };
}