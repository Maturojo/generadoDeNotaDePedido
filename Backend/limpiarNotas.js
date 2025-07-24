const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });


// Modelo
const NotaPedido = mongoose.model('NotaPedido', new mongoose.Schema({
    codigo: String,
    cliente: String,
    telefono: String,
    vendedor: String,
    fecha: Date,
    fechaEntrega: Date,
    transferidoA: String,
    tipoPago: String,
    total: Number,
    descuento: Number,
    adelanto: Number,
    resta: Number,
    estado: String,
    productos: Array,
    pdf: { data: Buffer, contentType: String }
}));

// Conectar a MongoDB
async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado a MongoDB.");

        // Borrar notas que NO tienen código o tienen codigo vacío
        const result = await NotaPedido.deleteMany({
            $or: [
                { codigo: { $exists: false } },
                { codigo: "" }
            ]
        });

        console.log(`Notas eliminadas: ${result.deletedCount}`);
        mongoose.disconnect();
    } catch (err) {
        console.error("Error eliminando notas:", err);
        mongoose.disconnect();
    }
}

main();
