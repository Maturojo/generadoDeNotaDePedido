function enviarPorWhatsApp() {
    if (!validarCampos()) return;

    const telefonoCliente = document.getElementById('telefono').value.replace(/\D/g, '');
    const seniores = document.getElementById('seniores').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    const vendedor = document.getElementById('vendedor').value;
    const tipoPago = document.getElementById('tipoPago').value;
    const medioPago = document.getElementById('transferidoA').value;
    const total = document.getElementById('total').value;
    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    const adelanto = document.getElementById('adelanto').value;
    const resta = document.getElementById('resta').value;

    let mensajeProductos = '';
    document.querySelectorAll('#detalles .row').forEach(row => {
        const cantidad = row.querySelector('.cantidad').value || 0;
        const precio = row.querySelector('.precio').value || 0;
        const productoSelect = row.querySelector('.producto-select');
        const inputCustom = row.querySelector('.input-personalizado')?.value.trim();
        const detalleCustom = row.querySelector('.detalle-personalizado')?.value.trim();
        let detalleProducto = '';

        if (productoSelect.value === 'custom' || (inputCustom && inputCustom.length > 0)) {
            const nombre = inputCustom || 'Producto sin nombre';
            detalleProducto = detalleCustom ? `${nombre} (${detalleCustom})` : nombre;
        } else {
            detalleProducto = productoSelect.options[productoSelect.selectedIndex]?.text || 'Sin producto';
        }

        mensajeProductos += `• ${detalleProducto} x${cantidad} = $${(cantidad * precio).toFixed(2)}\n`;
    });

    let mensaje = `Hola ${seniores}, aquí está el detalle de su pedido:\n\n`;
    mensaje += `Fecha de entrega: ${fechaEntrega}\n`;
    mensaje += `Vendedor: ${vendedor}\n`;
    mensaje += `Medio de pago: ${medioPago}\n`;
    mensaje += `Estado de pago: ${tipoPago}\n\n`;
    mensaje += `Productos:\n${mensajeProductos}\n`;
    if (descuento > 0) {
        mensaje += `Descuento: $${descuento.toFixed(2)}\n`;
    }
    mensaje += `Total: $${total}\n`;
    
    if (tipoPago !== "Pago completo") {
        mensaje += `Resta: $${resta}\n`;
        mensaje += `Adelanto: $${adelanto}\n`;
    }
    mensaje += `\n¡Gracias por su compra!`;

    const url = `https://wa.me/549${telefonoCliente}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}