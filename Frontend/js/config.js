const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_URL = isLocalhost
    ? "http://localhost:3000" // Para desarrollo local
    : "https://generadodenotadepedido.onrender.com"; // URL de tu backend en Render

console.log("Usando API_URL:", API_URL);
