# ==============================================================================
# Dockerfile - Agenda del Comité y Vocales | Empresarias Sevillanas (SeviAI)
# Por qué usamos nginx:alpine:
# Proporciona un servidor web ultraligero, rápido y seguro para desplegar la
# aplicación estática en el VPS privado de SeviAI (EasyPanel / Docker) con un
# consumo mínimo de RAM y arranque instantáneo.
# ==============================================================================
FROM nginx:alpine

# Metadatos corporativos para trazabilidad de contenedores en el VPS de SeviAI
LABEL maintainer="Rocío Cano - SeviAI (https://seviai.es)"
LABEL description="Aplicación de Agenda y Confirmación de Eventos para Junta Directiva y Vocales de Empresarias Sevillanas"

# Copiamos los archivos de producción de la aplicación al directorio público de Nginx
COPY dist/ /usr/share/nginx/html/

# Exponemos el puerto 80 estándar para el proxy inverso del VPS (EasyPanel / Traefik)
EXPOSE 80

# Ejecutamos Nginx en primer plano para mantener vivo el contenedor Docker
CMD ["nginx", "-g", "daemon off;"]
