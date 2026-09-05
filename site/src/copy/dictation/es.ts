// Гайд «голосовой ввод», испанский. Реальные запросы: «dictado por voz mac»,
// «voz a texto sin internet», «escribir con la voz».
import { FACTS } from "../../facts";

export default {
  title: "Dictado por voz en el Mac — sin conexión, gratis, sin cobro por minuto",
  description:
    "Pulse un atajo en cualquier sitio, hable y las palabras aparecen donde está el cursor. El reconocimiento corre en su propia máquina con Whisper: nada se sube, nada se factura. Dentro: latencia medida, tamaños de los modelos y el único permiso que hace falta.",
  h1: "Escribir con la voz sin que salga del ordenador",
  crumb: "Dictado por voz",

  answer:
    "Pulse ⌥ Space en cualquier parte del Mac, diga una frase y púlselo otra vez: el texto se escribe directamente en el campo donde está el cursor, sea un terminal, un chat o un formulario del navegador. Reconoce el mismo Whisper que MediaChef ya lleva dentro, así que el audio no sale de su disco y nadie cuenta los minutos. En nuestra medición una frase de cinco segundos volvió en 780 milisegundos. Es la única función de este sitio que aún no está publicada: está terminada y en uso diario internamente, y llega en la próxima versión.",

  facts: [
    { k: "Estado", v: "Aún no publicada — llega en la próxima versión" },
    { k: "Dónde se calcula", v: "Enteramente en su máquina, sin cuenta y sin subidas" },
    { k: "Velocidad", v: "780 ms de la tecla al texto en una frase de cinco segundos (medido)" },
    { k: "Cuánto cuesta", v: "Nada. Ni suscripción ni cobro por minuto" },
    { k: "Plataforma", v: "macOS primero; Windows y Linux después" },
    { k: "Descarga única", v: "Un modelo de voz, 488 MB el que viene por defecto" },
  ],

  toc: [
    { id: "how", label: "Cómo funciona" },
    { id: "speed", label: "Lo rápido que es" },
    { id: "models", label: "Qué modelo usar" },
    { id: "dictionary", label: "Enseñarle sus palabras" },
    { id: "delivery", label: "Adónde va el texto" },
    { id: "why", label: "Por qué en local" },
    { id: "notfor", label: "Cuándo no le servirá" },
    { id: "faq", label: "Preguntas" },
  ],

  stepsTitle: "Cómo funciona el dictado",
  steps: [
    {
      h: "Encenderlo una vez",
      p: "En Ajustes hay un interruptor y tres atajos a elegir. Hasta que lo encienda, MediaChef no registra ningún atajo global: una aplicación que se queda con una combinación del sistema en silencio es una aplicación que rompe las demás.",
    },
    {
      h: "Pulsar el atajo en cualquier sitio",
      p: "Funciona con MediaChef en segundo plano o con su ventana cerrada. Dos maneras: mantener la tecla mientras habla, o pulsarla una vez para empezar y otra para parar, según lo largo que sea el pensamiento.",
    },
    {
      h: "Hablar",
      p: "El micrófono se abre solo mientras dicta, así que el punto naranja de la barra de menús se apaga en cuanto termina. Entre pulsación y pulsación nadie escucha.",
    },
    {
      h: "El texto aparece donde está el cursor",
      p: "Se escribe directo en el campo con el foco, sin tocar el portapapeles. Si prefiere lo contrario, que vaya al portapapeles, es el ajuste de al lado.",
    },
  ],
  shotAlt:
    "MediaChef listo para convertir: la mesa de trabajo espera un archivo de vídeo, la cola de tareas está a la derecha.",
  shotCaption: "MediaChef hoy. El dictado añadirá un cuarto modo a los tres que ya hay.",

  tables: [
    {
      id: "speed",
      title: "Lo rápido que es de verdad",
      lead:
        "Medición de extremo a extremo en un portátil con M5: desde que se suelta la tecla hasta que el texto está entregado. La primera fila es un dictado real de la compilación viva; el resto, una frase fija de quince segundos pasada por cada modelo.",
      head: ["Qué se midió", "Modelo", "Tiempo"],
      rows: [
        ["Frase real de cinco segundos, de la tecla al texto escrito", "small", "780 ms"],
        ["Frase de quince segundos", "tiny", "no medido aparte"],
        ["Frase de quince segundos", "small", "0,66–0,75 s"],
        ["Frase de quince segundos", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Estos números esconden dos cosas y las dos conviene saberlas. El micrófono tarda 56 milisegundos en entregar su primera muestra, así que una palabra empezada en el mismo instante que la pulsación puede recortarse; en la práctica uno habla después de la tecla y nadie lo nota. Y el primerísimo dictado tras conceder el permiso del micrófono se pierde: el sistema pasa unos 1,8 segundos mostrando su diálogo. Pulse otra vez y funciona.",
    },
    {
      id: "models",
      title: "Qué modelo usar",
      lead:
        "Los mismos cuatro modelos que usan las recetas de transcripción, así que si ya transcribe archivos con MediaChef el modelo está en su disco y el dictado no le cuesta ninguna descarga.",
      head: ["Modelo", "Descarga", "Carácter"],
      rows: [
        ["tiny", "78 MB", "El más rápido, tosco — vale para una nota para uno mismo"],
        ["base", "148 MB", "Rápido, decente"],
        ["small — el de por defecto", "488 MB", "El equilibrio, y el que ya usan las recetas"],
        ["large-v3-turbo", "1,62 GB", "La mejor calidad, unas dos veces más de espera"],
      ],
      note:
        "Empiece por small. Está por defecto por una razón práctica más que técnica: es el mismo modelo que usan las recetas, así que a un usuario existente el dictado le funciona sin descargar nada. Suba a large-v3-turbo si su audio es difícil — mucho acento, una sala ruidosa, dos idiomas en una misma frase — y acepte aproximadamente el doble de espera por frase.",
    },
    {
      id: "dictionary",
      title: "Enseñarle sus palabras",
      lead:
        "Todo oficio tiene palabras que el reconocimiento destroza: nombres de productos, jerga, el apellido de un compañero. Puede darle la lista al modelo y deja de adivinar. Abajo, la misma grabación con y sin un diccionario de cuarenta términos.",
      head: ["Sin diccionario", "Con él"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "Costó 0,04 segundos: 0,87 frente a 0,83 en el mismo corte. El techo son unos 224 tokens, es decir alrededor de 400 caracteres en cirílico o el triple en alfabeto latino; MediaChef los cuenta por usted y recorta, porque Whisper trunca una lista demasiado larga en silencio. Esto es justo lo que el dictado integrado de macOS no puede: no se le enseña su vocabulario.",
    },
    {
      id: "delivery",
      title: "Adónde va el texto",
      lead:
        "Dos opciones, y la diferencia pesa más de lo que parece cuando se dicta varias veces por hora.",
      head: ["Ajuste", "Qué pasa", "Qué necesita"],
      rows: [
        ["Escribirlo", "Las palabras aparecen en el campo con el foco. El portapapeles queda intacto", "El permiso de Accesibilidad, una vez"],
        ["Portapapeles", "El texto se copia y usted lo pega con ⌘V", "Nada más que el micrófono"],
      ],
      note:
        "Escribir deja el portapapeles en paz, y por eso conviene preferirlo: si cada dictado lo sobrescribiera, no podría guardar un enlace ahí mientras trabaja. macOS considera escribir en otra aplicación como entrada sintética y pide el permiso de Accesibilidad — el primer intento abre por sí solo el panel correspondiente de Ajustes del Sistema. Cuando el permiso falta, el texto igualmente acaba en el portapapeles: un dictado nunca se pierde.",
    },
  ],

  whyTitle: "Por qué hacerlo en local es lo importante",
  whyBullets: [
    {
      h: "Su voz no se sube.",
      p: "Se dicta precisamente lo que uno no pegaría en un formulario web: ideas a medio hacer, nombres de clientes, la frase que está a punto de enviar. El dictado en la nube es por definición una copia de todo eso en el servidor de otro.",
    },
    {
      h: "Sin contador por minutos.",
      p: "Los servicios que transcriben cobran por minuto, y eso hace pensar antes de hablar. Aquí la descarga del modelo es única y el centésimo dictado del día cuesta exactamente lo que costó el primero.",
    },
    {
      h: "Funciona con la red apagada.",
      p: "En un avión, en un equipo cerrado, en una sala donde el wifi es lo menos fiable que hay. Una vez el modelo está en el disco, el dictado no toca internet.",
    },
    {
      h: "Aprende su vocabulario.",
      p: "El diccionario es una simple lista de sus palabras, y es lo único que el dictado integrado en macOS no sabe hacer.",
    },
    {
      h: "Código abierto, sin suscripción.",
      p: "GPL-3.0, todo legible en GitHub. Las herramientas de pago de este nicho cobran al mes por lo que por debajo es el mismo modelo abierto.",
    },
  ],

  notForTitle: "Cuándo no le servirá",
  notForLead:
    "Dicho claramente, porque enterarse después es peor que leerlo ahora.",
  notFor: [
    {
      h: "Lo quiere ahora mismo.",
      p: "Es la única página de este sitio que describe algo que todavía no se puede descargar. El dictado está terminado y en uso diario interno, y sale en la próxima versión — pero la publicada hoy no lo tiene.",
    },
    {
      h: "No usa un Mac.",
      p: "macOS va primero porque ahí se construyó y se probó. Windows y Linux siguen: el motor de reconocimiento ya es multiplataforma, lo que necesita trabajo por plataforma es el atajo y la escritura del texto.",
    },
    {
      h: "Necesita que escriba mientras habla.",
      p: "El texto llega cuando termina, no palabra por palabra mientras habla. Es un intercambio deliberado: reconocer la frase entera es más preciso y, a estas velocidades, el modo continuo no aportaría nada.",
    },
    {
      h: "Necesita distinguir hablantes.",
      p: "Escribe lo que se dijo, no quién lo dijo. Para una entrevista a dos voces hace falta una herramienta de transcripción pensada para eso, no un atajo de dictado.",
    },
  ],

  faqTitle: "Preguntas",
  faq: [
    {
      q: "¿Se envía mi voz a algún sitio?",
      a: "No. El audio lo reconoce un archivo de modelo que está en su propio disco, y se borra junto con la carpeta temporal en la que vivió. Lo único que cruza la red es la descarga única del modelo; después el dictado funciona con la red completamente apagada.",
    },
    {
      q: "¿Lo rápido que es?",
      a: "780 milisegundos desde soltar la tecla hasta que aparece el texto, medido sobre una frase real de cinco segundos con el modelo por defecto en un portátil con M5. Una frase de quince segundos tardó 0,66–0,75 segundos. El modelo pesado large-v3-turbo tarda aproximadamente el doble.",
    },
    {
      q: "¿Funciona en cualquier aplicación?",
      a: "Sí: el atajo se registra en todo el sistema, así que dispara en un terminal, un navegador, un mensajero o un editor, con MediaChef en segundo plano o incluso con su ventana cerrada.",
    },
    {
      q: "¿Qué combinación usa?",
      a: "⌥ Space por defecto, con ⌃⌥ Space y ⌃⌥ D como alternativas. Deliberadamente no Cmd más una letra: un atajo global se captura antes de que lo vea cualquier aplicación, así que quedarse con ⌘D rompería «duplicar» en todos sus programas.",
    },
    {
      q: "¿Por qué necesita el permiso de Accesibilidad?",
      a: "Solo para escribir el texto en la ventana de otra aplicación, algo que macOS cuenta como entrada sintética. Si prefiere no concederlo, cambie la entrega al portapapeles: eso no necesita nada más que el micrófono, y pega usted con ⌘V.",
    },
    {
      q: "¿Y si no lo concedo?",
      a: "El texto va al portapapeles y una notificación explica por qué, con el panel correspondiente de Ajustes del Sistema ya abierto. Nada dictado se pierde nunca por un permiso que falta.",
    },
    {
      q: "¿Cuánto disco necesita?",
      a: "La aplicación más un modelo de voz: 488 MB el de por defecto, 78 MB si elige el más pequeño, 1,62 GB el mayor. Si ya usa MediaChef para transcribir archivos, el modelo ya está en su disco y el dictado no añade nada.",
    },
    {
      q: "¿Entiende español, o dos idiomas a la vez?",
      a: "Whisper admite 99 idiomas y usted puede nombrar el suyo o dejar que lo detecte. Mezclar idiomas en una misma frase es justo el caso donde el modelo pesado se gana su tamaño y donde el diccionario ayuda más.",
    },
    {
      q: "¿Cuánto puede durar un dictado?",
      a: "Cinco minutos, tras los cuales se detiene solo y transcribe lo que oyó en lugar de descartarlo. En la práctica se dicta por frases, no por monólogos.",
    },
    {
      q: "¿Puedo cancelar a mitad de frase?",
      a: "Escape mientras graba descarta la toma y no entrega nada. Se registra solo mientras usted dicta, así que no interfiere con Escape en ningún otro sitio.",
    },
    {
      q: "¿Sustituye al dictado integrado de macOS?",
      a: "Hace el mismo trabajo con dos diferencias que importan: a este se le puede enseñar su vocabulario, y el audio se queda en su máquina. Si ninguna de las dos le importa, el integrado ya está ahí y también es gratis.",
    },
    {
      q: "¿De verdad es gratis?",
      a: `Sí. MediaChef es de código abierto bajo GPL-3.0, sin versión de pago ni suscripción — el dictado incluido. La versión publicada es la ${FACTS.version}; el dictado llega en la siguiente.`,
    },
  ],

  ctaTitle: "MediaChef hoy",
  ctaSub: `Versión ${FACTS.version} — gratis, código abierto, macOS · Windows · Linux. El dictado llega en la próxima versión.`,
  also: [
    { page: "transcribe", label: "Audio a texto — el mismo motor, para archivos" },
    { page: "srt", label: "Vídeo a subtítulos SRT — medido y sin conexión" },
    { page: "catalog", label: `Las ${FACTS.recipeCount} recetas por categoría` },
  ],
} as const;
