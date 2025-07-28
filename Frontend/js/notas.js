// ------------------- VARIABLES -------------------
let logo = null;
const img = new Image();
img.src = '../assets/logo-linea-gris.png';
img.onload = function () {
    logo = img;
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("Notas.js cargado correctamente.");
    cargarNotas();

    document.getElementById("filtroCliente").addEventListener("input", cargarNotas);
    document.getElementById("filtroVendedor").addEventListener("input", cargarNotas);
    document.getElementById("filtroFecha").addEventListener("change", cargarNotas);

    // Inicializar tooltips con un leve delay
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            delay: { "show": 200, "hide": 50 }
        });
    });
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

        notasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

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
    const codigoNota = nota.codigo || "SIN_CODIGO";

    return `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <strong>${nota.cliente || "Sin cliente"}</strong> - 
                ${nota.telefono || "Sin teléfono"} - 
                ${nota.vendedor || "Sin vendedor"} - 
                $${nota.total || 0} - 
                <span class="badge bg-secondary">Código: ${codigoNota}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <select id="estado-${codigoNota}" class="form-select form-select-sm" style="width:auto;"
                        onchange="seleccionarEstado('${codigoNota}', ${nota.total})">
                    <option value="Pago completo">Pago completo</option>
                    <option value="Adelanto">Adelanto</option>
                    <option value="Pendiente">Pendiente</option>
                </select>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="verPDFNota('${codigoNota}')"><i class="bi bi-file-earmark-pdf"></i></button>
                    <button class="btn btn-warning" onclick="generarNotaProveedor('${codigoNota}')"><i class="bi bi-file-earmark-text"></i></button>
                    <button class="btn btn-success" onclick="enviarWhatsapp('${codigoNota}')"><i class="bi bi-whatsapp"></i></button>
                    <button class="btn btn-danger" onclick="eliminarNota('${codigoNota}')"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
    `;
}




// ------------------- VER PDF DE NOTA -------------------
async function verPDFNota(codigo) {
    try {
        const estadoPago = document.getElementById(`estado-${codigo}`).value;
        const response = await fetch(`${API_URL}/notas/codigo/${codigo}`);
        if (!response.ok) throw new Error("Nota no encontrada");
        const nota = await response.json();

        const adelanto = adelantos[codigo] || 0;
        const resta = (nota.total || 0) - adelanto;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        dibujarPDF(doc, {
            fecha: nota.fecha.split("T")[0],
            fechaEntrega: nota.fechaEntrega.split("T")[0],
            seniores: nota.cliente || "Sin cliente",
            telefono: nota.telefono || "-",
            vendedor: nota.vendedor || "-",
            transferidoA: nota.transferidoA || "-",
            tipoPago: estadoPago,
            total: nota.total || 0,
            descuento: nota.descuento || 0,
            adelanto: adelanto,
            resta: resta,
            productos: nota.productos || []
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

// ------------------- DIBUJAR PDF (IGUAL AL INDEX) -------------------
function dibujarPDF(doc, datos, codigoNota) {
    const {
        fecha, fechaEntrega, seniores, telefono,
        vendedor, transferidoA, tipoPago,
        total, descuento, adelanto, resta, productos
    } = datos;

    doc.setFontSize(16);
    doc.setTextColor(97, 95, 95);
    doc.text("NOTA DE PEDIDO", 60, 25);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 60, 32);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 60, 39);

    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 50);
    doc.text(`Entrega: ${fechaEntrega}`, 120, 50);
    doc.text(`Señores: ${seniores}`, 20, 58);
    doc.text(`Teléfono: ${telefono}`, 20, 66);
    doc.text(`Vendedor: ${vendedor}`, 20, 74);
    doc.text(`Medio de pago: ${transferidoA}`, 20, 82);
    doc.text(`Tipo de pago: ${tipoPago}`, 20, 90);

    // Tabla productos
    let yTabla = 110;
    doc.rect(20, yTabla, 170, 10);
    doc.line(40, yTabla, 40, yTabla + 10);
    doc.line(150, yTabla, 150, yTabla + 10);
    doc.text("CANT.", 22, yTabla + 7);
    doc.text("DETALLE", 60, yTabla + 7);
    doc.text("IMPORTE", 185, yTabla + 7, { align: 'right' });
    yTabla += 10;

    (productos || []).forEach(prod => {
        const textoProducto = prod.detalle || prod.nombre || "Sin detalle";
        const detalleTexto = doc.splitTextToSize(textoProducto, 105);
        const alturaFila = Math.max(detalleTexto.length * 5, 10);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(40, yTabla, 40, yTabla + alturaFila);
        doc.line(150, yTabla, 150, yTabla + alturaFila);

        doc.text(String(prod.cantidad), 30, yTabla + 6);
        doc.text(detalleTexto, 45, yTabla + 6);
        doc.text(`$ ${(prod.subtotal || 0).toFixed(2)}`, 188, yTabla + 6, { align: 'right' });

        yTabla += alturaFila;
    });

    let yTotales = yTabla + 5;
    if (descuento > 0) {
        doc.text(`Descuento: $${descuento.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
    }

    doc.text(`TOTAL: $${total.toFixed(2)}`, 150, yTotales);
    if (tipoPago !== "Pago completo") {
        yTotales += 10;
        doc.text(`RESTA: $${resta.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
        doc.text(`ADELANTO: $${adelanto.toFixed(2)}`, 150, yTotales);
        yTotales += 10;
    }

    if (logo) doc.addImage(logo, 'PNG', 15, 15, 25, 25);

    if (tipoPago === "Pago completo") {
        doc.setFontSize(30);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PAGADO", 160, 30, { align: "center" });
    }
}

// ------------------- DIBUJAR PDF PROVEEDOR -------------------
function dibujarPDFProveedor(doc, datos, codigoNota) {
    const { fecha, fechaEntrega, productos } = datos;

    // Color gris general
    const gris = [97, 95, 95];
    doc.setTextColor(...gris);

    // Logo
    if (logo) doc.addImage(logo, 'PNG', 15, 10, 25, 25);

    // Encabezado
    doc.setFontSize(16);
    doc.text("NOTA DE PROVEEDOR", 60, 20);
    doc.setFontSize(12);
    doc.text("SUR MADERAS", 60, 27);
    doc.setFontSize(11);
    doc.text(`Código: ${codigoNota}`, 60, 34);

    // Fechas
    doc.setFontSize(10);
    doc.text(`Fecha de inicio: ${fecha}`, 20, 50);

    doc.setFontSize(12);
    doc.text(`Fecha de entrega: ${fechaEntrega}`, 20, 58);

    // Tabla de productos
    let yTabla = 75;
    doc.setFontSize(11);
    doc.rect(20, yTabla, 170, 10);
    doc.line(50, yTabla, 50, yTabla + 10);
    doc.text("CANT.", 25, yTabla + 7);
    doc.text("DETALLE", 60, yTabla + 7);
    yTabla += 10;

    (productos || []).forEach(prod => {
        const cantidad = String(prod.cantidad || 0);
        const detalle = prod.detalle || prod.nombre || "Sin detalle";
        const detalleTexto = doc.splitTextToSize(detalle, 135);
        const alturaFila = Math.max(detalleTexto.length * 5, 10);

        doc.rect(20, yTabla, 170, alturaFila);
        doc.line(50, yTabla, 50, yTabla + alturaFila);
        doc.text(cantidad, 30, yTabla + 6);
        doc.text(detalleTexto, 55, yTabla + 6);

        yTabla += alturaFila;
    });
}




// ------------------- GENERAR NOTA PROVEEDOR -------------------
async function generarNotaProveedor(codigo) {
    console.log("Generando nota proveedor para:", codigo);
    try {
        const response = await fetch(`${API_URL}/notas/codigo/${codigo}`);
        if (!response.ok) throw new Error("Nota no encontrada");
        const nota = await response.json();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Generar PDF especial para proveedor
        dibujarPDFProveedor(doc, {
            fecha: nota.fecha.split("T")[0],
            fechaEntrega: nota.fechaEntrega.split("T")[0],
            productos: nota.productos || []
        }, codigo);

        window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
        console.error("Error generando nota proveedor:", err);
        Swal.fire("Error", "No se pudo generar la nota proveedor.", "error");
    }
}


// ------------------- ENVIAR WHATSAPP -------------------
async function enviarWhatsapp(codigo) {
    console.log("Enviando nota por WhatsApp:", codigo);
    try {
        const response = await fetch(`${API_URL}/notas/codigo/${codigo}`);
        if (!response.ok) throw new Error("Nota no encontrada");
        const nota = await response.json();

        const mensaje = `Hola ${nota.cliente}, te enviamos la nota de pedido (Código: ${codigo}). Total: $${nota.total}`;
        const link = `https://wa.me/${nota.telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(link, '_blank');
    } catch (err) {
        console.error("Error enviando WhatsApp:", err);
        Swal.fire("Error", "No se pudo enviar la nota por WhatsApp.", "error");
    }
}

let adelantos = {}; // Objeto para almacenar adelantos por código

async function seleccionarEstado(codigo, total) {
    const estadoSelect = document.getElementById(`estado-${codigo}`);
    const estado = estadoSelect.value;

    if (estado === "Adelanto") {
        const { value: adelanto } = await Swal.fire({
            title: "Monto del adelanto",
            input: "number",
            inputLabel: `Ingrese cuánto deja de adelanto (Total: $${total})`,
            inputPlaceholder: "Ej: 5000",
            inputAttributes: {
                min: 0,
                max: total,
                step: 0.01
            },
            showCancelButton: true,
            confirmButtonText: "Aceptar",
            cancelButtonText: "Cancelar"
        });

        if (adelanto === null || adelanto === "") {
            estadoSelect.value = "Pendiente"; // Si cancela, volver a Pendiente
            return;
        }

        adelantos[codigo] = parseFloat(adelanto);
        Swal.fire("Guardado", `Adelanto de $${adelanto} registrado.`, "success");
    } else {
        adelantos[codigo] = 0; // No hay adelanto
    }
}


