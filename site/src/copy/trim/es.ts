// Гайд «обрезать видео», испанский. Поисковые формулировки: «recortar vídeo»,
// «cortar un vídeo», «recortar vídeo sin perder calidad».
import { FACTS } from "../../facts";

export default {
  title: "Recortar vídeo sin recodificar, gratis y sin conexión",
  description:
    "Recorta un MP4 sin recodificar con MediaChef. Introduce el inicio y el fin y descubre por qué el corte puede empezar en un fotograma clave anterior.",
  h1: "Recortar un vídeo sin perder calidad",
  crumb: "Recortar vídeo",

  answer:
    "Arrastra un MP4 a MediaChef, elige «Recortar vídeo sin recodificar» e indica el inicio y el fin en HH:MM:SS. Para un fragmento de 1:00 a 1:10, usa 00:01:00 y 00:01:10. El programa guarda un MP4 junto al original y copia el vídeo y el audio sin recodificarlos. Entre fotogramas clave, el fragmento puede empezar antes de lo pedido.",

  facts: [
    { k: "Qué necesitas", v: `MediaChef ${FACTS.version} — una descarga, FFmpeg ya va dentro` },
    { k: "Funciona sin conexión", v: "Sí, del todo — la red no se toca en ningún momento" },
    { k: "Coste en calidad", v: "Ninguno. No se recodifica nada; el flujo se copia" },
    { k: "Formato de tiempo", v: "HH:MM:SS. Deja el fin vacío para cortar hasta el final" },
    { k: "Velocidad", v: "0,03–0,04 s en los ejemplos cortos de 1080p de abajo" },
    { k: "Qué obtienes", v: "clip.trim.mp4 junto al original, que se conserva" },
  ],

  toc: [
    { id: "how", label: "Cómo hacerlo" },
    { id: "speed", label: "Lo rápido que es" },
    { id: "keyframes", label: "Por qué el corte se mueve" },
    { id: "changes", label: "Qué cambia y qué no" },
    { id: "format", label: "Cómo escribir los tiempos" },
    { id: "why", label: "Por qué en tu ordenador" },
    { id: "notfor", label: "Cuándo es la receta equivocada" },
    { id: "faq", label: "Preguntas" },
  ],

  stepsTitle: "Cómo sacar un trozo de un vídeo",
  steps: [
    {
      h: "Descarga MediaChef",
      p: "Un archivo para macOS, Windows o Linux. FFmpeg viaja dentro de la descarga: no hay que instalar nada aparte ni añadir nada al PATH.",
    },
    {
      h: "Suelta el vídeo en el tablero",
      p: "MediaChef lee el archivo con ffprobe y deja solo las recetas que encajan. Cualquier vídeo recibe la ficha de recorte, sea cual sea el formato de origen.",
    },
    {
      h: "Elige «Recortar vídeo sin recodificar» e indica los tiempos",
      p: "El campo de fin está en «Avanzado». Para un fragmento de 1:00 a 1:10, pon 00:01:00 y 00:01:10. Deja el fin vacío para conservar todo desde el inicio indicado hasta el final del archivo.",
    },
    {
      h: "Pulsa «Añadir a la cola»",
      p: "Al terminar, abre clip.trim.mp4. La cola muestra dónde se ha guardado el archivo. Por defecto queda junto al original. Si importa el inicio exacto, comprueba los primeros segundos.",
    },
  ],
  shotAlt:
    "MediaChef listo para convertir: el tablero espera un archivo de vídeo y a la derecha está la cola de tareas.",
  shotCaption: "El tablero donde cae el vídeo. Las recetas aparecen cuando MediaChef ha leído el archivo.",

  tables: [
    {
      id: "speed",
      title: "Lo rápido que es de verdad",
      lead:
        "Medimos los tiempos en un único vídeo de 20 segundos a 1080p. La receta copia los datos seleccionados. El tamaño del fragmento y la velocidad del disco influyen en el tiempo.",
      head: ["Trozo cortado", "Resultado", "Tiempo"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "Compáralo con recodificar el mismo origen, que tardó entre 1,3 y 2,0 segundos: unas cincuenta veces más, y con pérdida de calidad encima. Si solo necesitas un fragmento, esta es la primera receta a la que ir.",
    },
    {
      id: "keyframes",
      title: "Por qué a veces el corte se mueve",
      lead:
        "Esta es la limitación honesta, y conocerla convierte un resultado desconcertante en uno esperado. Un vídeo no guarda cada fotograma entero: la mayoría solo describe la diferencia con el anterior, y el corte solo puede empezar en un fotograma completo — un fotograma clave. Pide un punto entre dos, y el corte empieza en el clave anterior.",
      head: ["Origen", "Fotogramas clave en", "Se pidió empezar en", "Empezó de verdad en"],
      rows: [
        ["Claves separados", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — cinco segundos antes"],
        ["Claves separados", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s antes"],
        ["Claves densos", "cada 1 s", "5 s", "5 s — exacto"],
        ["Claves densos", "cada 1 s", "9 s", "9 s — exacto"],
      ],
      note:
        "Cuánto puede moverse un corte es una propiedad del archivo, no de MediaChef: las grabaciones de móvil y de programas de captura suelen poner un fotograma clave cada segundo, mientras que los archivos exportados para streaming pueden separarlos ocho segundos o más. Si el corte tiene que ser exacto al fotograma, usa un editor de vídeo, que recodifica para conseguirlo.",
    },
    {
      id: "changes",
      title: "Qué cambia y qué se queda como estaba",
      lead:
        "Casi nada cambia, y ese es el sentido de esta receta. La lista es corta porque copiar toca muy poco.",
      head: ["Propiedad", "Después de recortar", "Nota"],
      rows: [
        ["Calidad de imagen", "Idéntica", "Se escriben los mismos fotogramas ya codificados. Nunca hay pérdida de generación."],
        ["Códec de vídeo", "Sin cambios", "H.264 entra, H.264 sale. Se conserva lo que usara el origen."],
        ["Resolución", "Sin cambios", "Usa la receta de redimensionar si necesitas menos píxeles."],
        ["Audio", "Copiado, no recodificado", "Se conserva el códec de audio."],
        ["Contenedor", "MP4", "El resultado se escribe como MP4 sea cual sea el contenedor de origen."],
        ["El original", "Intacto", "Se escribe un archivo nuevo al lado; nada se sobrescribe."],
      ],
    },
    {
      id: "format",
      title: "Cómo escribir los tiempos",
      lead:
        "Los dos campos aceptan horas, minutos y segundos separados por dos puntos. El campo del fin es el que más dudas genera.",
      head: ["Lo que quieres", "Inicio", "Fin"],
      rows: [
        ["Los primeros treinta segundos", "00:00:00", "00:00:30"],
        ["Desde 1:30 hasta el final del archivo", "00:01:30", "dejar vacío"],
        ["Un minuto del medio de una grabación larga", "01:12:00", "01:13:00"],
        ["La última parte, desde 2:05", "00:02:05", "dejar vacío"],
      ],
      note:
        "El fin es una posición en la línea de tiempo, no una duración: para diez segundos empezando en el minuto uno, escribe 00:01:00 y 00:01:10, no 00:00:10.",
    },
  ],

  whyTitle: "Por qué recortar en tu propio ordenador",
  whyBullets: [
    {
      h: "Sin subir nada a la nube.",
      p: "MediaChef recorta el vídeo en tu ordenador. El archivo original y el fragmento quedan en tu equipo.",
    },
    {
      h: "No cuesta calidad.",
      p: "La mayoría de los recortadores online recodifican, así que cada corte te cuesta una generación. Copiar el flujo no cuesta nada, y puedes cortar el mismo archivo las veces que quieras.",
    },
    {
      h: "Sin límite de tamaño.",
      p: "Una grabación de dos horas no es problema aquí, y es justo el tamaño que las herramientas web rechazan.",
    },
    {
      h: "Varios a la vez.",
      p: "Suelta una carpeta entera: la cola los recorre y te dice dónde ha quedado cada trozo.",
    },
  ],

  notForTitle: "Cuándo es la receta equivocada",
  notForLead:
    "Copiar el flujo es lo que hace esta receta rápida y sin pérdida, y también lo que la limita. Estos son los casos en que encaja mejor otra cosa.",
  notFor: [
    {
      h: "El corte tiene que caer en un fotograma exacto.",
      p: "Como se midió arriba, el inicio retrocede al fotograma clave más cercano, que en algunos archivos son varios segundos. Un corte exacto al fotograma exige recodificar, que es lo que hace un editor de vídeo.",
    },
    {
      h: "Quieres quitar un trozo del medio.",
      p: "Esta receta saca un trozo continuo. Quitar una sección del medio significa producir dos trozos y unirlos, y eso es montaje, no recorte.",
    },
    {
      h: "Vas a comprimirlo de todos modos.",
      p: "Entonces recorta primero y comprime después: ese orden cuesta una recodificación en lugar de dos, y el recorte en sí sigue siendo gratis.",
    },
    {
      h: "Necesitas otro formato al final.",
      p: "La salida es MP4 con los flujos originales dentro. Si necesitas WebM, un GIF o solo el audio, usa la receta correspondiente; esas recodifican por naturaleza.",
    },
  ],

  faqTitle: "Preguntas",
  faq: [
    {
      q: "¿Recortar pierde calidad?",
      a: "No, ninguna. Los fotogramas codificados se copian sin tocarlos, así que la imagen del trozo es bit a bit la que era en el original. Esa es la diferencia con la mayoría de los recortadores online, que recodifican y cuestan una generación de calidad en cada corte.",
    },
    {
      q: "¿Por qué mi corte empezó antes de lo que pedí?",
      a: "Porque un corte solo puede empezar en un fotograma clave — uno guardado entero — y tu archivo no tenía ninguno en el punto que pediste. Lo medimos: en un archivo con claves cada 8,33 segundos, pedir empezar en el segundo 5 produjo un trozo que empieza en 0. En un archivo con claves cada segundo, la misma petición cayó exacta. Es una propiedad del archivo, no de la aplicación.",
    },
    {
      q: "¿Cómo consigo un corte exacto al fotograma?",
      a: "No puedes, sin recodificar: el fotograma que quieres no existe como imagen completa en el archivo. Si la exactitud importa más que la velocidad y la calidad, usa un editor de vídeo, que decodifica y recodifica para darte cualquier fotograma que señales.",
    },
    {
      q: "¿Cuánto tarda?",
      a: "Los cortes cortos de la tabla tardaron 0,03–0,04 s en nuestro vídeo de 20 segundos a 1080p. El tiempo en tu ordenador depende de cuántos datos se copien y de la velocidad del disco.",
    },
    {
      q: "¿Cómo escribo el inicio y el fin?",
      a: "Como HH:MM:SS — horas, minutos, segundos. 00:01:30 es un minuto y medio. El fin es una posición, no una duración: para diez segundos empezando en el minuto uno, escribe 00:01:00 y 00:01:10.",
    },
    {
      q: "¿Qué pasa si dejo el fin vacío?",
      a: "Si dejas el fin vacío, conservas todo desde el inicio indicado hasta el final del archivo. Para quitar la parte final, introduce el momento en el que debe acabar el fragmento.",
    },
    {
      q: "¿Puedo quitar un trozo del medio y quedarme con el resto?",
      a: "No en un paso. Esta receta produce un trozo continuo. Quitar una sección del medio significa hacer dos trozos y unirlos, que es trabajo de un editor y no de un recorte.",
    },
    {
      q: "¿Se modifica el archivo original?",
      a: "No. El trozo se escribe al lado como clip.trim.mp4, y el origen no se modifica, ni se renombra, ni se borra. Puedes sacar varios trozos distintos del mismo archivo uno tras otro.",
    },
    {
      q: "¿Qué pasa con el sonido?",
      a: "La pista de audio seleccionada se copia sin recodificar. El códec se conserva. El bitrate medio del fragmento puede diferir del original.",
    },
    {
      q: "¿Hay límite de duración o de tamaño?",
      a: "MediaChef no fija un límite de tamaño de entrada para esta receta. Hace falta espacio libre en disco para el fragmento nuevo.",
    },
    {
      q: "¿Qué formatos puedo recortar?",
      a: "El caso habitual es MP4 con vídeo H.264 y audio AAC. Otros contenedores sirven si sus pistas se pueden copiar a MP4. Si el códec impide exportar, convierte primero el original a MP4.",
    },
    {
      q: "¿Puedo recortar varios vídeos a la vez?",
      a: "Sí, aunque todos reciben el mismo inicio y fin. Suéltalos todos en el tablero, añade la receta y la cola los hará uno tras otro.",
    },
    {
      q: "¿Funciona sin internet?",
      a: "Sí, del todo. FFmpeg viaja dentro de la descarga, así que recortar no toca la red en ningún momento. Solo la transcripción necesita descargar un modelo una vez, y esa es otra receta.",
    },
    {
      q: "¿Hay marca de agua o versión de pago?",
      a: "No. MediaChef es código abierto bajo GPL-3.0, sin versión de pago, y como no se recodifica nada, no habría ni siquiera dónde añadir una marca de agua.",
    },
    {
      q: "¿Funciona en Windows y Linux?",
      a: "En las tres plataformas. Hay instalador para Windows, AppImage y .deb para Linux, y DMG para macOS con Apple Silicon. La receta se comporta igual en todas partes.",
    },
  ],

  ctaTitle: "Saca ese trozo",
  ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Comprimir vídeo — tamaños y bitrates medidos" },
    { page: "gif", label: "Vídeo a GIF — tamaños medidos para cada ajuste" },
    { page: "catalog", label: `Las ${FACTS.recipeCount} recetas, por categorías` },
  ],
} as const;
