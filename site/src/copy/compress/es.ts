// Гайд «сжать видео», испанский. Поисковые формулировки: «comprimir vídeo»,
// «reducir tamaño de vídeo», «comprimir vídeo sin perder calidad».
import { FACTS } from "../../facts";

export default {
  title: "Comprimir vídeo — gratis, sin conexión, sin límite de tamaño",
  description:
    "Cómo reducir el tamaño de un vídeo en tu ordenador: elige uno de los tres niveles de calidad y pulsa empezar. Sin subir nada, sin tope de tamaño, sin marca de agua. Dentro, tamaños medidos, bitrates resultantes y el caso en que comprimir agranda el archivo.",
  h1: "Comprimir vídeo en tu propio ordenador",
  crumb: "Comprimir vídeo",

  answer:
    "Suelta el vídeo en MediaChef, elige la receta «Comprimir vídeo», selecciona un nivel de calidad y pulsa empezar. El archivo más pequeño aparece junto al original, que se queda intacto. Cada paso de la escala —23, 28, 33— reduce el archivo más o menos a la mitad: en nuestras mediciones 23 dio 5,5–10 Mbit/s, 28 dio 2,7–4,6 y 33 alrededor de 1,6. No se sube nada, no hay tope de tamaño, y veinte segundos de 1080p se recodifican en menos de dos segundos.",

  facts: [
    { k: "Qué necesitas", v: `MediaChef ${FACTS.version} — una descarga, FFmpeg ya va dentro` },
    { k: "Funciona sin conexión", v: "Sí, del todo — la red no se toca en ningún momento" },
    { k: "Niveles de calidad", v: "23 (alta) · 28 (por defecto) · 33 (archivo pequeño)" },
    { k: "Códec", v: `Vídeo H.264, audio AAC a 128 kbps (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Qué obtienes", v: "clip.compressed.mp4 junto al original, que se conserva" },
    { k: "Velocidad", v: "20 s de 1080p30 en 1,3–2,0 s en un portátil con Apple Silicon" },
  ],

  toc: [
    { id: "how", label: "Cómo hacerlo" },
    { id: "level", label: "Qué nivel elegir" },
    { id: "size", label: "Qué obtienes de verdad" },
    { id: "bigger", label: "Cuándo comprimir agranda" },
    { id: "changes", label: "Qué cambia y qué no" },
    { id: "why", label: "Por qué en tu ordenador" },
    { id: "notfor", label: "Cuándo es la receta equivocada" },
    { id: "faq", label: "Preguntas" },
  ],

  stepsTitle: "Cómo comprimir un vídeo",
  steps: [
    {
      h: "Descarga MediaChef",
      p: "Un archivo para macOS, Windows o Linux. FFmpeg viaja dentro de la descarga: no hay que instalar nada aparte ni añadir nada al PATH.",
    },
    {
      h: "Suelta el vídeo en el tablero",
      p: "MediaChef lee el archivo con ffprobe y deja solo las recetas que encajan. Cualquier vídeo recibe la ficha de comprimir, sea cual sea el formato de origen.",
    },
    {
      h: "Elige «Comprimir vídeo» y un nivel",
      p: "Un solo ajuste: 23, 28 o 33, donde un número más bajo significa mejor imagen y archivo más grande. 28 viene por defecto y es la primera apuesta correcta para casi todo.",
    },
    {
      h: "Pulsa empezar y compara",
      p: "El resultado queda junto al original como clip.compressed.mp4. El archivo de origen no se modifica, así que puedes ver los dos y repetir la receta con otro nivel si te equivocaste.",
    },
  ],
  shotAlt:
    "MediaChef listo para convertir: el tablero espera un archivo de vídeo y a la derecha está la cola de tareas.",
  shotCaption: "El tablero donde cae el vídeo. Las recetas aparecen cuando MediaChef ha leído el archivo.",

  tables: [
    {
      id: "level",
      title: "Qué nivel de calidad elegir",
      lead:
        "El número fija la calidad, no el tamaño, y esto es lo más útil que hay que entender. Le estás diciendo al codificador lo bien que tiene que verse la imagen; el tamaño del archivo es lo que eso cueste en tu material concreto.",
      head: ["Nivel", "Imagen", "Elígelo cuando"],
      rows: [
        ["23", "Difícil de distinguir del original a distancia normal", "El vídeo importa por sí mismo: una pieza de portafolio, material que volverás a editar, algo que irá a una pantalla grande."],
        ["28", "Buena. La textura fina se ablanda si la buscas", "El valor por defecto. Compartir, subir, enviar: el nivel correcto mientras no tengas un motivo."],
        ["33", "Visiblemente más blanda; se ven bloques en el movimiento rápido y en escenas oscuras", "El archivo tiene que caber en algo concreto. Elígelo a propósito, no por inercia."],
      ],
      note:
        "Como lo que se fija es la calidad, el mismo nivel da un archivo pequeño en una grabación de pantalla estática y grande en material grabado a pulso con hojas moviéndose. Dos clips al nivel 28 pueden diferir varias veces.",
    },
    {
      id: "size",
      title: "Qué obtienes de verdad",
      lead:
        "Medido en dos clips de 1080p30 de veinte segundos: uno con degradados suaves y movimiento continuo, otro con detalle fino en todo el cuadro — más o menos el extremo fácil y el difícil de lo que se encuentra un codificador. La columna del bitrate es la que se traslada a tu material; los megabytes son de estos clips.",
      head: ["Nivel", "Clip suave", "Clip detallado", "Bitrate resultante"],
      rows: [
        ["Origen", "47,0 MB", "23,9 MB", "10–20 Mbit/s"],
        ["23", "24,1 MB", "13,2 MB", "5,5–10,1 Mbit/s"],
        ["28", "11,0 MB", "6,4 MB", "2,7–4,6 Mbit/s"],
        ["33", "4,0 MB", "3,8 MB", "1,6–1,7 Mbit/s"],
      ],
      note:
        "El patrón se cumple en los dos clips: cada paso de la escala reduce el archivo aproximadamente a la mitad. Pasar de 23 a 33 dio 6,1× en el clip suave y 3,5× en el detallado: cuanto más difícil el material, menos hay que ganar.",
    },
    {
      id: "bigger",
      title: "Cuándo comprimir agranda el archivo",
      lead:
        "Esto sorprende, así que vale decirlo claro: pedir una calidad mayor de la que el archivo ya tiene obliga al codificador a gastar más bits de los que el archivo contiene. Lo medimos volviendo a meter el resultado del nivel 33.",
      head: ["Aplicado a un archivo de 1,66 Mbit/s", "Resultado", "Efecto"],
      rows: [
        ["Nivel 23", "10,6 MB desde 4,0 MB", "2,7 veces más grande"],
        ["Nivel 28", "6,1 MB desde 4,0 MB", "1,5 veces más grande"],
        ["Nivel 33", "3,4 MB desde 4,0 MB", "1,2 veces menor, y más blando"],
      ],
      note:
        "Así que mira qué tienes antes de comprimir. Una grabación de móvil a 40 Mbit/s tiene mucho que dar; algo ya descargado de la web a 2 Mbit/s casi nada, y recodificarlo solo quita calidad.",
    },
    {
      id: "changes",
      title: "Qué cambia y qué se queda como estaba",
      lead:
        "La receta recodifica; no reencuadra. Saber exactamente qué toca ahorra una ronda de sorpresas.",
      head: ["Propiedad", "Después de comprimir", "Nota"],
      rows: [
        ["Resolución", "Sin cambios", "1080p entra, 1080p sale. Para menos píxeles está la receta de redimensionar."],
        ["Fotogramas por segundo", "Sin cambios", "Se conservan todos los fotogramas; solo cambia cómo se guardan."],
        ["Duración", "Sin cambios", "Para acortar el clip está la receta de recortar."],
        ["Códec de vídeo", "H.264", "Codificado con el preajuste veryfast: de ahí los veinte segundos en menos de dos."],
        ["Audio", "AAC a 128 kbps", "Se recodifica siempre, fuera lo que fuera. Suficiente para voz y música en un clip que compartes."],
        ["El original", "Intacto", "Se escribe un archivo nuevo al lado; nada se sobrescribe."],
      ],
    },
  ],

  whyTitle: "Por qué comprimir en tu propio ordenador",
  whyBullets: [
    {
      h: "No se sube nada.",
      p: "El vídeo que quieres reducir suele ser justo el que todavía no has publicado. Se queda en tu disco: sin copia en un servidor cuya política de retención tendrías que creerte.",
    },
    {
      h: "Sin límite de tamaño.",
      p: "Los compresores en línea se acaban entre 100 MB y 2 GB, que es exactamente el rango donde comprimir empieza a importar. Un archivo de cuatro gigas se trata como uno de cuatro megas.",
    },
    {
      h: "Más rápido que subirlo.",
      p: "Veinte segundos de 1080p se recodifican aquí en menos de dos. En un servicio web el mismo clip tiene que ir y volver primero.",
    },
    {
      h: "El original se conserva.",
      p: "El resultado es un archivo nuevo junto al de origen, así que un nivel mal elegido cuesta una pasada más, no el material.",
    },
    {
      h: "Una carpeta entera de una vez.",
      p: "Suelta todos los clips: la cola los recorre y te dice dónde ha quedado cada resultado.",
    },
  ],

  notForTitle: "Cuándo es la receta equivocada",
  notForLead:
    "Comprimir es recodificar, y recodificar siempre cuesta algo. Estos son los casos en que otra receta hace el trabajo mejor o más barato.",
  notFor: [
    {
      h: "Solo necesitas un trozo del clip.",
      p: "Cortar primero es gratis: la receta «Recortar sin recodificar» copia el flujo en lugar de recalcularlo, en centésimas de segundo y sin pérdida. Recorta y luego comprime si sigue siendo grande.",
    },
    {
      h: "El archivo ya está muy comprimido.",
      p: "Como se midió arriba, un archivo de 1,66 Mbit/s creció 2,7 veces al nivel 23. Mira el bitrate primero; si ya es bajo, no hay nada que ganar.",
    },
    {
      h: "Necesitas menos píxeles, no menos bits.",
      p: "Esta receta mantiene la resolución. Si un archivo 4K pesa porque es 4K, la receta «Reducir a 720p» ataca la causa real.",
    },
    {
      h: "Estás archivando un máster.",
      p: "H.264 en cualquiera de estos niveles tiene pérdida, y la pérdida se acumula en cada recodificación futura. Deja el máster como está y comprime copias.",
    },
  ],

  faqTitle: "Preguntas",
  faq: [
    {
      q: "¿Cuánto se reducirá mi archivo?",
      a: "Depende del bitrate del que partes, no del tamaño del archivo. En nuestras mediciones el nivel 28 produjo 2,7–4,6 Mbit/s y el 33 unos 1,6 Mbit/s, fuera cual fuera el origen. Divide tu bitrate actual por esas cifras para estimar: una grabación de móvil a 40 Mbit/s baja unas diez veces al nivel 28, mientras una descarga a 3 Mbit/s casi no se mueve.",
    },
    {
      q: "¿Qué significan los números 23, 28 y 33?",
      a: "Es el factor de tasa constante de H.264: un objetivo de calidad en el que menos es mejor. El codificador gasta el bitrate que haga falta para alcanzar esa calidad en tu material. Por eso el mismo nivel da tamaños muy distintos en una grabación de pantalla estática y en una toma a pulso.",
    },
    {
      q: "¿Qué nivel debo elegir?",
      a: "Empieza en 28: viene por defecto y es el correcto para compartir, enviar y subir. Usa 23 cuando el vídeo importe por sí mismo y vayas a mirarlo de cerca o a reeditarlo. Usa 33 solo cuando el archivo tenga que caber en un límite concreto; el ablandamiento se ve en el movimiento rápido y en escenas oscuras.",
    },
    {
      q: "¿Por qué comprimir agrandó mi archivo?",
      a: "Porque pediste una calidad mayor de la que el archivo ya tenía. Lo medimos: un archivo de 1,66 Mbit/s salió 2,7 veces más grande al nivel 23 y 1,5 veces al nivel 28. Si un archivo ya tiene bitrate bajo, comprimirlo más solo le quita calidad; mira qué tienes antes de lanzar la receta.",
    },
    {
      q: "¿Cambia la resolución?",
      a: "No. 1080p a la entrada es 1080p a la salida; la receta cambia cómo se guarda la imagen, no lo grande que es. Si quieres menos píxeles, usa «Reducir a 720p», que ataca el tamaño en su origen y se combina con esta.",
    },
    {
      q: "¿Qué pasa con el sonido?",
      a: "El audio se recodifica a AAC a 128 kbps, fuera lo que fuera antes. Es suficientemente transparente para voz y para música en un clip que compartes. Si necesitas el audio original intacto, extráelo antes con «Sacar el audio a MP3» o guarda el archivo de origen.",
    },
    {
      q: "¿Se sobrescribe el archivo original?",
      a: "No. El resultado se escribe al lado como clip.compressed.mp4, y el origen no se modifica, ni se renombra, ni se borra. Puedes repetir la receta con otro nivel y comparar.",
    },
    {
      q: "¿Cuánto tarda?",
      a: "En un portátil con Apple Silicon, veinte segundos de 1080p30 tardaron entre 1,3 y 2,0 segundos, unas diez a quince veces más rápido que verlo. Los clips más largos escalan casi linealmente y la cola muestra el tiempo restante. El preajuste veryfast es lo que compra esa velocidad.",
    },
    {
      q: "¿Hay límite de tamaño?",
      a: "No. MediaChef no pone ninguno; el límite es el espacio libre en disco, y la aplicación lo comprueba antes de empezar. Esa es la diferencia práctica principal con los compresores web, que suelen acabarse entre 100 MB y 2 GB.",
    },
    {
      q: "¿Comprimir dos veces lo hará aún más pequeño?",
      a: "Más pequeño sí, pero cada pasada pierde calidad de forma permanente y la segunda gana mucho menos que la primera. Si el resultado sigue pesando, vuelve al original y usa un número más alto en lugar de apilar pasadas sobre la copia comprimida.",
    },
    {
      q: "¿Qué formatos puedo comprimir?",
      a: "Todo lo que FFmpeg lea: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV y el resto. La salida es siempre MP4 con H.264, que es la combinación que se reproduce en cualquier sitio sin plugins.",
    },
    {
      q: "¿Puedo comprimir varios vídeos a la vez?",
      a: "Sí. Suéltalos todos en el tablero, añade la receta y la cola los hará uno tras otro con el avance y el tiempo restante de cada uno.",
    },
    {
      q: "¿Funciona sin internet?",
      a: "Sí, del todo. FFmpeg viaja dentro de la descarga, así que comprimir no toca la red en ningún momento. Solo la transcripción necesita descargar un modelo una vez, y esa es otra receta.",
    },
    {
      q: "¿Hay marca de agua o versión de pago?",
      a: "No. MediaChef es código abierto bajo GPL-3.0, sin versión de pago, y no escribe nada en la imagen más allá de la recodificación que has pedido.",
    },
    {
      q: "¿Funciona en Windows y Linux?",
      a: "En las tres plataformas. Hay instalador para Windows, AppImage y .deb para Linux, y DMG para macOS con Apple Silicon. La receta y sus niveles son idénticos en todas partes.",
    },
  ],

  ctaTitle: "Haz ese archivo más pequeño",
  ctaSub: `MediaChef ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Vídeo a GIF — tamaños medidos para cada ajuste" },
    { page: "mp3", label: "Convertir MP4 a MP3 — gratis y sin conexión" },
    { page: "catalog", label: `Las ${FACTS.recipeCount} recetas, por categorías` },
  ],
} as const;
