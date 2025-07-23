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
