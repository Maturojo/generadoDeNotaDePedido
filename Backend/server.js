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
    cliente: String,
    telefono: String,
    vendedor: String,
    fecha: Date,
    fechaEntrega: Date,
    total: Number,
    estado: { type: String, default: 'pendiente' },
    productos: [
        {
            nombre: String,
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
        console.log("Datos recibidos en /notas:", req.body);

        const { cliente, telefono, vendedor, fecha, fechaEntrega, total, estado, productos } = req.body;

        const nuevaNota = new NotaPedido({
            cliente,
            telefono,
            vendedor,
            fecha: fecha ? new Date(fecha) : null,
            fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
            total: Number(total),
            estado,
            productos: JSON.parse(productos),
            pdf: req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : null
        });

        await nuevaNota.save();
        res.status(201).json({ message: "Nota de pedido guardada correctamente", nota: nuevaNota });
    } catch (error) {
        console.error("Error guardando nota de pedido:", error);
        res.status(500).json({ error: "Error guardando nota de pedido" });
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

// -------------------- INICIAR SERVIDOR --------------------
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
