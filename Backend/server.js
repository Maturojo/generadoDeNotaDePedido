const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// -------------------- CONEXIÓN A MONGODB --------------------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('ERROR: No se encontró MONGO_URI en las variables de entorno');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));

// -------------------- MODELOS --------------------
const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: String,
    direccion: String,
    email: String
});
const Cliente = mongoose.model('Cliente', ClienteSchema);
const NotaPedidoSchema = new mongoose.Schema({
    codigo: { type: String, required: true },
    cliente: String,
    telefono: String,
    vendedor: String,
    fecha: Date,
    fechaEntrega: Date,
    transferidoA: String,      // NUEVO
    tipoPago: String,          // NUEVO
    total: Number,
    descuento: { type: Number, default: 0 },
    adelanto: { type: Number, default: 0 },
    resta: { type: Number, default: 0 },
    estado: { type: String, default: 'pendiente' },
    productos: [
        {
            nombre: String,
            detalle: String,    // NUEVO, por si usas "detalle" en lugar de nombre
            cantidad: Number,
            precioUnitario: Number,
            subtotal: Number
        }
    ],
    pdf: { data: Buffer, contentType: String }
});

const NotaPedido = mongoose.model('NotaPedido', NotaPedidoSchema);

// -------------------- MULTER --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// -------------------- RUTAS ROOT --------------------
app.get('/', (req, res) => {
    res.send('API funcionando en Render 🚀');
});

// -------------------- ENDPOINT PRODUCTOS --------------------
app.get('/productos', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'Data', 'productos.xlsx');

        if (!fs.existsSync(filePath)) {
            console.error(`Archivo Excel no encontrado en ${filePath}`);
            return res.status(500).json({ error: 'No se encontró el archivo productos.xlsx' });
        }

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const productos = xlsx.utils.sheet_to_json(sheet);

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(500).json({ error: 'El archivo productos.xlsx está vacío o mal formateado' });
        }

        res.json(productos);
    } catch (error) {
        console.error('Error leyendo Excel:', error);
        res.status(500).json({ error: 'No se pudo leer el archivo Excel' });
    }
});

// -------------------- CRUD CLIENTES --------------------
app.post('/clientes', async (req, res) => {
    try {
        const cliente = new Cliente(req.body);
        await cliente.save();
        res.json(cliente);
    } catch (error) {
        console.error('Error guardando cliente:', error);
        res.status(500).json({ error: 'Error guardando cliente' });
    }
});

app.get('/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.json(clientes);
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ error: 'Error obteniendo clientes' });
    }
});



// -------------------- CRUD NOTAS DE PEDIDO --------------------
app.post('/notas', upload.single('pdf'), async (req, res) => {
    try {
        console.log("BODY COMPLETO:", req.body);

        let productosData = [];
        if (req.body.productos) {
            try {
                productosData = typeof req.body.productos === 'string'
                    ? JSON.parse(req.body.productos)
                    : req.body.productos;
            } catch (err) {
                console.error("Error parseando productos:", err);
                return res.status(400).json({ error: "El campo 'productos' no es un JSON válido." });
            }
        }

        const {
            codigo, cliente, telefono, vendedor,
            fecha, fechaEntrega, transferidoA, tipoPago,
            total, descuento, adelanto, resta, estado
        } = req.body;

        const nuevaNota = new NotaPedido({
            codigo,
            cliente,
            telefono,
            vendedor,
            fecha: new Date(fecha),
            fechaEntrega: new Date(fechaEntrega),
            transferidoA,
            tipoPago,
            total,
            descuento: descuento || 0,
            adelanto: adelanto || 0,
            resta: resta || 0,
            estado,
            productos: productosData,
            pdf: req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : null
        });

        await nuevaNota.save();
        res.status(201).json({ message: "Nota de pedido guardada correctamente", nota: nuevaNota });
    } catch (error) {
        console.error("Error guardando nota de pedido:", error);
        res.status(500).json({ error: `Error guardando nota de pedido: ${error.message}` });
    }
});


app.get('/notas', async (req, res) => {
    try {
        const notas = await NotaPedido.find();
        res.json(notas);
    } catch (error) {
        console.error('Error obteniendo notas:', error);
        res.status(500).json({ error: 'Error obteniendo notas de pedido' });
    }
});

// Descargar PDF de una nota
app.get('/notas/:id/pdf', async (req, res) => {
    try {
        const nota = await NotaPedido.findById(req.params.id);
        if (!nota || !nota.pdf) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }
        res.set('Content-Type', nota.pdf.contentType);
        res.send(nota.pdf.data);
    } catch (error) {
        console.error("Error descargando PDF:", error);
        res.status(500).json({ error: "Error descargando PDF" });
    }
});

// Obtener nota por código
app.get('/notas/codigo/:codigo', async (req, res) => {
    try {
        const nota = await NotaPedido.findOne({ codigo: req.params.codigo });
        if (!nota) {
            return res.status(404).json({ error: "Nota no encontrada" });
        }
        res.json(nota);
    } catch (error) {
        console.error("Error obteniendo nota por código:", error);
        res.status(500).json({ error: "Error obteniendo nota" });
    }
});

// Eliminar nota por código
app.delete('/notas/:codigo', async (req, res) => {
    try {
        const result = await NotaPedido.deleteOne({ codigo: req.params.codigo });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Nota no encontrada" });
        }
        res.json({ message: "Nota eliminada correctamente" });
    } catch (error) {
        console.error("Error eliminando nota:", error);
        res.status(500).json({ error: "Error eliminando nota" });
    }
});


// -------------------- INICIAR SERVIDOR --------------------
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
