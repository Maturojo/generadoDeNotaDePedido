document.addEventListener("DOMContentLoaded", () => {
    console.log("Notas.js cargado correctamente.");
    cargarNotas();

    document.getElementById("filtroCliente").addEventListener("input", cargarNotas);
    document.getElementById("filtroVendedor").addEventListener("input", cargarNotas);
    document.getElementById("filtroFecha").addEventListener("change", cargarNotas);
});

// ------------------- CARGAR NOTAS -------------------
async function cargarNotas() {
    console.log("Cargando notas desde API...", API_URL);
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
            const coincideFecha = !fechaFiltro || nota.fecha.split("T")[0] === fechaFiltro;
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
        const fecha = nota.fecha.split("T")[0];
        if (!grupos[fecha]) grupos[fecha] = [];
        grupos[fecha].push(nota);
        return grupos;
    }, {});
}

// ------------------- CREAR HTML DE UNA NOTA -------------------
function crearHTMLNota(nota) {
    console.log("Nota en crearHTMLNota:", nota);

    const codigoNota = nota.codigo || nota.codigoNota || "SIN_CODIGO";

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

// ------------------- DIBUJAR PDF -------------------
function dibujarPDF(doc, datos, codigoNota) {
    const {
        fecha, fechaEntrega, seniores, telefono,
        vendedor, transferidoA, tipoPago,
        total, descuento, adelanto, resta, productos
    } = datos;

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(97, 95, 95);
    doc.text("NOTA DE PEDIDO", 60, 20);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 60, 27);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 60, 34);

    // Datos generales
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 45);
    doc.text(`Entrega: ${fechaEntrega}`, 120, 45);
    doc.text(`Señores: ${seniores}`, 20, 52);
    doc.text(`Teléfono: ${telefono}`, 20, 59);
    doc.text(`Vendedor: ${vendedor}`, 20, 66);
    doc.text(`Medio de pago: ${transferidoA}`, 20, 73);
    doc.text(`Tipo de pago: ${tipoPago}`, 20, 80);

    // Tabla productos
    let yTabla = 95;
    doc.setFillColor(230, 230, 230);
    doc.rect(20, yTabla, 170, 8, "F");
    doc.text("CANT.", 23, yTabla + 6);
    doc.text("DETALLE", 60, yTabla + 6);
    doc.text("IMPORTE", 180, yTabla + 6, { align: 'right' });
    yTabla += 8;

    (productos || []).forEach(prod => {
        const detalleTexto = doc.splitTextToSize(prod.nombre || prod.detalle, 100);
        const alturaFila = Math.max(detalleTexto.length * 5, 8);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        doc.text(String(prod.cantidad), 30, yTabla + 5);
        doc.text(detalleTexto, 45, yTabla + 5);
        doc.text(`$${(prod.subtotal || 0).toFixed(2)}`, 185, yTabla + 5, { align: 'right' });

        yTabla += alturaFila;
    });

    // Totales
    let yTotales = yTabla + 10;
    if (descuento > 0) {
        doc.text(`Descuento: $${descuento.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
    }
    doc.text(`TOTAL: $${total.toFixed(2)}`, 150, yTotales);
    if (tipoPago !== "Pago completo") {
        yTotales += 10;
        doc.text(`ADELANTO: $${adelanto.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
        doc.text(`RESTA: $${resta.toFixed(2)}`, 150, yTotales);
    }
}


// ------------------- VER PDF DE NOTA -------------------
async function verPDFNota(codigo) {
    console.log("Ver PDF de la nota:", codigo);
    try {
        const response = await fetch(`${API_URL}/notas/codigo/${codigo}`);
        if (!response.ok) throw new Error("Nota no encontrada");
        const nota = await response.json();
        console.log("Nota recuperada para PDF:", nota);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Construir el PDF con los datos de la nota
        dibujarPDF(doc, {
            fecha: new Date(nota.fecha).toLocaleDateString(),
            fechaEntrega: new Date(nota.fechaEntrega).toLocaleDateString(),
            seniores: nota.cliente,
            telefono: nota.telefono,
            vendedor: nota.vendedor,
            transferidoA: nota.transferidoA || "-",
            tipoPago: nota.tipoPago || "No informado",
            total: nota.total,
            descuento: nota.descuento || 0,
            adelanto: nota.adelanto || 0,
            resta: nota.resta || 0,
            productos: nota.productos
        }, codigo);

        window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
        console.error("Error generando PDF:", err);
        Swal.fire("Error", "No se pudo generar el PDF de la nota.", "error");
    }
}

// ------------------- ELIMINAR NOTA -------------------
async function eliminarNota(codigo) {
    console.log("Intentando eliminar nota:", codigo);
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
