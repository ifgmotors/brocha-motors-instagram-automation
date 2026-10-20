# Publicador automático de Brocha Motors

Publica los Reels 19–32 cada dos días a las 20:00 (Europe/Madrid), únicamente en Instagram. El flujo crea el contenedor del Reel, espera a que Meta termine de procesarlo y publica una sola vez gracias a `state.json`.

## Configuración única

1. Crear una aplicación en Meta for Developers y añadir **Instagram API with Instagram Login**.
2. Autorizar la cuenta profesional `brochamotors` con `instagram_business_basic` e `instagram_business_content_publish`.
3. Crear un repositorio público de GitHub para que Meta pueda descargar los MP4.
4. Copiar el contenido de esta carpeta al repositorio.
5. Añadir como secretos del repositorio: `IG_USER_ID`, `IG_ACCESS_TOKEN` y `PUBLIC_MEDIA_BASE`.

`PUBLIC_MEDIA_BASE` debe apuntar a la carpeta pública `media` en formato raw, sin barra final.

No escribas tokens en archivos, mensajes ni capturas. Guárdalos exclusivamente como secretos cifrados del repositorio.
