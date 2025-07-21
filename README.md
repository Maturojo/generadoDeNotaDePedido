# Generador de Notas de Pedido - Sur Maderas

Este proyecto es una aplicación web que permite generar notas de pedido en formato PDF para clientes de **Sur Maderas**, con cálculo automático de totales, validación de campos, generación de códigos únicos y envío rápido por WhatsApp.

---

## **Características principales**
- **Generación de PDFs** con [jsPDF](https://github.com/parallax/jsPDF).
- **Cálculo automático de totales**, seña y resto.
- **Búsqueda de productos** usando [Select2](https://select2.org/).
- **Validación de campos** con [SweetAlert2](https://sweetalert2.github.io/) para alertas modernas.
- **Formateo y validación de teléfonos** en tiempo real (ejemplo: `(223) 595 4195`).
- **Código único de pedido**, basado en fecha y un contador diario.
- **Envío rápido por WhatsApp**, abriendo un chat con el cliente.
- **Estilos personalizados** con **SCSS** y **Bootstrap 5**.

---

## **Tecnologías utilizadas**
- **HTML5** para la estructura de la aplicación.
- **CSS3 / SCSS** para estilos y diseño responsive.
- **Bootstrap 5** para componentes y grillas.
- **JavaScript (ES6)** para la lógica principal.
- **SweetAlert2** para alertas visuales.
- **Select2** para mejorar la selección de productos.
- **jsPDF** para la generación de archivos PDF.
- **Fetch API** para cargar productos desde un backend (por ejemplo, `localhost:3000`).

---

## **Instalación y uso**
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/usuario/generador-nota-pedido.git
   cd generador-nota-pedido

