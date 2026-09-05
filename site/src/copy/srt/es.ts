// Гайд «видео в субтитры», испанский. Реальные запросы: «como poner subtitulos
// a un video», «generar subtitulos automaticos», «video a srt».
import { FACTS } from "../../facts";

export default {
  title: "Subtítulos SRT desde un vídeo — gratis, sin conexión, en tu ordenador",
  description:
    "Cómo sacar de un vídeo subtítulos SRT con tiempos sin subirlo a ningún sitio. Con mediciones reales: los cuatro modelos de Whisper cronometrados uno al lado del otro, cuánto ocupan las líneas que salen y qué contiene de verdad cada uno de los cuatro formatos.",
  h1: "Generar subtítulos SRT desde un vídeo",
  crumb: "Vídeo a SRT",

  answer:
    "Arrastra el vídeo a MediaChef, elige «Crear subtítulos SRT para un vídeo», deja el modelo en small y el idioma en automático, y ejecútalo. Junto al vídeo aparecerá un archivo .srt ya con sus tiempos. Todo se calcula en tu máquina: la voz no sale del disco y, una vez descargado el modelo, la receta funciona con la red apagada. En un portátil con M5, 2 minutos y 43 segundos de habla tardaron 6,2 segundos con el modelo por defecto —unas 26 veces más rápido que el tiempo real— y dieron 73 líneas de 39 caracteres de media, lo bastante cortas para leerlas con calma.",

  facts: [
    { k: "Qué necesitas", v: `MediaChef ${FACTS.version} más una descarga única del modelo` },
    { k: "Modelo por defecto", v: "small — 488 MB, se descarga una vez y se queda" },
    { k: "Velocidad", v: "≈26× el tiempo real con el modelo por defecto (medido, M5)" },
    { k: "Funciona sin conexión", v: "Sí, en cuanto el modelo está en el disco" },
    { k: "Formatos", v: "SRT, VTT, TXT normal y JSON — una receta para cada uno" },
    { k: "Qué obtienes", v: "clip.subs.srt junto al vídeo, y el vídeo intacto" },
  ],

  toc: [
    { id: "how", label: "Cómo hacerlo" },
    { id: "models", label: "Qué modelo elegir" },
    { id: "cues", label: "Cómo salen de largas las líneas" },
    { id: "formats", label: "SRT, VTT, TXT o JSON" },
    { id: "recipes", label: "Qué receta para cada caso" },
    { id: "why", label: "Por qué hacerlo en local" },
    { id: "notfor", label: "Cuándo no es la herramienta" },
    { id: "faq", label: "Preguntas" },
  ],

  stepsTitle: "Cómo hacer subtítulos para un vídeo",
  steps: [
    {
      h: "Descarga MediaChef",
      p: "Un archivo para macOS, Windows o Linux. Tanto FFmpeg como el motor de Whisper viajan dentro de la descarga: no hay nada que instalar aparte ni nada que añadir al PATH.",
    },
    {
      h: "Descarga un modelo, una sola vez",
      p: "La primera transcripción te pedirá un modelo de voz. Por defecto es small, de 488 MB, y es con el que están hechas estas mediciones; tiny ocupa 78 MB, base 148 MB y large-v3-turbo 1,62 GB. Se descarga una vez, se queda en el disco y a partir de ahí la receta ya no toca la red.",
    },
    {
      h: "Suelta el vídeo y elige la receta",
      p: "«Crear subtítulos SRT para un vídeo» acepta el vídeo directamente: no hace falta extraer el audio antes. MediaChef decodifica la pista al mono de 16 kHz que Whisper exige, en una carpeta temporal que nunca llegas a ver.",
    },
    {
      h: "Ejecútalo y abre el .srt",
      p: "El archivo aparece junto al vídeo con el nombre clip.subs.srt, con las líneas numeradas y sus tiempos. Reproductores, editores y plataformas lo leen tal cual y, como es texto plano, puedes corregir un nombre o un término en cualquier editor.",
    },
  ],
  shotAlt:
    "MediaChef listo para convertir: la mesa de trabajo espera un archivo de vídeo, la cola de tareas está a la derecha.",
  shotCaption: "La mesa donde cae el vídeo. Las recetas aparecen cuando MediaChef ha leído el archivo.",

  tables: [
    {
      id: "models",
      title: "Qué modelo elegir",
      lead:
        "Cuatro modelos, los mismos 2 minutos y 43 segundos de habla, la misma máquina: un portátil con M5 y 16 GB, cada modelo calentado antes y quedándonos con la mejor de dos pasadas.",
      head: ["Modelo", "Descarga", "Tiempo", "Frente al tiempo real", "Palabras falladas"],
      rows: [
        ["tiny", "78 MB", "2,1 s", "×78", "5 de 540"],
        ["base", "148 MB", "2,6 s", "×63", "3 de 540"],
        ["small — el de por defecto", "488 MB", "6,2 s", "×26", "0 de 540"],
        ["large-v3-turbo", "1,62 GB", "11,5 s", "×14", "1 de 540"],
      ],
      note:
        "Lee la última columna con cuidado, porque el audio de prueba es una voz sintetizada leyendo un texto preparado: sin acento, sin ruido de fondo y sin nadie hablando encima. Por eso aquí hasta el modelo más pequeño acierta casi todo, y eso no se parece a la grabación de una reunión real: con audio difícil la distancia entre estos modelos se abre mucho. La columna del tiempo, en cambio, se traslada tal cual a tu caso. Y algo que la comparación en bruto esconde: casi todas las discrepancias eran números escritos en cifras en vez de en letras —large-v3-turbo escribió «70», «10», «50», «30» donde el texto los decía completos—, y eso es formato, no un error de oído.",
    },
    {
      id: "cues",
      title: "Cómo salen de largas las líneas",
      lead:
        "Un subtítulo técnicamente correcto puede ser igualmente inservible si echa veinte palabras a la pantalla de golpe. Los modelos trocean el mismo discurso de maneras muy distintas, y esto está medido en la misma pasada de arriba.",
      head: ["Modelo", "Líneas", "Duración media", "Caracteres de media", "La más larga"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 caracteres"],
        ["base", "35", "4,7 s", "83", "100 caracteres"],
        ["small — el de por defecto", "73", "2,2 s", "39", "58 caracteres"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 caracteres"],
      ],
      note:
        "La norma habitual en televisión ronda los 42 caracteres por línea en dos líneas, es decir, unos 84 caracteres en pantalla a la vez. Con esa medida, de los cuatro solo small entra con holgura: 39 caracteres de media y 58 en la línea más larga, mientras que large-v3-turbo se pasa del límite ya en una línea corriente. Así que el modelo por defecto no es solo el equilibrado en acierto: también trocea el habla en los pedazos más legibles.",
    },
    {
      id: "formats",
      title: "SRT, VTT, texto plano o JSON",
      lead:
        "La misma transcripción escrita de cuatro maneras. Los tamaños salen de los mismos 2 minutos y 43 segundos de habla, así que se comparan directamente.",
      head: ["Formato", "Tamaño", "Qué lleva dentro", "Cuándo usarlo"],
      rows: [
        ["SRT", "5,5 KB", "Líneas numeradas, tiempos con coma: 00:00:00,000", "Casi siempre. Lo aceptan reproductores, editores y plataformas"],
        ["VTT", "5,3 KB", "Cabecera WEBVTT, tiempos con punto: 00:00:00.000", "Subtítulos para un reproductor web, la pista del navegador"],
        ["TXT", "3,0 KB", "Texto corrido, sin tiempos de ningún tipo", "Quieres las palabras, no los subtítulos"],
        ["JSON", "15,2 KB", "Cada línea más el modelo y los parámetros usados", "Esto lo va a leer un programa, no una persona"],
      ],
      note:
        "SRT y VTT se diferencian sobre todo en el carácter que separa segundos y milisegundos, así que si un reproductor rechaza uno, el otro es cambiar de receta y no volver a transcribir. El JSON pesa unas tres veces más que el SRT porque lleva los datos de la pasada junto al texto.",
    },
    {
      id: "recipes",
      title: "Qué receta para cada caso",
      lead:
        `Los subtítulos no son una receta sino varias, y elegir la correcta te ahorra un paso. Todas están en el catálogo de ${FACTS.recipeCount} recetas.`,
      head: ["Qué tienes", "Qué quieres", "Receta"],
      rows: [
        ["Un vídeo", "Subtítulos a su lado", "Crear subtítulos SRT para un vídeo"],
        ["Un archivo de audio", "Subtítulos", "Transcribir audio a subtítulos SRT"],
        ["Voz en otro idioma", "Subtítulos en inglés de una pasada", "Traducir la voz a subtítulos en inglés"],
        ["Cualquier cosa con voz", "Solo el texto", "Transcribir audio a texto"],
        ["Cualquier cosa con voz", "Una pista para reproductor web", "Transcribir audio a WebVTT"],
      ],
      note:
        "La receta de traducción va de la voz extranjera directamente a subtítulos en inglés con tiempos, en una sola pasada: no hay que transcribir primero y traducir después. Eso sí, solo va al inglés; es un límite del modelo, no de la aplicación.",
    },
  ],

  whyTitle: "Por qué hacer los subtítulos en tu propio ordenador",
  whyBullets: [
    {
      h: "La voz no sale de tu disco.",
      p: "Las grabaciones de reuniones, entrevistas y llamadas son el tipo de archivo más delicado que maneja la mayoría, y una transcripción en línea es por definición una copia de esa conversación en el servidor de otro. Aquí no hay subida sobre la que pensar.",
    },
    {
      h: "Nada de pagar por minuto.",
      p: "Los servicios de transcripción cobran por minuto de audio, y eso convierte un archivo largo en una factura de verdad. La descarga del modelo es única y, después, una grabación de dos horas cuesta lo mismo que una de dos minutos: nada.",
    },
    {
      h: "Funciona con la red apagada.",
      p: "En cuanto el archivo del modelo está en el disco, esta receta no toca internet para nada. Funciona en un avión, en un equipo cerrado y en una sala donde el wifi es lo menos fiable que hay.",
    },
    {
      h: "Sin límite de duración.",
      p: "Los transcriptores web gratuitos suelen cortarte a unos pocos minutos por archivo, justo cuando una grabación merece transcribirse precisamente por ser larga. Aquí no hay tope.",
    },
    {
      h: "Una carpeta entera de golpe.",
      p: "Suelta un directorio de grabaciones y la cola las irá procesando una a una, diciéndote dónde ha quedado cada archivo de subtítulos.",
    },
  ],

  notForTitle: "Cuándo no es la herramienta adecuada",
  notForLead:
    "La receta escribe un archivo de subtítulos. Eso es más estrecho que «poner subtítulos a un vídeo», y la diferencia importa en estos casos.",
  notFor: [
    {
      h: "Quieres los subtítulos incrustados en la imagen.",
      p: "Aquí sale un .srt aparte que el reproductor carga junto al vídeo. Grabar el texto dentro de los fotogramas es otra operación: recodifica el vídeo, y luego esas palabras ya no se pueden apagar ni corregir.",
    },
    {
      h: "Necesitas precisión de emisión.",
      p: "Incluso con el audio limpio de las mediciones de arriba los modelos tropezaron en unas cuantas palabras, y las grabaciones reales son más duras. Todo lo que se publica bajo una exigencia legal de accesibilidad lo repasa una persona antes de salir, sea lo que sea que hiciera el borrador.",
    },
    {
      h: "El audio es realmente malo.",
      p: "Mucha gente hablando encima, la grabación de una sala hecha con el móvil o música más alta que la voz tumbarán a los cuatro modelos. Arreglar antes el audio —aunque solo sea extraer una pista más limpia— hace más por el resultado que subir de tamaño de modelo.",
    },
    {
      h: "Necesitas traducción a algo que no sea el inglés.",
      p: "Whisper traduce al inglés y solo al inglés. Para cualquier otro idioma de destino, transcribe primero en el idioma original y traduce ese texto con una herramienta pensada para eso.",
    },
  ],

  faqTitle: "Preguntas",
  faq: [
    {
      q: "¿Esto es gratis?",
      a: `Sí, todo. MediaChef es de código abierto bajo GPL-3.0: no hay versión de pago, ni cobro por minuto, ni tope de duración. Los modelos también se descargan gratis. La versión actual es la ${FACTS.version}.`,
    },
    {
      q: "¿Se sube mi vídeo a algún sitio?",
      a: "No. La voz la procesa un archivo de modelo que está en tu propio disco. Lo único que cruza la red es la descarga única del modelo, y después la receta funciona con internet apagado.",
    },
    {
      q: "¿Cuánto tarda?",
      a: "Unas 26 veces más rápido que el tiempo real con el modelo por defecto: medimos 6,2 segundos para 2 minutos y 43 segundos de habla en un portátil con M5. Con esa proporción, una grabación de una hora se despacha en un par de minutos. Con el mismo audio, tiny dio ×78 y large-v3-turbo ×14.",
    },
    {
      q: "¿Qué modelo debería elegir?",
      a: "Empieza por small, el que viene por defecto. En nuestras mediciones acertó todas las palabras del audio de prueba y dio las líneas más legibles: 39 caracteres de media frente a 97 de large-v3-turbo. Sube solo si tu audio es difícil; baja a tiny o base si lo que quieres es un borrador en un par de segundos.",
    },
    {
      q: "¿Cuánto ocupa el modelo?",
      a: "78 MB tiny, 148 MB base, 488 MB small y 1,62 GB large-v3-turbo. La descarga es única. Después el archivo se queda en el disco y cada pasada posterior lo usa sin preguntar.",
    },
    {
      q: "¿Tengo que decirle en qué idioma se habla?",
      a: "No. El idioma viene en automático y el modelo lo deduce del audio. Aun así puedes indicarlo a mano, y merece la pena hacerlo cuando la grabación arranca con unas frases en otro idioma.",
    },
    {
      q: "¿Puede traducir los subtítulos al inglés?",
      a: "Sí, con la receta «Traducir la voz a subtítulos en inglés»: entra voz extranjera y sale un SRT en inglés con tiempos, de una sola pasada en lugar de transcribir y luego traducir. El inglés es el único idioma de destino que admite el modelo.",
    },
    {
      q: "¿En qué se diferencian SRT y VTT?",
      a: "Sobre todo en la puntuación de los tiempos: SRT escribe 00:00:00,000 con coma y numera las líneas, VTT escribe 00:00:00.000 con punto y empieza con una línea WEBVTT. El SRT es lo que esperan reproductores y editores; el VTT es lo que quiere un reproductor web para su propia pista de subtítulos. Son recetas distintas, así que cambiar de formato es volver a ejecutar, no reescribir el archivo.",
    },
    {
      q: "¿Puedo editar los subtítulos después?",
      a: "Sí: un .srt es texto plano. Ábrelo en cualquier editor para corregir un nombre propio, un tecnicismo o un tiempo. Ese es el modo normal de trabajar: el modelo pone el noventa y tantos por ciento y tú corriges el resto a mano.",
    },
    {
      q: "¿Por qué me salen líneas demasiado largas?",
      a: "Porque el modelo decide dónde cortar, y los modelos grandes cortan menos. Medimos 39 caracteres por línea con small frente a 97 con large-v3-turbo, sobre el mismo audio. Si tus líneas se alargan, volver a small suele arreglarlo, y con voz limpia no cuesta nada en acierto.",
    },
    {
      q: "¿Distingue a los hablantes?",
      a: "No. Whisper escribe lo que se dijo, no quién lo dijo. Si necesitas etiquetas de «Hablante 1 / Hablante 2», tendrás que ponerlas a mano o usar una herramienta hecha justo para eso.",
    },
    {
      q: "¿Qué pasa si en el archivo no hay voz?",
      a: "La pasada se detiene y te dice que no ha oído nada reconocible, en lugar de escribir en silencio un archivo vacío. El silencio no produce subtítulos, y es a propósito.",
    },
    {
      q: "¿Funciona en Windows y Linux?",
      a: "En las tres plataformas. La voz se procesa en la CPU en todas ellas y además aprovecha la GPU en Apple Silicon, que es de donde salen los números rápidos de arriba. La misma receta en un portátil modesto con Windows irá más lenta, aunque seguirá siendo más rápida que escuchar la grabación entera.",
    },
    {
      q: "¿Puedo subtitular varios archivos a la vez?",
      a: "Sí. Suelta una carpeta entera, añade la receta y la cola irá pasando por ellos uno detrás de otro. Cada archivo de subtítulos se escribe junto a su propia fuente.",
    },
    {
      q: "¿Se modifica el archivo de vídeo?",
      a: "No. Se escribe un .srt aparte a su lado —clip.subs.srt— y el vídeo no se modifica, ni se renombra, ni se recodifica. Esta receta no toca la imagen para nada.",
    },
  ],

  ctaTitle: "Saca los subtítulos de ese vídeo",
  ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio a texto — el mismo motor, solo palabras" },
    { page: "trim", label: "Recortar un vídeo — medido y sin pérdidas" },
    { page: "catalog", label: `Las ${FACTS.recipeCount} recetas por categoría` },
  ],
} as const;
