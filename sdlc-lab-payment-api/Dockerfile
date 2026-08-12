FROM node:18

WORKDIR /app

# Copiar archivos de dependencias primero (optimiza caché de Docker)
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY . .

# TODO (Lab — fase Deploy): Optimiza esta imagen.
# Pistas:
#   1. Cambia la imagen base a node:18-alpine para reducir el tamaño (~900 MB → ~180 MB)
#   2. Usa un multi-stage build para separar build de producción
#   3. Agrega un usuario no-root para mayor seguridad

EXPOSE 3000

CMD ["node", "src/index.js"]
