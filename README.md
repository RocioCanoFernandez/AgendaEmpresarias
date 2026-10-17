# Agenda Institucional · Comité Ejecutivo y Vocales (Empresarias Sevillanas)

Aplicación web centralizada desarrollada bajo los estándares de **SeviAI** para gestionar las convocatorias, eventos institucionales y confirmaciones de representación de la Junta Directiva de **Empresarias Sevillanas** (5 miembros del Comité + 6 Vocales + Técnico de la asociación).

---

## 📂 Estructura de Archivos para Subir a GitHub y Desplegar en VPS (EasyPanel)

Sube el contenido de la carpeta `agenda-comite/` a tu repositorio de GitHub:

- `agenda-comite/Dockerfile` *(Raíz del repositorio para el despliegue automático con Nginx en EasyPanel / VPS)*
- `agenda-comite/dist/index.html` *(Interfaz principal de la aplicación)*
- `agenda-comite/dist/styles.css` *(Sistema de diseño SeviAI: Blanco `#FFFFFF`, Negro `#000000`, Rojo acción `#DA1F26`, Montserrat + Inter)*
- `agenda-comite/dist/app.js` *(Lógica de calendario mensual, tarjetas de eventos, extractor de invitaciones y sincronización con n8n)*

---

## 🔗 Conexión con tu Workflow en n8n y el Google Sheet

Ya tienes creado y validado el workflow en tu servidor de n8n:
- **Nombre del Workflow**: `Agenda Comité - Empresarias Sevillanas`
- **Enlace directo en tu n8n**: `https://n8n-n8n.npfusf.easypanel.host/workflow/7nbTYHmRqUuHZ196`

### Pasos finales en n8n (tardarás 1 minuto):
1. Asegúrate de que el archivo `Agenda_Comite_Empresarias_Sevillanas_Base_N8N.xlsx` subido a Google Drive esté guardado como **Hoja de cálculo de Google nativa** (*Archivo → Guardar como hojas de cálculo de Google*), ya que la API de Google Sheets requiere formato nativo de Google Sheets y no `.xlsx`.
2. Entra en el workflow `Agenda Comité - Empresarias Sevillanas` en tu n8n y selecciona en los 5 nodos de Google Sheets (`Leer EVENTOS`, `Leer RESPUESTAS`, `Leer EQUIPO_AUTORIZADO`, `Guardar en EVENTOS`, `Guardar en RESPUESTAS`) la **credencial de Google de Empresarias Sevillanas** y el documento `Agenda_Comite_Empresarias_Sevillanas_Base_N8N`.
3. Pulsa **Publish / Activar** arriba a la derecha en n8n.

---

## 🔑 Datos de Acceso Inicial para el Comité y Vocales
- **PIN por defecto**: `2026` *(configurable desde el botón superior "Google Sheets conectado" de la aplicación)*.
- **Selector de integrante**: Incluye las 11 integrantes de `EQUIPO_AUTORIZADO` + el perfil de **Técnico de la Asociación**.
- **Confirmación múltiple**: Desde cualquier evento puedes confirmar tu asistencia en **1 clic** (*"🙋‍♀️ Yo puedo ir"* / *"No puedo"*) o abrir **"👥 Apuntar / gestionar varias compañeras"** para marcar a 2, 3 o 4 compañeras a la vez cuando acordéis ir juntas en representación.
