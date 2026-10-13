# GUITA · Utilería digital · Episodios 1, 2 y 3

App tipo Instagram ficticia ("Postal", nombre provisorio) para usar en cámara.
Es una web app: se abre en el navegador del celular, se instala en la pantalla de inicio y después funciona sin conexión.

## Escenas

| Escena | Qué muestra | Cómo se usa |
|---|---|---|
| **7E** | Bienvenida → formulario "Creá tu cuenta" → perfil vacío con 0 seguidores | El actor toca "Crear cuenta nueva", escribe en los campos (cualquier tecla escribe el texto correcto), toca "Crear cuenta". En el perfil desliza hacia abajo: 0 → 85 |
| **7G** | Perfil con 1 publicación y biografía | Desliza hacia abajo: 85 → 435 → 3.317 |
| **9H** | Pantalla negra que se enciende y recibe notificaciones sin parar, con vibración (solo Android) | Alguien del equipo toca **ARMAR**. La pantalla queda negra. Arranca sola a los 8 s, o antes si se toca la pantalla |

### Episodio 2 (celular de Ariel)

| Escena | Qué muestra | Cómo se usa |
|---|---|---|
| **15** | Reel de skincare de micarr en pantalla completa | Se abre y el video arranca solo (sin sonido: el audio va en post). Ariel bloquea el celular con el botón real |
| **21** | Pantalla bloqueada → notificación "micarr ha publicado un nuevo video" → reel | **ARMAR**; llega por temporizador o toque. Al tocar la notificación se abre el reel |

### Episodio 3

| Escena | Celular | Qué muestra |
|---|---|---|
| **29** | María Laura | Perfil de @micarr visto desde su cuenta. Deslizar hacia abajo: 15 mil → 20 mil → 30 mil |
| **38** | Mica | Su perfil → "+" → cámara frontal espejada → modo **EN VIVO** (tocar o deslizar) → botón central → "Iniciando video en vivo…" → sigue como la 40 |
| **39** | María Laura | Pantalla bloqueada → "micarr está transmitiendo en VIVO" (temporizador o toque) |
| **40** | Mica | Arranca directo en vivo: espectadores 140 → 15.000 en 10 s; a los 20 s los comentarios pasan a horror. Fase 3 (apoyo, esc. 42) desde el menú oculto. Botón de micrófono para silenciar |

Videos: en el menú oculto de la 15 y la 21 → "Cargar video" (desde la galería). Mientras tanto se ve un video provisorio que dice "VIDEO PROVISORIO".
Fotos extra del perfil de Mica: menú oculto → "Fotos extra en el perfil de Mica" → Agregar.
Cámara: la primera vez el celular pide permiso. En la 38 se pide al entrar a la escena para que no aparezca en medio de la toma. Si se rechazó: Ajustes del celular → Safari/Chrome → Cámara → Permitir.

## Gestos ocultos

- **Menú oculto:** mantener apretada 1 segundo la esquina superior izquierda.
- **Avanzar contador sin deslizar:** doble toque en la esquina inferior derecha.
- **Reiniciar la toma:** menú oculto → "Reiniciar escena".

Desde el menú oculto se cambia: iPhone/Android, tema claro/oscuro, hora real o fija, fecha, batería, operadora, señal, nombre de la app, usuario, foto de perfil, foto de la publicación, fondo de la pantalla bloqueada, valores del contador y tiempos de la 9H.
Los ajustes quedan guardados en cada celular por separado.

## Cómo ponerla en los celulares

La app necesita estar publicada en una dirección **https** para instalarse y funcionar sin conexión. La forma más rápida:

1. Entrar a https://app.netlify.com/drop y arrastrar esta carpeta (`app-ep1`). Te da un link `https://algo.netlify.app`.
   (También sirve GitHub Pages o Vercel.)
2. En cada celular, abrir ese link **con conexión**, una vez.
   - **Android (Chrome):** menú ⋮ → "Agregar a la pantalla principal" / "Instalar app".
   - **iPhone (Safari):** botón Compartir → "Agregar a inicio".
3. Abrir la app desde el ícono "Postal". En el menú de escenas tiene que decir **Sin conexión: lista**. Desde ahí funciona sin internet.

Si se cambia algún archivo, subir el número de `VERSION` en `sw.js` y volver a publicar; los celulares se actualizan la próxima vez que abran la app con conexión.

## Checklist de rodaje

- Celular en **No molestar** y con el brillo al máximo.
- Brillo automático y bloqueo automático de pantalla: apagados (la app igual intenta mantener la pantalla encendida).
- **9H:** usar un Android. Subir la intensidad de vibración en los ajustes del sistema. La app vibra en forma continua, pero la *fuerza* depende del motor del celular: no se puede subir desde la app. Probar antes en la mesa real; una superficie lisa o levemente inclinada ayuda a que el celular "camine".
- **iPhone:** la barra de estado (hora, batería) es la real del celular. Para fijar la hora: Ajustes → General → Fecha y hora → desactivar "Automático". La batería no se puede falsear.
- **Android instalado:** la app se abre en pantalla completa y dibuja una barra de estado falsa con la hora, batería y operadora del menú oculto.

## Archivos

- `js/config.js` → textos, valores y notificaciones por defecto (lo marcado [INVENTADO] no está en el guion).
- `img/avatar.jpg` → foto de perfil provisoria (recorte de la etiqueta de Arte). Se reemplaza por el logo final.
- `img/post.jpg` → publicación provisoria. Se puede cambiar desde el menú oculto con una foto de la galería.
