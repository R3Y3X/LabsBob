PROMPT DE DESARROLLO: PORTAL DE LABORATORIOS DE TRABAJO (GITHUB PAGES)

OBJETIVO DEL PROYECTO:
Crear una aplicación web estática (Single Page Application - SPA) alojada en GitHub Pages para un evento de IBM Bob enfocado en clientes y partners. La página debe ser altamente atractiva, moderna, responsiva y ligera, construida exclusivamente con HTML5, CSS3 y JavaScript (sin dependencias de backend).

---

1. ESTILO VISUAL Y DISEÑO DE NAVEGACIÓN
- Estilo de referencia: Basado en el layout de IBM Workshop Hub / MkDocs Material.
- Paleta de Colores: Tonos azules corporativos estilo IBM (#3f51b5 / #2b3a8f o similares), con tipografía clara y limpia.
- Cabecera Superior (Navbar Principal):
  * Logo e Identidad de "IBM Bob Workshops".
  * Barra de búsqueda global rápida.
  * Selector de tema (Dark/Light mode).
  * Badge/Link al repositorio de GitHub (con contador de stars/forks ficticio o real).
- Navegación Interna de Laboratorios (Sub-Navbar Horizontal Superior):
  * Al ingresar a un laboratorio específico, los pasos/partes del lab DEBEN navegarse mediante una barra horizontal justo debajo del header principal (ejemplo: "Home", "Part 1 - Setup", "Part 2 - First Agent", "Part 3...", etc.), reemplazando los sidebars laterales tradicionales para dar mayor espacio de lectura al contenido.

---

2. ESTRUCTURA DE LA PÁGINA INICIAL (HOME / MENÚ DE LABS)
La pantalla principal presentará la plataforma IBM Bob y ofrecerá un "Menú de Laboratorios" categorizado por 3 niveles de dificultad:

A. BASIC (Nivel Introducción / Entrada)
- Lab 1: Hands-on Inicial (Migración visual del repositorio de GitHub existente, convirtiendo los archivos Markdown e imágenes del repo actual en vistas web integradas con el nuevo diseño).
- Lab 2: Software Development Lifecycle (SDL)
  * Ref: /ibm-bob/software-development-lifecycle/

B. INTEGRACIONES (Nivel Intermedio / Plato Fuerte)
- Lab 1: Agentic Retail (Integraciones con Confluent y Orchestrate)
  * Ref: /ibm-bob/agentic-retail/

C. PREMIUM PACKAGE (Nivel Avanzado / Postre)
- Lab 1: Java Modernization v2
  * Ref: /ibm-bob/java-modernization-v2/
- Lab 2: IBM i RPG Development
  * Ref: /ibm-bob/ibm-i-rpg-development/

---

3. REQUISITOS TÉCNICOS Y FUNCIONALES
- Compatibilidad: 100% compatible con GitHub Pages (archivos estáticos index.html, css/, js/, assets/).
- Formato de Contenido: Permitir renderizar los pasos de los laboratorios desde archivos Markdown (.md) o HTML limpio estructurado, soportando:
  * Bloques de código con sintaxis resaltada (Syntax Highlighting) y botón de "Copiar al portapapeles".
  * Cajas de notas / avisos (Callouts/Admonitions: Note, Tip, Warning).
  * Renderizado correcto de imágenes y diagramas explicativos.
- SPA Behavior: Cambios de sección y de laboratorio fluidos mediante JavaScript (rutas con hash o pestañas dinámicas sin recargar la página).

---

ENTREGABLES REQUERIDOS:
1. Estructura de repositorio lista para GitHub Pages (`/docs` o rama `gh-pages`).
2. Código CSS modular y limpio con variables CSS para fácil ajuste de temas.
3. Documentación breve en el README.md de cómo agregar o actualizar nuevos laboratorios dentro de la estructura creada.