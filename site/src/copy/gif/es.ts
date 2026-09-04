// Гайд «видео в GIF», испанский. Формулировки поисковые: «convertir vídeo
// a gif», «hacer un gif», «pasar vídeo a gif». Разделитель дробной части —
// запятая, единицы MB/KB.
import { FACTS } from "../../facts";

export default {
  title: "Vídeo a GIF — gratis y sin conexión, en tu propio ordenador",
  description:
    "Cómo hacer un GIF de un vídeo en tu ordenador: elige fotogramas por segundo y ancho, pulsa empezar. Sin subir nada, sin límite de tamaño, sin marca de agua. Dentro, los tamaños medidos para cada ajuste.",
  h1: "Vídeo a GIF, en tu propio ordenador",
  crumb: "Vídeo a GIF",

  answer:
    "Suelta el vídeo en MediaChef, elige la receta «Vídeo a GIF», ajusta los fotogramas por segundo y el ancho, y pulsa empezar. El GIF aparece junto al archivo original. No se sube nada: FFmpeg trabaja en tu máquina, así que no hay tope de tamaño ni cola de espera. Con los ajustes por defecto —15 fotogramas por segundo y 480 píxeles de ancho— un GIF cuesta unos 130 KB por segundo de vídeo: diez segundos salen en torno a 1,3 MB.",

  facts: [
    { k: "Qué necesitas", v: `MediaChef ${FACTS.version} — una descarga, FFmpeg ya va dentro` },
    { k: "Funciona sin conexión", v: "Sí, del todo — la red no se toca en ningún momento" },
    { k: "Qué acepta", v: "MP4, MKV, MOV, WebM, AVI, TS y todo lo demás que FFmpeg lea" },
    { k: "Ajustes", v: "Fotogramas/s 10 / 15 / 24 · ancho 320 / 480 / 640 píxeles" },
    { k: "Qué obtienes", v: "clip.gif, escrito junto al vídeo de origen" },
    { k: "Precio", v: "Gratis, código abierto (GPL-3.0), sin cuenta y sin marca de agua" },
  ],

  toc: [
    { id: "how", label: "Cómo hacerlo" },
    { id: "fps", label: "Cuántos fotogramas" },
    { id: "width", label: "Qué ancho" },
    { id: "size", label: "Cuánto pesará" },
    { id: "duration", label: "Cómo influye la duración" },
    { id: "why", label: "Por qué en tu ordenador" },
    { id: "notfor", label: "Cuándo el GIF es mala idea" },
    { id: "faq", label: "Preguntas" },
  ],

  stepsTitle: "Cómo convertir un vídeo en GIF",
  steps: [
    {
      h: "Descarga MediaChef",
      p: "Un archivo para macOS, Windows o Linux. FFmpeg viaja dentro de la descarga: no hay que instalar nada aparte ni añadir nada al PATH.",
    },
    {
      h: "Suelta el vídeo en el tablero",
      p: "MediaChef lee el archivo con ffprobe y deja solo las recetas que encajan. La ficha del GIF aparece con cualquier vídeo; el formato de origen no importa.",
    },
    {
      h: "Elige «Vídeo a GIF»",
      p: "Dos ajustes: fotogramas por segundo y ancho en píxeles. La altura se calcula a partir del ancho y las proporciones se mantienen: un clip 16:9 con ancho 480 sale a 480×270.",
    },
    {
      h: "Pulsa empezar y coge el archivo",
      p: "El GIF aparece junto al vídeo como clip.gif. La cola muestra el avance y la ruta final; suelta varios vídeos a la vez y se harán uno tras otro.",
    },
  ],
  shotAlt:
    "MediaChef listo para convertir: el tablero espera un archivo de vídeo y a la derecha está la cola de tareas.",
  shotCaption: "El tablero donde cae el vídeo. Las recetas aparecen cuando MediaChef ha leído el archivo.",

  tables: [
    {
      id: "fps",
      title: "Cuántos fotogramas por segundo elegir",
      lead:
        "Los fotogramas por segundo deciden lo fluido que se ve el movimiento y, en proporción directa, lo que pesa el archivo. Un GIF guarda cada fotograma casi por separado, así que el doble de fotogramas es más o menos el doble de tamaño.",
      head: ["Fotogramas/s", "Cómo se ve", "Elígelo cuando"],
      rows: [
        ["10", "Se nota a saltos en el movimiento rápido, bien en el lento", "Grabaciones de pantalla, un cursor moviéndose, texto que aparece. El archivo más pequeño."],
        ["15", "Bastante fluido para casi todo", "El valor por defecto. Reacciones, escenas cortas y cualquier cosa que no tengas clara."],
        ["24", "Como en el cine, sin saltos visibles", "Movimiento rápido, deporte, panorámicas — y solo si el tamaño te vale."],
      ],
      note:
        "El recuento es exacto: fotogramas = fotogramas/s × segundos. Diez segundos a 15 son 150 fotogramas; a 24 ya son 240.",
    },
    {
      id: "width",
      title: "Qué ancho elegir",
      lead:
        "Tú pones el ancho y la altura se calcula para mantener la proporción; el escalado usa el filtro Lanczos. En la tabla, en qué se convierte un vídeo 16:9.",
      head: ["Ancho", "16:9 pasa a ser", "Elígelo cuando"],
      rows: [
        ["320 px", "320×180", "Chats y mensajería, donde el GIF se ve pequeño de todas formas. Alrededor de la mitad que 480."],
        ["480 px", "480×270", "El valor por defecto. Se lee en una publicación o un mensaje y sigue siendo ligero."],
        ["640 px", "640×360", "Cuando importa el detalle: una demo de interfaz, texto pequeño en pantalla. Unas 1,5 veces más que 480."],
      ],
      note:
        "Nada se amplía: si el origen tiene 320 píxeles de ancho, se queda en 320 aunque pidas 640.",
    },
    {
      id: "size",
      title: "Cuánto pesará el archivo",
      lead:
        "Medido, no estimado: diez segundos de vídeo 1280×720 con movimiento en todo el cuadro, pasados por esta misma receta. Una imagen tranquila comprime mejor y una cargada peor, así que tómalo como la mitad alta del rango.",
      head: ["Fotogramas/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 MB", "0,88 MB", "1,36 MB"],
        ["15", "0,65 MB", "1,28 MB", "1,98 MB"],
        ["24", "0,98 MB", "1,96 MB", "3,05 MB"],
      ],
      note:
        "El ajuste más barato y el más caro se diferencian en casi siete veces, y entre ellos hay dos clics. Si el GIF sale demasiado pesado, baja primero el ancho: a la vista cuesta menos que perder fotogramas.",
    },
    {
      id: "duration",
      title: "Cómo influye la duración en el tamaño",
      lead:
        "El crecimiento es lineal, porque cada segundo añade sus propios fotogramas. Con los ajustes por defecto —15 fotogramas, ancho 480— un segundo cuesta unos 130 KB, y esa cifra casi no se mueve con la duración.",
      head: ["Duración", "Tamaño por defecto", "Por segundo"],
      rows: [
        ["3 s", "0,37 MB", "128 KB"],
        ["5 s", "0,64 MB", "131 KB"],
        ["10 s", "1,28 MB", "131 KB"],
        ["20 s", "2,56 MB", "131 KB"],
        ["30 s", "3,82 MB", "130 KB"],
      ],
      note:
        "Por eso la duración es tu palanca más fuerte: recortar un clip de treinta segundos a ocho reduce el archivo unas cuatro veces, y ningún ajuste se acerca a eso.",
    },
  ],

  whyTitle: "Por qué convertir en tu propio ordenador",
  whyBullets: [
    {
      h: "No se sube nada.",
      p: "Un montaje sin publicar, la grabación de una llamada privada, una captura de pantalla con datos de un cliente: nada sale del disco. No hay copia en un servidor cuya política de retención tendrías que creerte.",
    },
    {
      h: "Sin límite de tamaño.",
      p: "Los conversores en línea se acaban entre 100 MB y 2 GB y te ponen en una cola. Una grabación de pantalla de cuatro gigas se convierte igual que una de cuatro megas.",
    },
    {
      h: "Sin esperar una subida.",
      p: "Hacer el GIF es rápido; en un servicio web lo lento es enviar el vídeo antes. En local ese paso no existe.",
    },
    {
      h: "Gratis, sin cuenta y sin marca de agua.",
      p: "Código abierto bajo GPL-3.0: sin registro, sin periodo de prueba y sin nada estampado en la esquina de tu GIF.",
    },
    {
      h: "Varios a la vez.",
      p: "Suelta una carpeta entera de clips: la cola los recorre y te dice dónde ha quedado cada GIF.",
    },
  ],

  notForTitle: "Cuándo el GIF es mala idea",
  notForLead:
    "El GIF es un formato de imagen de 1987 haciendo un trabajo que los formatos de vídeo hacen mejor. Conviene elegirlo a propósito, y estos son los casos en los que no.",
  notFor: [
    {
      h: "Necesitas sonido.",
      p: "Un GIF no tiene pista de audio en absoluto: el formato no tiene dónde ponerla. Si el clip necesita sonido, déjalo en vídeo.",
    },
    {
      h: "Necesitas color fiel.",
      p: "Un fotograma de GIF guarda como máximo 256 colores. Los degradados, los tonos de piel y las escenas oscuras se bandean de forma visible. Lo que más sufre es el material grabado; una interfaz plana o los dibujos animados casi no lo notan.",
    },
    {
      h: "El clip es largo.",
      p: "A 130 KB por segundo, un GIF de dos minutos son unos 16 MB. El mismo clip en MP4 suele ser varias veces más pequeño y verse mejor.",
    },
    {
      h: "Va a un sitio que lo va a recodificar igual.",
      p: "Varias plataformas de chat y redes convierten el GIF que subes en un vídeo por su cuenta. Ahí has pagado el precio en tamaño del GIF para nada.",
    },
  ],

  faqTitle: "Preguntas",
  faq: [
    {
      q: "¿Cuánto puede durar el GIF?",
      a: "MediaChef no pone límite: el límite es tu disco, y la aplicación comprueba el espacio libre antes de empezar. El límite práctico es el tamaño: con los ajustes por defecto cada segundo cuesta unos 130 KB, así que un GIF de un minuto son unos 8 MB y uno de cinco minutos unos 39 MB. Si va a un mensaje, recorta el clip primero.",
    },
    {
      q: "¿Por qué mi GIF pesa más que el vídeo del que salió?",
      a: "Porque el GIF guarda los fotogramas casi por separado, mientras el MP4 guarda la diferencia entre ellos. Con material grabado real eso hace que el MP4 sea varias veces más pequeño con la misma imagen. No es algo que MediaChef pueda arreglar: es lo que el formato es.",
    },
    {
      q: "¿Un GIF tiene sonido?",
      a: "No. El formato GIF no tiene pista de audio, así que el sonido se descarta al convertir. Si necesitas el sonido como archivo aparte, aplica la receta «Sacar el audio a MP3» al vídeo original.",
    },
    {
      q: "¿Por qué los colores se ven peor que en el vídeo?",
      a: "Un fotograma de GIF admite como máximo 256 colores y el vídeo tiene millones. Los degradados suaves —un cielo, un fundido, una escena oscura— se convierten en bandas visibles. Las grabaciones de pantalla y los gráficos planos casi no pierden nada, porque ya tenían pocos colores.",
    },
    {
      q: "¿Puedo hacer un GIF solo de una parte del vídeo?",
      a: "Sí, en dos pasos: con la receta «Recortar sin recodificar» sacas el fragmento que quieres y de ahí haces el GIF. Recortar primero es además la forma más barata de reducir el archivo: la duración influye más que cualquier ajuste.",
    },
    {
      q: "¿Qué fotogramas por segundo y qué ancho debo elegir?",
      a: "Empieza por los valores por defecto, 15 fotogramas y 480 píxeles: se lee en una publicación y diez segundos son unos 1,3 MB. Baja a 320 si el archivo tiene que ser pequeño y sube a 640 cuando haya texto pequeño que deba seguir legible. Usa 24 solo para movimiento rápido, y 10 para grabaciones de pantalla, donde los saltos apenas se ven.",
    },
    {
      q: "¿Cómo hago el GIF más pequeño?",
      a: "En este orden: acorta el clip, luego reduce el ancho y luego los fotogramas. La duración es lineal, así que pasar de treinta segundos a ocho ahorra unas cuatro veces. Bajar de 640 a 320 píxeles ahorra unas tres. Pasar de 24 a 15 fotogramas ahorra un tercio, pero es el cambio que más se nota.",
    },
    {
      q: "¿Hay marca de agua o versión de pago?",
      a: "No. MediaChef es código abierto bajo GPL-3.0, sin ninguna versión de pago, y no escribe nada en la imagen más allá de la conversión que has pedido.",
    },
    {
      q: "¿Funciona sin internet?",
      a: "Sí, del todo. FFmpeg viaja dentro de la descarga, así que hacer un GIF no toca la red en ningún momento. Solo la transcripción necesita descargar un modelo una vez, y esa es otra receta.",
    },
    {
      q: "¿Desde qué formatos de vídeo puedo convertir?",
      a: "Desde todo lo que FFmpeg pueda leer: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV y el resto. MediaChef comprueba el archivo con ffprobe y ofrece la receta del GIF a cualquier vídeo que tenga imagen.",
    },
    {
      q: "¿Puedo convertir varios vídeos de una vez?",
      a: "Sí. Suéltalos todos en el tablero, añade la receta y la cola los hará uno tras otro, con el avance y el tiempo restante de cada uno.",
    },
    {
      q: "¿El GIF se repite en bucle?",
      a: "Sí: los GIF escritos así se repiten indefinidamente, y así los reproducen todos los visores y navegadores.",
    },
    {
      q: "¿Puede un GIF tener fondo transparente?",
      a: "El formato admite un color transparente, pero convertir un vídeo normal no le da nada que hacer transparente: los fotogramas de vídeo son totalmente opacos. La transparencia solo tiene sentido con material que ya la tenía.",
    },
    {
      q: "¿Funciona en Windows y Linux o solo en macOS?",
      a: "En los tres. Hay instalador para Windows, AppImage y .deb para Linux, y DMG para macOS con Apple Silicon. La receta y los ajustes son idénticos en todas partes.",
    },
  ],

  ctaTitle: "Haz un GIF de ese clip",
  ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convertir MP4 a MP3 — gratis y sin conexión" },
    { page: "transcribe", label: "Transcribir audio a texto con Whisper, sin conexión" },
    { page: "catalog", label: `Las ${FACTS.recipeCount} recetas, por categorías` },
  ],
} as const;
