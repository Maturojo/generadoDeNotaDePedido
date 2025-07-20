const express = require('express');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const PORT = 3000;

// Permitir CORS (para que el frontend pueda acceder al backend desde otra carpeta)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Endpoint para leer productos del Excel
app.get('/productos', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'productos.xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const productos = xlsx.utils.sheet_to_json(sheet);
        res.json(productos);
    } catch (error) {
        console.error('Error leyendo Excel:', error);
        res.status(500).json({ error: 'No se pudo leer el archivo Excel' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
