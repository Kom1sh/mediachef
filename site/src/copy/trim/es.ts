// Гайд «обрезать видео», испанский. Поисковые формулировки: «recortar vídeo»,
// «cortar un vídeo», «recortar vídeo sin perder calidad».
import { FACTS } from "../../facts";

export default {
  title: "Recortar vídeo sin recodificar — gratis, sin conexión, instantáneo",
  description:
    "Cómo sacar un trozo de un vídeo en tu ordenador sin tocar la calidad: el flujo se copia, no se recalcula, así que termina en centésimas de segundo sea cual sea la duración. Dentro, tiempos medidos y el límite de los fotogramas clave explicado con honestidad.",
  h1: "Recortar un vídeo sin perder calidad",
  crumb: "Recortar vídeo",

  answer:
    "Suelta el vídeo en MediaChef, elige «Recortar sin recodificar», escribe el inicio y el fin como HH:MM:SS y pulsa empezar. El trozo aparece junto al original. No se recalcula nada — el flujo se copia tal cual, así que la imagen es bit a bit la que era y el trabajo termina en centésimas de segundo: en nuestras mediciones 0,03 segundos, tanto para un trozo de cinco segundos como de quince. La única pega es que los cortes solo pueden caer en un fotograma clave, y eso se explica más abajo.",

  facts: [
    { k: "Qué necesitas", v: `MediaChef ${FACTS.version} — una descarga, FFmpeg ya va dentro` },
    { k: "Funciona sin conexión", v: "Sí, del todo — la red no se toca en ningún momento" },
    { k: "Coste en calidad", v: "Ninguno. No se recodifica nada; el flujo se copia" },
    { k: "Formato de tiempo", v: "HH:MM:SS. Deja el fin vacío para cortar hasta el final" },
    { k: "Velocidad", v: "Unos 0,03 s, y no crece con la duración del trozo" },
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
      h: "Elige «Recortar sin recodificar» y escribe los tiempos",
      p: "Inicio y fin como HH:MM:SS — 00:01:30 es un minuto y medio. Si dejas el fin vacío, el trozo va desde el punto de inicio hasta el final del archivo.",
    },
    {
      h: "Pulsa empezar y coge el trozo",
      p: "El resultado queda junto al original como clip.trim.mp4, y el original no se toca. Es tan rápido que el trabajo termina antes de que apartes la vista.",
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
        "Como no se recalcula nada, el trabajo es copiar los bytes que hacen falta. El tiempo no depende de lo largo que sea el trozo — medido sobre un origen de 1080p de veinte segundos.",
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
        ["Audio", "Copiado, no recodificado", "La pista conserva su códec y su bitrate originales."],
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
      h: "No se sube nada.",
      p: "Recortar suele ser lo primero que se hace con el material en bruto, que es exactamente el material que no has enseñado a nadie. Se queda en tu disco.",
    },
    {
      h: "No hay ninguna espera.",
      p: "Una herramienta web tiene que recibir el archivo entero antes de poder sacarle diez segundos. Aquí el trabajo termina en centésimas de segundo, con un archivo de cualquier tamaño.",
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
      a: "Unos 0,03 segundos en nuestras mediciones, y no crece con la duración del trozo: cinco segundos y quince tardaron lo mismo. Recodificar el mismo origen tardó entre 1,3 y 2,0 segundos, unas cincuenta veces más.",
    },
    {
      q: "¿Cómo escribo el inicio y el fin?",
      a: "Como HH:MM:SS — horas, minutos, segundos. 00:01:30 es un minuto y medio. El fin es una posición, no una duración: para diez segundos empezando en el minuto uno, escribe 00:01:00 y 00:01:10.",
    },
    {
      q: "¿Qué pasa si dejo el fin vacío?",
      a: "El trozo va desde tu punto de inicio hasta el final del archivo. Es la forma más rápida de quitar una cola larga — una grabación que siguió después de acabar la reunión, por ejemplo.",
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
      a: "Se copia junto con la imagen, conservando su códec y su bitrate originales. No se recodifica ninguna de las dos pistas.",
    },
    {
      q: "¿Hay límite de duración o de tamaño?",
      a: "No. MediaChef no pone ninguno, y como el trabajo es copiar y no calcular, un archivo de dos horas no se recorta más despacio que uno de dos minutos. El límite es el espacio libre en disco, que la aplicación comprueba antes de empezar.",
    },
    {
      q: "¿Qué formatos puedo recortar?",
      a: "Todo lo que FFmpeg lea: MP4, MKV, MOV, WebM, AVI, TS y el resto. El resultado se escribe como MP4 con los flujos de vídeo y audio originales dentro.",
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
