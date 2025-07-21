// config.js
const isLocal = window.location.hostname === "localhost";

export const API_URL = isLocal
  ? "http://localhost:3000" // backend local
  : "https://generadodenotadepedido.onrender.com"; // backend en Render
