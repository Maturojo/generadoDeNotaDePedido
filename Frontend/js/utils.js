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

function solicitarClaveDescuento() {
    const descuentoInput = document.getElementById('descuento');
    if (!descuentoInput.readOnly) return;

    Swal.fire({
        title: 'Clave requerida',
        input: 'password',
        inputLabel: 'Ingrese la clave para habilitar el descuento',
        inputPlaceholder: 'Clave...',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        preConfirm: (clave) => {
            return new Promise((resolve, reject) => {
                if (clave === '1234') {
                    resolve(true);
                } else {
                    reject('Clave incorrecta');
                }
            }).catch(err => {
                Swal.showValidationMessage(err);
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            descuentoInput.readOnly = false;
            descuentoInput.focus();
        }
    });
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

