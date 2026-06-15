# Código Libre - Proyecto Local

Proyecto local de demostración que contiene una página web estática y un servidor Node.js simple para servirla en `http://localhost:3000/`.

Descripción breve:

- Sitio: página estática de la agencia "Código Libre" enfocada en creación de páginas web y servicios digitales.
- Servidor: servidor Node.js mínimo que sirve archivos estáticos y decodifica URLs para manejar nombres con espacios y paréntesis.

Estructura de archivos principal:

- `index.html` — Página principal.
- `styles.css` — Estilos CSS.
- `script.js` — JavaScript del frontend.
- `server.js` — Servidor Node.js que sirve los archivos.

Cómo ejecutar el proyecto localmente:

1. Abre una terminal en la carpeta del proyecto.

2. Ejecuta el servidor con Node.js:

```bash
cd "c:\Users\Usuario\web ia mia"
node "server.js"
```

3. Abre tu navegador en `http://localhost:3000/`.

Comandos útiles (Windows PowerShell):

```powershell
# Ir al directorio del proyecto
cd "c:\Users\Usuario\web ia mia"
# Iniciar servidor
node "server.js"
```

Notas y restauración:

- El servidor incluye `decodeURIComponent(req.url)` para manejar correctamente archivos con espacios y caracteres especiales en el nombre.
- He recreado este `README.md` con la información conocida del proyecto. Si recuerdas texto específico del README anterior (autor, historial de cambios, licencia, contacto, ejemplos, sección "Cómo contribuir"), dime qué recuperar y lo añado exactamente.

Contacto / Autor (opcional):

- Autor: [Tu nombre aquí]
- Email: [tu-email@ejemplo.com]

Licencia:

Incluye una licencia si lo deseas (por ejemplo MIT). Dime si quieres que añada un archivo `LICENSE`.
