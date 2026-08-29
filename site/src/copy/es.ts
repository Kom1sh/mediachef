// Тексты локали «es». Структура зеркальна остальным локалям: тип UiCopy
// выведен из английского файла, поэтому пропущенное поле не соберётся.
import { FACTS } from "../facts";

export const ui = {
  title: "MediaChef — conversor de vídeo y audio sin conexión con transcripción",
  description:
    "Aplicación gratuita y de código abierto para macOS, Windows y Linux: convierte vídeo y audio en tu propio ordenador y pasa la voz a texto con Whisper. Sin subidas, sin límite de tamaño, sin suscripción.",
  nav: { recipes: "Recetas", transcribe: "Transcripción", privacy: "Sin conexión", faq: "Preguntas" },
  skipToContent: "Ir al contenido",
  heroTitle1: "Cualquier archivo, a cualquier formato.",
  heroTitle2: "La voz, a texto.",
  heroAccent: "Todo en tu ordenador.",
  heroSub:
    "MediaChef es una aplicación gratuita que convierte FFmpeg y Whisper en fichas de receta: convierte vídeo y audio, extrae el sonido de un clip, pasa una grabación a texto — sin conexión, en tu propia máquina y sin subir nada a ningún sitio.",
  trust: [
    `Versión ${FACTS.version}`,
    `${FACTS.recipeCount} recetas incluidas`,
    `${FACTS.modelCount} modelos de Whisper`,
    "macOS · Windows · Linux",
    "Código abierto · GPL-3.0",
  ],
  ctaMac: "Descargar para macOS",
  ctaWin: "Descargar para Windows",
  ctaLinux: "Descargar para Linux",
  ctaNote: "Gratis y de código abierto —",
  ctaNoteLink: "mira el código en GitHub",
  howTitle: "Cómo funciona",
  steps: [
    { n: "1", h: "Suelta un archivo", p: "Arrastra un vídeo o una grabación. MediaChef analiza el archivo y muestra solo las recetas que encajan con lo que encuentra dentro." },
    { n: "2", h: "Elige una receta", p: "Cada acción es una ficha sencilla: «Extraer audio a MP3», «Crear subtítulos SRT para un vídeo», «Comprimir vídeo». Los valores por defecto ya son razonables y la vista previa muestra el comando exacto de FFmpeg." },
    { n: "3", h: "Recoge el resultado", p: "El archivo aparece junto al original — o en la carpeta que elijas. La cola muestra el progreso, el tiempo restante y dónde ha quedado el resultado." },
  ],
  shotAlt:
    "Pantalla principal de MediaChef: menú lateral con Conversión, Modelos y Ajustes, un tablero para soltar archivos y la cola de tareas a la derecha.",
  shotCaption:
    "La ventana real, en el mismo tema con el que estás leyendo. El tablero en el centro, la cola a la derecha y los motores ya dentro.",
  outTitle: "Lo que hace nada más instalarlo",
  outLead:
    "La aplicación incluye diecisiete recetas. Cada una es una tarea real de FFmpeg o Whisper con los parámetros ya puestos, y cada una deja su resultado junto a tu archivo como {nombre}.{qué}.{extensión}.",
  outHead: ["Dirección", "Receta en la aplicación", "Lo que obtienes"],
  outRows: [
    ["Vídeo → audio", "Extraer audio a MP3", "<code>clip.audio.mp3</code> a 128, 192 o 320 kbps"],
    ["Vídeo → subtítulos", "Crear subtítulos SRT para un vídeo", "<code>clip.subs.srt</code> con tiempos"],
    ["Audio → texto", "Transcribir audio a texto", "<code>talk.transcript.txt</code>, texto plano"],
    ["Cualquier idioma → inglés", "Traducir la voz a texto en inglés", "<code>talk.english.txt</code> en una sola pasada"],
    ["MP4 → MKV", "Convertir MP4 a MKV", "Reempaquetado, no recodificado — segundos y sin pérdida"],
    ["Vídeo → más pequeño", "Comprimir vídeo (ajuste de calidad)", "H.264 con CRF 23, 28 o 33"],
    ["Vídeo → GIF", "Vídeo a GIF", "10–24 fps, ancho 320–640"],
    ["Todo lo demás", "Comando propio de FFmpeg", "Tus propios argumentos, con vista previa del comando"],
  ],
  modelsTitle: "Modelos de Whisper",
  modelsLead:
    "La transcripción funciona con whisper.cpp y los modelos Whisper de OpenAI. Descargas un modelo una vez desde la pantalla Modelos; a partir de ahí todo funciona con la red apagada. Modelo más grande, mejor texto, más tiempo de cálculo.",
  modelsHead: ["Modelo", "Descarga", "Para qué sirve"],
  modelSizes: {
    tiny: "78 MB",
    base: "148 MB",
    small: "488 MB",
    "large-v3-turbo": "1,62 GB",
  },
  modelNotes: {
    tiny: "El más rápido, calidad aproximada. Un borrador de voz clara en una fracción del tiempo.",
    base: "Rápido, calidad correcta. Suficiente para buscar en una grabación el fragmento que necesitas.",
    small: "El equilibrio recomendado — el valor por defecto en todas las recetas de transcripción.",
    "large-v3-turbo": "La mejor calidad, optimizado para Apple Silicon. Para texto que vas a publicar.",
  },
  defaultTag: "por defecto",
  recipesTitle: "Recetas en lugar de comandos",
  recipesLead:
    "FFmpeg puede hacer casi todo — en el idioma del terminal. MediaChef traduce: tú eliges qué hacer y los parámetros ya están puestos. La vista previa muestra el comando real, así que de paso aprendes.",
  recipes: [
    { tile: "tile-ochre", h: "Extraer audio a MP3", p: "Saca la pista de sonido de cualquier vídeo." },
    { tile: "tile-green", h: "Crear subtítulos SRT", p: "Whisper escucha y escribe un archivo SRT." },
    { tile: "tile-green", h: "Comprimir vídeo", p: "Ajusta un clip al tamaño que admite la mensajería." },
    { tile: "tile-purple", h: "Vídeo a GIF", p: "Un GIF nítido en bucle, de 10 a 24 fps." },
    { tile: "tile-green", h: "Transcribir audio a texto", p: "Una reunión o una nota de voz en texto plano." },
    { tile: "tile-blue", h: "Traducir la voz al inglés", p: "Whisper transcribe y traduce en una sola pasada." },
    { tile: "tile-blue", h: "Convertir MP4 a MKV", p: "Reempaqueta sin recodificar — al instante." },
    { tile: "tile-red", h: "Quitar el audio de un vídeo", p: "Elimina todas las pistas de audio y deja la imagen." },
  ],
  trTitle: "Transcribe audio a texto sin salir de tu equipo",
  trBullets: [
    { h: "Whisper, ejecutándose en local.", p: "El modelo de voz de OpenAI se ejecuta en tu propio procesador con whisper.cpp: las grabaciones no salen de la máquina." },
    { h: "Modelos descargados en la app.", p: "Desde tiny, de 78 MB, hasta large-v3-turbo, de 1,62 GB — elige según la tarea en la pantalla Modelos." },
    { h: "Texto o subtítulos.", p: "TXT plano, SRT y VTT con marcas de tiempo, o JSON con los tiempos de cada segmento para tus herramientas." },
    { h: "Resultados honestos.", p: "Si un archivo no tiene voz, MediaChef dice «No se ha detectado voz» — nunca entrega un archivo vacío con una marca verde." },
  ],
  recipesLink: "Guía completa: convertir MP4 a MP3 →",
  catalogLink: `Las ${FACTS.recipeCount} recetas, por categorías →`,
  trLink: "Guía completa: transcribir audio a texto →",
  privTitle: "Tus archivos no viajan a ninguna parte",
  privLead:
    "Un conversor online te pide subir el archivo al servidor de otro, esperar en una cola y confiar en su política de retención. MediaChef trabaja en tu CPU: un gigabyte de grabación de pantalla y el audio privado de una reunión se convierten igual — con el Wi-Fi apagado.",
  privChips: ["Sin subidas", "Sin límite de tamaño", "Sin suscripciones"],
  ossTitle: "Código abierto, motores incluidos",
  ossLead:
    "GPL-3.0, con todo el historial de desarrollo público en GitHub. Desde la 0.4.0 cada descarga lleva sus propios motores — nada que instalar en el PATH, nada que configurar.",
  engineRows: [
    { k: `FFmpeg ${FACTS.ffmpeg}`, v: "conversión · GPL v3" },
    { k: `whisper.cpp ${FACTS.whisper}`, v: "reconocimiento de voz · MIT" },
    { k: "macOS · Windows · Linux", v: "dmg ~66 MB · instalador ~82 MB · AppImage ~181 MB · deb ~118 MB" },
  ],
  ossNotice: "Versiones y licencias exactas de todo lo incluido — NOTICE.md",
  faqTitle: "Preguntas frecuentes",
  faq: [
    { q: "¿De verdad es gratis?", a: "Sí. MediaChef es código abierto bajo GPL-3.0: sin cuenta, sin periodo de prueba, sin marca de agua. El conversor y la transcripción son toda la aplicación, y el código es público en GitHub." },
    { q: "¿Qué formatos admite?", a: "Todo lo que lee FFmpeg: MP4, MKV, MOV, WebM, AVI, TS, MP3, WAV, FLAC, M4A, OGG y decenas más. MediaChef analiza el archivo con ffprobe en lugar de fiarse de la extensión, así que las recetas que ves son las que de verdad encajan." },
    { q: "¿Dónde se suben mis archivos?", a: "A ningún sitio. La conversión y la transcripción se ejecutan íntegramente en tu ordenador. Lo único que MediaChef descarga alguna vez es un modelo de Whisper — una sola vez, en la pantalla Modelos." },
    { q: "¿Qué precisión tiene la transcripción?", a: "Usa los modelos Whisper de OpenAI a través de whisper.cpp v1.7.6. La precisión depende del modelo que elijas: tiny es instantáneo y aproximado, small es el equilibrio por defecto y large-v3-turbo roza el nivel humano con voz clara. El idioma se detecta automáticamente." },
    { q: "¿Funciona sin conexión?", a: "Sí. FFmpeg y Whisper viajan dentro de la descarga, así que la conversión funciona sin conexión desde el primer arranque, y la transcripción también en cuanto hayas descargado un modelo una vez." },
    { q: "¿Por qué no usar un conversor online?", a: "Para un archivo pequeño y público, un conversor online está bien. Las grabaciones privadas, los vídeos de varios gigabytes, los lotes y cualquier cosa bajo acuerdo de confidencialidad se hacen mejor en local: sin espera de subida, sin tope de tamaño y sin nada guardado en el disco de otro." },
  ],
  finalTitle: "Pon un chef al mando de tus archivos",
  finalSub: `Gratis, código abierto, ${FACTS.platformCount} plataformas. Versión ${FACTS.version}.`,
  betaNote:
    "MediaChef es joven: las compilaciones todavía no están firmadas por Apple ni por Microsoft, así que el primer arranque pide confirmación — dentro de cada descarga hay unas instrucciones en texto plano.",
  footRights: "© 2026 mediachef.app · GPL-3.0",
  footTagline: "Una cocina de medios de código abierto.",
  tocLabel: "En esta página",
  breadcrumbHome: "Inicio",
  alsoLabel: "Sigue leyendo",
  footNavLabel: "Enlaces del proyecto",

  menu: {
    navLabel: "Sitio",
    menu: "Menú",
    features: "Funciones",
    guides: "Guías",
    download: "Descargar",
    faq: "Preguntas",
    gConvert: "Conversión",
    gTranscribe: "Transcripción",
    gTrust: "Privacidad y código",
    gMac: "macOS",
    gWin: "Windows",
    gLinux: "Linux",
    allFiles: "Todos los archivos y notas de la versión",
    footProduct: "Producto",
    footGuides: "Guías",
    footDownload: "Descargar",
    footProject: "Proyecto",
    footBlurb: `Una cocina de medios gratuita para macOS, Windows y Linux. FFmpeg ${FACTS.ffmpeg} y whisper.cpp ${FACTS.whisper} viajan dentro de la descarga — no hay nada que instalar aparte.`,
    license: "Licencia GPL-3.0",
    notice: "Qué lleva dentro — NOTICE.md",
    sourceCode: "Código fuente en GitHub",
    releases: "Todas las versiones",
    langLabel: "Idioma",
    // Подпись на схеме окна приложения в hero.
    dropHere: "Suelta los archivos aquí",
    dlWin: "Windows · instalador",
    nApple: "Apple Silicon",
    nZip: "Apple Silicon, sin instalador",
    nWin: "64 bits",
    nAppimage: "x86_64, se ejecuta tal cual",
    nDeb: "x86_64, Debian y Ubuntu",
    sHow: "Cómo funciona",
    sRecipes: "Recetas",
    sOut: "Lo que hace nada más instalarlo",
    sTranscribe: "Transcripción",
    sModels: "Modelos de Whisper",
    sPrivacy: "Sin conexión y privado",
    sOss: "Código abierto",
    sFaq: "Preguntas",
    pMp3: "MP4 a MP3",
    pTranscribe: "Audio a texto",
  },
};

export const landings = {
  mp3: {
    title: "Convertir MP4 a MP3 gratis y sin conexión — MediaChef",
    description:
      "Extrae el audio de un MP4 y guárdalo como MP3 en tu propio ordenador: sin subidas, sin tope de tamaño, sin marca de agua. Aplicación gratuita y de código abierto para macOS, Windows y Linux.",
    h1: "Convertir MP4 a MP3 — gratis, sin conexión, en tu ordenador",
    crumb: "MP4 a MP3",
    lead:
      "MediaChef trae una receta llamada «Extraer audio a MP3». Suelta un vídeo en el tablero, elige un bitrate y pulsa iniciar: la pista de sonido se escribe junto al original como MP3. El archivo no sale nunca de tu máquina, no hay límite de tamaño y todo funciona con la red apagada.",
    sections: { how: "how", table: "bitrate", why: "offline", faq: "faq" },
    toc: ["Cómo convertir MP4 a MP3", "Qué bitrate elegir", "Por qué convertir en tu ordenador", "Preguntas"],
    stepsTitle: "Cómo convertir MP4 a MP3",
    steps: [
      { h: "Descarga MediaChef", p: "Un archivo para macOS, Windows o Linux. FFmpeg ya viene dentro — nada que instalar aparte, nada que añadir al PATH." },
      { h: "Suelta el MP4 en el tablero", p: "MediaChef lee el archivo con ffprobe y deja solo las recetas que le encajan. Un vídeo con pista de audio recibe la ficha de MP3 de inmediato." },
      { h: "Elige «Extraer audio a MP3»", p: "Escoge el bitrate: 128k para voz, 192k por defecto, 320k para archivar. La vista previa del comando se actualiza al cambiarlo." },
      { h: "Pulsa iniciar y recoge el archivo", p: "El MP3 aparece junto al vídeo como clip.audio.mp3. La cola muestra el progreso, el tiempo restante y la ruta final." },
    ],
    shotAlt:
      "MediaChef listo para convertir MP4 a MP3: el tablero esperando un archivo de vídeo, con la cola de tareas a la derecha.",
    shotCaption: "El tablero donde va el MP4. Las recetas aparecen en cuanto MediaChef ha leído el archivo.",
    tableTitle: "Qué bitrate elegir",
    tableLead:
      "La receta ofrece tres bitrates. Los tamaños de abajo son para una hora de audio — es aritmética del bitrate, así que una grabación de dos horas simplemente pesa el doble.",
    tableHead: ["Bitrate", "Una hora de audio", "Elígelo cuando"],
    tableRows: [
      ["128 kbps", "≈ 58 MB", "Voz: entrevistas, pódcast, clases, notas de voz. El archivo más pequeño, sin coste audible en una voz."],
      ["192 kbps", "≈ 86 MB", "El valor por defecto. Música que realmente escuchas, y cualquier cosa de la que no estés seguro."],
      ["320 kbps", "≈ 144 MB", "Archivar, o audio que vas a seguir editando y volver a codificar más adelante."],
    ],
    tableNote:
      "No solo MP4: la misma receta aparece para MKV, MOV, WebM, AVI, TS y cualquier otra cosa que FFmpeg sepa leer, siempre que el archivo tenga pista de audio.",
    whyTitle: "Por qué convertir en tu ordenador",
    whyBullets: [
      { h: "No se sube nada.", p: "Una llamada grabada o un montaje sin publicar se queda en tu disco. No hay copia en un servidor sobre cuya política de retención haya que confiar." },
      { h: "Sin tope de tamaño.", p: "Los conversores online se paran entre 100 MB y 2 GB y te ponen en una cola. Una grabación de pantalla de cuatro gigabytes se convierte igual que una de cuatro megabytes." },
      { h: "Más rápido con archivos reales.", p: "Extraer una pista de audio que ya existe es rápido. Lo lento es subir el vídeo antes — y en local esa parte no existe." },
      { h: "Gratis y sin cuenta.", p: "Código abierto GPL-3.0: sin registro, sin prueba, sin marca de agua, sin límite por archivo." },
      { h: "Por lotes, no de uno en uno.", p: "Suelta todos los clips en el tablero a la vez; la cola los procesa y te dice dónde ha quedado cada MP3." },
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      { q: "¿Se pierde calidad al convertir MP4 a MP3?", a: "MP3 es un formato con pérdida, así que la pista se vuelve a codificar una vez. Con los 192 kbps por defecto eso es inaudible en voz y muy cercano a inaudible en música. Si el archivo es un máster con el que vas a seguir trabajando, elige 320 kbps." },
      { q: "¿Cuál es el archivo más grande que puedo convertir?", a: "MediaChef no pone límite: el límite es tu espacio libre en disco, y la aplicación lo comprueba antes de empezar. La duración tampoco importa: una grabación de tres horas es una sola tarea en la cola." },
      { q: "¿Funciona sin internet?", a: "Sí, del todo. FFmpeg viaja dentro de la descarga, así que la conversión no toca la red en ningún momento. Solo la transcripción necesita descargar un modelo una vez." },
      { q: "¿Puedo convertir varios vídeos a la vez?", a: "Sí. Suéltalos todos en el tablero, añade la receta y la cola los ejecuta uno tras otro con progreso y tiempo restante para cada uno." },
      { q: "¿Hay marca de agua o versión de pago?", a: "No. MediaChef es código abierto GPL-3.0 sin ninguna versión de pago, y no toca tu audio más allá de la conversión que le has pedido." },
      { q: "Si paso un MP4 a MP3, ¿se queda el vídeo original?", a: "Sí. MediaChef lee el vídeo y escribe un MP3 nuevo al lado: el MP4 no se sobrescribe, ni se renombra, ni se borra, así que puedes sacar el audio del mismo archivo las veces que quieras. Tampoco se sube nada, todo funciona sin internet." },
    ],
    ctaTitle: "Saca el MP3 de ese vídeo",
    ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
    also: [
      { page: "catalog", label: "El catálogo completo de recetas, por categorías" },
      { page: "transcribe", label: "Transcribir audio a texto — sin conexión, con Whisper" },
      { page: "home", label: `Las ${FACTS.recipeCount} recetas y cómo funciona MediaChef` },
    ],
  },
  transcribe: {
    title: "Transcribir audio a texto sin conexión con Whisper — MediaChef",
    description:
      "Convierte grabaciones en texto en tu propio ordenador con Whisper: TXT, SRT, VTT o JSON. Sin subidas, sin tarifa por minuto, sin límite de duración. Aplicación gratuita para macOS, Windows y Linux.",
    h1: "Transcribir audio a texto — sin conexión, en tu propio ordenador",
    crumb: "Audio a texto",
    lead:
      "MediaChef ejecuta Whisper de OpenAI en local a través de whisper.cpp. Descarga un modelo una vez, suelta una grabación o un vídeo en el tablero y elige qué quieres obtener: texto plano, subtítulos SRT o VTT con tiempos, o JSON con el tiempo de cada segmento. El audio no se sube nunca y no hay precio por minuto.",
    sections: { how: "how", table: "models", why: "offline", faq: "faq" },
    toc: ["Cómo transcribir una grabación", "Qué modelo de Whisper elegir", "Por qué transcribir en tu ordenador", "Preguntas"],
    outLabel: "Lo que obtienes",
    outSample: "00:00:04  Hola a todos, empezamos…\n00:00:11  Primer punto: los planes del trimestre.\n00:00:19  Hay tres escenarios, os enseño la tabla.",
    outNote: "TXT sin tiempos, SRT y VTT con ellos, JSON con el inicio y el final de cada segmento.",
    stepsTitle: "Cómo transcribir una grabación",
    steps: [
      { h: "Descarga MediaChef", p: "Un archivo para macOS, Windows o Linux. whisper.cpp v1.7.6 ya viene dentro de la descarga; solo el modelo se baja aparte." },
      { h: "Elige un modelo de Whisper", p: "Abre Modelos y descarga uno — small (488 MB) es el equilibrio por defecto. Se descarga una vez; después la transcripción funciona con la red apagada." },
      { h: "Suelta la grabación o el vídeo", p: "Sirven tanto audio como vídeo: MediaChef extrae el sonido del vídeo por su cuenta, así que la grabación de una reunión y un MP4 siguen el mismo camino." },
      { h: "Elige la salida que necesitas", p: "«Transcribir audio a texto» para TXT, «Transcribir audio a subtítulos SRT» o «Transcribir audio a WebVTT» para subtítulos con tiempos, «Transcribir audio a JSON con tiempos» para herramientas." },
      { h: "Pulsa iniciar y lee el resultado", p: "El texto aparece junto al archivo como talk.transcript.txt. La cola muestra el progreso; si en el archivo no hay voz, MediaChef lo dice en lugar de escribir uno vacío." },
    ],
    shotAlt:
      "MediaChef antes de transcribir: el tablero para soltar una grabación, con Modelos en el menú lateral, desde donde se descargan los modelos de Whisper.",
    shotCaption: "Los modelos viven en el menú lateral: descarga una vez y transcribe sin conexión a partir de entonces.",
    tableTitle: "Qué modelo de Whisper elegir",
    tableLead:
      "El catálogo trae cuatro modelos, que se descargan dentro de la aplicación. Más grande significa mejor texto y más tiempo de cálculo en la misma máquina, así que elige según la tarea y no de una vez para siempre.",
    tableHead: ["Modelo", "Descarga", "Cuándo elegirlo"],
    tableRows: [
      ["tiny", "78 MB", "Una primera pasada sobre voz clara, o cuando solo necesitas localizar dónde empieza un tema."],
      ["base", "148 MB", "Notas para ti: texto legible que vas a repasar y editar de todos modos."],
      ["small", "488 MB", "El valor por defecto en todas las recetas de transcripción, y el que casi todo el mundo se queda. Entrevistas, reuniones, clases."],
      ["large-v3-turbo", "1,62 GB", "Texto que va a leer otra persona: subtítulos que publicas, citas que reproduces. Optimizado para Apple Silicon."],
    ],
    tableNote:
      "El idioma se detecta automáticamente, y también puedes fijarlo. Dos recetas adicionales traducen cualquier idioma al inglés — como texto o como subtítulos con tiempos — en la misma pasada.",
    whyTitle: "Por qué transcribir en tu ordenador",
    whyBullets: [
      { h: "El audio confidencial sigue siendo confidencial.", p: "Entrevistas, notas clínicas, llamadas jurídicas, cualquier cosa bajo acuerdo de confidencialidad: el archivo lo lee un proceso de tu propia máquina y nadie más." },
      { h: "Sin precio por minuto.", p: "La transcripción en la nube factura por minuto. En local, la décima hora de audio cuesta lo mismo que la primera: nada." },
      { h: "Sin límite de duración ni de tamaño.", p: "Una grabación de cuatro horas es una tarea en la cola, no un plan de pago ni un apaño de partir el archivo." },
      { h: "Funciona sin red alguna.", p: "Una vez que el modelo está en disco, la transcripción es sin conexión: en un avión, en un laboratorio, en una máquina aislada." },
      { h: "Subtítulos y texto de la misma pasada.", p: "SRT y VTT llevan los tiempos para un reproductor, TXT es prosa limpia y JSON trae los tiempos de cada segmento para tus propios scripts." },
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      { q: "¿Qué precisión tiene la transcripción de Whisper?", a: "La precisión depende del modelo: tiny es un borrador, small es el equilibrio por defecto y large-v3-turbo roza el nivel humano con voz clara. El audio limpio de un solo hablante es el que mejor sale; los acentos marcados, la gente hablando a la vez y la música bajo la voz restan precisión — como en cualquier reconocedor de voz." },
      { q: "¿Qué idiomas admite?", a: "Whisper cubre alrededor de cien idiomas y detecta el idioma por su cuenta; también puedes fijarlo si acierta mal. Dos recetas traducen la voz en cualquiera de ellos al inglés en una sola pasada, como texto o como subtítulos SRT." },
      { q: "¿En qué formatos sale la transcripción?", a: "TXT para texto plano, SRT y VTT con marcas de tiempo para reproductores y editores de vídeo, y JSON con el inicio y el final de cada segmento para scripts y herramientas." },
      { q: "¿Necesito internet?", a: "Una vez, para descargar un modelo de Whisper en la pantalla Modelos — de 78 MB a 1,62 GB según cuál elijas. Después la transcripción funciona íntegramente sin conexión." },
      { q: "¿Y si la grabación no tiene voz?", a: "MediaChef informa de que «No se ha detectado voz» en lugar de escribir un archivo vacío y marcar la tarea en verde. El silencio, la música sin voces y un archivo elegido por error terminan igual de honestamente." },
      { q: "¿Puedo pasar un vídeo a texto o solo audio?", a: "El vídeo funciona igual. MediaChef saca el sonido del propio archivo, así que un MP4, MKV o MOV va directo a la transcripción: hay incluso una receta aparte, «Sacar el texto de un vídeo». No hace falta convertirlo antes a audio." },
    ],
    ctaTitle: "Convierte esa grabación en texto",
    ctaSub: `MediaChef ${FACTS.version} — Whisper en local, gratis y de código abierto.`,
    also: [
      { page: "catalog", label: "El catálogo completo de recetas, por categorías" },
      { page: "mp3", label: "Convertir MP4 a MP3 — gratis y sin conexión" },
      { page: "home", label: `Las ${FACTS.recipeCount} recetas y cómo funciona MediaChef` },
    ],
  },
};

/** Каталог рецептов: /<locale>/<slug>/. Названия рецептов, описания и алиасы
 *  берутся из recipes/*.yaml — здесь только обвязка страницы. */
export const catalog = {
  title: `Las ${FACTS.recipeCount} recetas de MediaChef — vídeo, audio y transcripción`,
  description: "Todas las recetas que trae MediaChef: convertir vídeo y audio, comprimir, recortar, cambiar el tamaño, sacar el sonido, hacer un GIF, transcribir voz a texto con Whisper. Gratis, código abierto, funciona sin conexión en macOS, Windows y Linux.",
  h1: `Las ${FACTS.recipeCount} recetas`,
  crumb: "Recetas",
  lead: "MediaChef no te obliga a aprender parámetros. Cada tarea es una ficha: suelta el archivo, elige la ficha, pulsa empezar. Este es el catálogo completo tal cual viene: qué acepta cada receta, qué devuelve y qué puedes escribir en el buscador de la aplicación para encontrarla.",
  // Разделы страницы. Категории из YAML сведены в них по смыслу
  // результата — см. BUCKET в recipes.ts.
  sections: {
    speech: "Voz, texto y subtítulos",
    video: "Vídeo",
    audio: "Audio",
    advanced: "Avanzado",
  },
  // Названия категорий совпадают с теми, что человек увидит в самом приложении.
  cats: {
    "extract": "Extraer",
    "transcribe": "Transcribir",
    "convert-video": "Convertir vídeo",
    "convert-audio": "Convertir audio",
    "compress": "Comprimir",
    "cut": "Recortar",
    "geometry": "Tamaño",
    "gif": "GIF",
    "audio-in-video": "Audio del vídeo",
    "advanced": "Avanzado",
  },
  accepts: "Acepta",
  produces: "Devuelve",
  settings: "Ajustes",
  searchAs: "También se encuentra por",
  types: { video: "vídeo", audio: "audio", any: "cualquier archivo" },
  noParams: "Nada que ajustar.",
  ctaTitle: "Llévate el conjunto entero",
  ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convertir MP4 a MP3 — gratis y sin conexión" },
    { page: "transcribe", label: "Transcribir audio a texto — sin conexión, con Whisper" },
  ],
};

export default { ui, landings, catalog };
