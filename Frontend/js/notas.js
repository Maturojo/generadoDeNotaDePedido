document.addEventListener("DOMContentLoaded", () => {
    console.log("Notas.js cargado correctamente.");
    cargarNotas();

    document.getElementById("filtroCliente").addEventListener("input", cargarNotas);
    document.getElementById("filtroVendedor").addEventListener("input", cargarNotas);
    document.getElementById("filtroFecha").addEventListener("change", cargarNotas);
});

// ------------------- CARGAR NOTAS -------------------
async function cargarNotas() {
    console.log("Cargando notas desde API...");
    try {
        const response = await fetch(`${API_URL}/notas`);
        if (!response.ok) throw new Error("Error al obtener notas");
        const notas = await response.json();
        console.log("Notas recibidas:", notas);

        // Filtros
        const cliente = document.getElementById("filtroCliente").value.toLowerCase();
        const vendedor = document.getElementById("filtroVendedor").value.toLowerCase();
        const fechaFiltro = document.getElementById("filtroFecha").value;

        const notasFiltradas = notas.filter(nota => {
            const coincideCliente = nota.cliente?.toLowerCase().includes(cliente);
            const coincideVendedor = nota.vendedor?.toLowerCase().includes(vendedor);
            const coincideFecha = !fechaFiltro || nota.fecha === fechaFiltro;
            return coincideCliente && coincideVendedor && coincideFecha;
        });

        console.log("Notas filtradas:", notasFiltradas);
        renderNotasAgrupadas(notasFiltradas);
    } catch (err) {
        console.error("Error cargando notas:", err);
        Swal.fire("Error", "No se pudieron cargar las notas.", "error");
    }
}

// ------------------- RENDERIZAR -------------------
function renderNotasAgrupadas(notas) {
    const contenedor = document.getElementById("contenedorNotas");
    contenedor.innerHTML = "";

    const agrupadas = agruparPorFecha(notas);

    Object.keys(agrupadas).forEach(fecha => {
        const card = document.createElement("div");
        card.classList.add("card", "mb-3");
        card.innerHTML = `
        <div class="card-header bg-primary text-white">
            ${fecha}
        </div>
        <div class="card-body" id="grupo-${fecha}">
            ${agrupadas[fecha].map(nota => crearHTMLNota(nota)).join("")}
        </div>
        `;
        contenedor.appendChild(card);
    });
}

function agruparPorFecha(notas) {
    return notas.reduce((grupos, nota) => {
        const fecha = nota.fecha;
        if (!grupos[fecha]) grupos[fecha] = [];
        grupos[fecha].push(nota);
        return grupos;
    }, {});
}

function crearHTMLNota(nota) {
    console.log("Nota en crearHTMLNota:", nota); // Debug para verificar los campos

    // Validar que nota.codigo esté definido
    const codigoNota = nota.codigo ? nota.codigo : (nota.codigoNota || 'SIN_CODIGO');

    return `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <strong>${nota.cliente || "Sin cliente"}</strong> - 
                ${nota.telefono || "Sin teléfono"} - 
                ${nota.vendedor || "Sin vendedor"} - 
                $${nota.total || 0} - 
                <span class="badge bg-secondary">Código: ${codigoNota}</span>
            </div>
            <div>
                <button class="btn btn-sm btn-primary" onclick="verPDFNota('${codigoNota}')">Ver PDF</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarNota('${codigoNota}')">Eliminar</button>
            </div>
        </div>
    `;
}


// ------------------- VER PDF DE NOTA -------------------
async function verPDFNota(codigo) {
    try {
        const response = await fetch(`${API_URL}/notas/codigo/${codigo}`);
        if (!response.ok) throw new Error("Nota no encontrada");
        const nota = await response.json();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        dibujarPDF(doc, nota, codigo);
        window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
        console.error("Error generando PDF:", err);
        Swal.fire("Error", "No se pudo generar el PDF de la nota.", "error");
    }
}


// ------------------- ELIMINAR NOTA -------------------
async function eliminarNota(codigo) {
    const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar nota?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`${API_URL}/notas/${codigo}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Error al eliminar nota");
        Swal.fire("Eliminada", "La nota ha sido eliminada.", "success");
        cargarNotas();
    } catch (err) {
        console.error("Error eliminando nota:", err);
        Swal.fire("Error", "No se pudo eliminar la nota.", "error");
    }
}
