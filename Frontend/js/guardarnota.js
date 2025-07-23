// ------------------- GUARDAR NOTA SIN PDF -------------------
async function guardarNota() {
    if (!validarCampos()) return;

    const codigoNota = generarCodigoUnico();
    const datos = obtenerDatosFormulario();

    // Agregar el campo 'cliente' tomando el valor de 'seniores'
    const notaData = {
        ...datos,
        cliente: datos.seniores || "Sin cliente",
        codigo: codigoNota
    };

    try {
        const response = await fetch(`${API_URL}/notas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notaData)
        });

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
