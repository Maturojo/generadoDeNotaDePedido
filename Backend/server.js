const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const multer = require('multer'); // Para manejar archivos (PDF)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// === CONEXIÓN A MONGODB ===
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('ERROR: No se encontró MONGO_URI en las variables de entorno');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));

// === MODELOS ===
const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: String,
    direccion: String,
    email: String
});
const Cliente = mongoose.model('Cliente', ClienteSchema);

const NotaPedidoSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    fecha: { type: Date, default: Date.now },
    productos: [
        {
            nombre: String,
            cantidad: Number,
            precioUnitario: Number,
            subtotal: Number
        }
    ],
    total: Number,
    estado: { type: String, default: 'pendiente' },
    pdf: { data: Buffer, contentType: String } // Campo para almacenar PDF
});
const NotaPedido = mongoose.model('NotaPedido', NotaPedidoSchema);

// === RUTA ROOT ===
app.get('/', (req, res) => {
    res.send('API funcionando en Render 🚀');
});

// === ENDPOINT PRODUCTOS ===
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

// === CRUD CLIENTES ===
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

app.put('/clientes/:id', async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(cliente);
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({ error: 'Error actualizando cliente' });
    }
});

app.delete('/clientes/:id', async (req, res) => {
    try {
        await Cliente.findByIdAndDelete(req.params.id);
        res.json({ message: 'Cliente eliminado' });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({ error: 'Error eliminando cliente' });
    }
});

// === CRUD NOTAS DE PEDIDO ===
const upload = multer();
app.post('/notas', upload.single('pdf'), async (req, res) => {
    try {
        const { clienteId, fecha, productos, total, estado } = req.body;

        const nota = new NotaPedido({
            clienteId,
            fecha,
            productos: JSON.parse(productos),
            total,
            estado,
            pdf: req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : null
        });

        await nota.save();
        res.json(nota);
    } catch (error) {
        console.error('Error guardando nota de pedido:', error);
        res.status(500).json({ error: 'Error guardando nota de pedido' });
    }
});

app.get('/notas', async (req, res) => {
    try {
        const notas = await NotaPedido.find().populate('clienteId');
        res.json(notas);
    } catch (error) {
        console.error('Error obteniendo notas:', error);
        res.status(500).json({ error: 'Error obteniendo notas de pedido' });
    }
});

app.put('/notas/:id', async (req, res) => {
    try {
        const nota = await NotaPedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(nota);
    } catch (error) {
        console.error('Error actualizando nota:', error);
        res.status(500).json({ error: 'Error actualizando nota de pedido' });
    }
});

app.delete('/notas/:id', async (req, res) => {
    try {
        await NotaPedido.findByIdAndDelete(req.params.id);
        res.json({ message: 'Nota de pedido eliminada' });
    } catch (error) {
        console.error('Error eliminando nota:', error);
        res.status(500).json({ error: 'Error eliminando nota de pedido' });
    }
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
