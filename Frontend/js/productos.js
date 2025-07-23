// ------------------- CARGA DE PRODUCTOS -------------------
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        productos = await response.json();
        actualizarSelects();
        inicializarSelect2();
        habilitarProductoPersonalizado();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los productos. Verifique el servidor.',
            confirmButtonText: 'Aceptar'
        });
    }
}

function actualizarSelects() {
    const selects = document.querySelectorAll('.producto-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccione un producto</option>';
        productos.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.codigo;
            option.textContent = `${prod.codigo} - ${prod.detalle} ($${prod.precio})`;
            option.dataset.precio = prod.precio;
            select.appendChild(option);
        });
        const customOption = document.createElement('option');
        customOption.value = "custom";
        customOption.textContent = "Producto personalizado";
        select.appendChild(customOption);
    });
}

function inicializarSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.producto-select').select2({
            placeholder: "Seleccione o busque un producto",
            width: '100%'
        }).on('select2:select', function () {
            const selectedOption = this.options[this.selectedIndex];
            const precioInput = this.closest('.row').querySelector('.precio');
            if (selectedOption && selectedOption.dataset.precio) {
                precioInput.value = selectedOption.dataset.precio;
                calcularTotal();
            }
            mostrarInputsPersonalizados(this);
        });
    }
    habilitarProductoPersonalizado();
}

// ------------------- PRODUCTO PERSONALIZADO -------------------
function habilitarProductoPersonalizado() {
    document.querySelectorAll('.producto-select').forEach(select => {
        select.addEventListener('change', function () {
            mostrarInputsPersonalizados(this);
        });
    });
}

function mostrarInputsPersonalizados(select) {
    const fila = select.closest('.row');
    let inputCustom = fila.querySelector('.input-personalizado');
    let detalleCustom = fila.querySelector('.detalle-personalizado');

    if (select.value === 'custom') {
        if (!inputCustom) {
            const inputHTML = document.createElement('input');
            inputHTML.type = 'text';
            inputHTML.placeholder = 'Nombre del producto';
            inputHTML.className = 'form-control mt-2 input-personalizado';
            select.parentElement.appendChild(inputHTML);
        }
        if (!detalleCustom) {
            const detalleHTML = document.createElement('textarea');
            detalleHTML.placeholder = 'Detalle del producto';
            detalleHTML.className = 'form-control mt-2 detalle-personalizado';
            detalleHTML.rows = 2;
            select.parentElement.appendChild(detalleHTML);
        }
    } else {
        if (inputCustom) inputCustom.remove();
        if (detalleCustom) detalleCustom.remove();
    }
}