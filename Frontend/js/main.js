let productos = [];

// Cargar productos desde el servidor backend
async function cargarProductos() {
    try {
        const response = await fetch('http://localhost:3000/productos');
        productos = await response.json();
        actualizarSelects();

        // Activar Select2 en todos los select de productos
        inicializarSelect2();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("No se pudieron cargar los productos. Verifique el servidor.");
    }
}

// Rellenar todos los <select> de productos con los datos
function actualizarSelects() {
    const selects = document.querySelectorAll('.producto-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccione un producto</option>';
        productos.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.codigo;
            option.textContent = `${prod.codigo} - ${prod.detalle} ($${prod.precio})`;
            option.dataset.precio = prod.precio;
            option.dataset.detalle = prod.detalle;
            select.appendChild(option);
        });
    });
}

// Inicializar Select2
function inicializarSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.producto-select').select2({
            placeholder: "Seleccione o busque un producto",
            width: '100%'
        }).on('select2:select', function () {
            // Cuando se selecciona un producto, actualizar el precio y recalcular
            const selectedOption = this.options[this.selectedIndex];
            const precioInput = this.closest('.row').querySelector('.precio');
            if (selectedOption && selectedOption.dataset.precio) {
                precioInput.value = selectedOption.dataset.precio;
            }
            calcularTotal();
        });
    } else {
        console.warn("Select2 no está cargado.");
    }
}

// Detectar cambios en cantidad o precio
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('cantidad') || e.target.classList.contains('precio')) {
        calcularTotal();
    }
});

// Agregar una nueva fila de producto
function agregarFilaProducto() {
    const detalles = document.getElementById('detalles');
    const filaHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <select class="form-control producto-select" name="producto[]">
                    <option value="">Seleccione un producto</option>
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control cantidad" name="cantidad[]" placeholder="Cant." value="1" min="1">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control precio" name="importe[]" placeholder="Precio">
            </div>
            <div class="col-md-2">
                <input type="checkbox" class="form-check-input precio-especial" title="Precio especial">
                <label class="form-check-label">Especial</label>
            </div>
        </div>`;
    detalles.insertAdjacentHTML('beforeend', filaHTML);

    // Actualizar productos en el nuevo select
    actualizarSelects();
    inicializarSelect2();
}

// Calcular total
function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#detalles .row').forEach(row => {
        const precio = parseFloat(row.querySelector('.precio').value) || 0;
        const cantidad = parseInt(row.querySelector('.cantidad').value) || 0;
        total += precio * cantidad;
    });
    document.getElementById('total').value = total.toFixed(2);

    const sena = parseFloat(document.getElementById('sena').value) || 0;
    document.getElementById('resta').value = (total - sena).toFixed(2);
}

// Resta cuando cambia la seña
document.getElementById('sena').addEventListener('input', calcularTotal);

// Inicializar productos al cargar
cargarProductos();
