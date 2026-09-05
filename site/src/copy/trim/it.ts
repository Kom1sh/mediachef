// Гайд «обрезать видео», итальянский. Поисковые формулировки: «tagliare un
// video», «tagliare video senza perdere qualità».
import { FACTS } from "../../facts";

export default {
  title: "Tagliare un video senza perdere qualità — gratis, offline, immediato",
  description:
    "Come estrarre uno spezzone da un video sul tuo computer senza toccare la qualità: il flusso viene copiato, non ricalcolato, quindi il lavoro finisce in centesimi di secondo. Dentro: tempi misurati e il limite dei fotogrammi chiave spiegato senza giri di parole.",
  h1: "Tagliare un video senza perdere qualità",
  crumb: "Tagliare un video",

  answer:
    "Trascina il video in MediaChef, scegli «Taglia senza ricodificare», scrivi inizio e fine in formato HH:MM:SS e avvia. Lo spezzone compare accanto all'originale. Non viene ricalcolato nulla: il flusso è copiato così com'è, quindi l'immagine è identica bit per bit a prima e il lavoro finisce in centesimi di secondo — 0,03 secondi nelle nostre misure, che lo spezzone duri cinque secondi o quindici. L'unico limite è che i tagli possono cadere solo su un fotogramma chiave, e sotto è spiegato perché.",

  facts: [
    { k: "Cosa serve", v: `MediaChef ${FACTS.version} — un download, FFmpeg è già dentro` },
    { k: "Funziona offline", v: "Sì, del tutto — la rete non viene mai toccata" },
    { k: "Costo in qualità", v: "Nessuno. Non si ricodifica niente, il flusso viene copiato" },
    { k: "Formato orario", v: "HH:MM:SS. Fine vuota significa: fino alla fine del file" },
    { k: "Velocità", v: "Circa 0,03 s, e non cresce con la durata" },
    { k: "Cosa ottieni", v: "clip.trim.mp4 accanto all'originale, che resta al suo posto" },
  ],

  toc: [
    { id: "how", label: "Come si fa" },
    { id: "speed", label: "Quanto è veloce" },
    { id: "keyframes", label: "Perché il taglio si sposta" },
    { id: "changes", label: "Cosa cambia e cosa resta" },
    { id: "format", label: "Come scrivere gli orari" },
    { id: "why", label: "Perché sul proprio computer" },
    { id: "notfor", label: "Quando non è la ricetta giusta" },
    { id: "faq", label: "Domande" },
  ],

  stepsTitle: "Come estrarre uno spezzone da un video",
  steps: [
    {
      h: "Scarica MediaChef",
      p: "Un file per macOS, Windows o Linux. FFmpeg viaggia dentro il download: niente da installare a parte, niente da aggiungere al PATH.",
    },
    {
      h: "Trascina il video sul piano di lavoro",
      p: "MediaChef legge il file con ffprobe e mostra solo le ricette adatte. La scheda del taglio la riceve qualsiasi video, qualunque sia il formato di partenza.",
    },
    {
      h: "Scegli «Taglia senza ricodificare» e scrivi gli orari",
      p: "Inizio e fine in formato HH:MM:SS — 00:01:30 è un minuto e mezzo. Se lasci la fine vuota, lo spezzone va dal punto d'inizio fino alla fine del file.",
    },
    {
      h: "Avvia e prendi lo spezzone",
      p: "Il risultato arriva accanto all'originale con il nome clip.trim.mp4, e l'originale resta intatto. È abbastanza veloce da finire prima che tu abbia distolto lo sguardo.",
    },
  ],
  shotAlt:
    "MediaChef pronto a convertire: il piano di lavoro aspetta un file video, la coda dei lavori è a destra.",
  shotCaption: "Il piano di lavoro dove arriva il video. Le ricette compaiono quando MediaChef ha letto il file.",

  tables: [
    {
      id: "speed",
      title: "Quanto è veloce davvero",
      lead:
        "Dato che non si ricalcola nulla, il lavoro si riduce a copiare i byte che servono. Il tempo non dipende dalla durata dello spezzone — misurato su una sorgente 1080p di venti secondi.",
      head: ["Spezzone estratto", "Risultato", "Tempo"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "Per confronto: ricodificare la stessa sorgente ha richiesto da 1,3 a 2,0 secondi, cioè una cinquantina di volte tanto, e per giunta con perdita di qualità. Se ti serve solo uno spezzone, questa è la prima ricetta da provare.",
    },
    {
      id: "keyframes",
      title: "Perché a volte il taglio si sposta",
      lead:
        "Questo è il limite, detto chiaramente — e conoscerlo trasforma un risultato strano in un risultato previsto. Un video non conserva ogni fotogramma per intero: la maggior parte descrive solo la differenza rispetto al precedente, e un taglio può iniziare solo su un fotogramma completo, il fotogramma chiave. Chiedi un punto intermedio e il taglio parte dal fotogramma chiave precedente.",
      head: ["Sorgente", "Fotogrammi chiave a", "Inizio richiesto", "Inizio effettivo"],
      rows: [
        ["Fotogrammi chiave radi", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — cinque secondi prima"],
        ["Fotogrammi chiave radi", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s prima"],
        ["Fotogrammi chiave fitti", "ogni secondo", "5 s", "5 s — esatto"],
        ["Fotogrammi chiave fitti", "ogni secondo", "9 s", "9 s — esatto"],
      ],
      note:
        "Quanto sarà grande lo scarto è una proprietà del file, non di MediaChef: le riprese col telefono e le registrazioni dello schermo di solito mettono un fotogramma chiave al secondo, mentre i file esportati per la pubblicazione possono lasciarne otto o più tra l'uno e l'altro. Se il taglio deve essere esatto al fotogramma, serve un programma di montaggio, che per riuscirci ricodifica.",
    },
    {
      id: "changes",
      title: "Cosa cambia e cosa resta com'era",
      lead:
        "Non cambia quasi nulla, ed è proprio il senso di questa ricetta. L'elenco è corto perché copiare tocca pochissimo.",
      head: ["Proprietà", "Dopo il taglio", "Nota"],
      rows: [
        ["Qualità dell'immagine", "Invariata", "Gli stessi fotogrammi codificati vengono riscritti. Nessuna perdita di generazione, mai."],
        ["Codec video", "Invariato", "H.264 in ingresso, H.264 in uscita. Resta quello che usava la sorgente."],
        ["Risoluzione", "Invariata", "Se ti servono meno pixel, usa la ricetta di ridimensionamento."],
        ["Audio", "Copiato, non ricodificato", "La traccia mantiene codec e bitrate originali."],
        ["Contenitore", "MP4", "Il risultato è scritto in MP4 qualunque fosse il contenitore di partenza."],
        ["L'originale", "Intatto", "Accanto nasce un file nuovo, non si sovrascrive niente."],
      ],
    },
    {
      id: "format",
      title: "Come scrivere gli orari",
      lead:
        "Entrambi i campi accettano ore, minuti e secondi separati dai due punti. Il campo che genera più domande è quello della fine.",
      head: ["Cosa vuoi", "Inizio", "Fine"],
      rows: [
        ["I primi trenta secondi", "00:00:00", "00:00:30"],
        ["Da 1:30 fino alla fine del file", "00:01:30", "lascia vuoto"],
        ["Un minuto in mezzo a una lunga registrazione", "01:12:00", "01:13:00"],
        ["La coda finale, da 2:05", "00:02:05", "lascia vuoto"],
      ],
      note:
        "La fine è una posizione sulla linea del tempo, non una durata: per dieci secondi a partire dal primo minuto scrivi 00:01:00 e 00:01:10, non 00:00:10.",
    },
  ],

  whyTitle: "Perché tagliare sul proprio computer",
  whyBullets: [
    {
      h: "Non si carica niente.",
      p: "Tagliare è di solito la prima cosa che si fa al materiale grezzo, cioè esattamente a quello che non hai ancora fatto vedere a nessuno. Resta sul tuo disco.",
    },
    {
      h: "Nessuna attesa.",
      p: "Uno strumento web deve ricevere il file intero prima di tirarne fuori dieci secondi. Qui il lavoro finisce in centesimi di secondo, con file di qualunque dimensione.",
    },
    {
      h: "Nessun costo in qualità.",
      p: "La maggior parte dei taglierini online ricodifica, quindi ogni taglio ti costa una generazione. Copiare il flusso non costa nulla, e lo stesso file lo puoi tagliare quante volte vuoi.",
    },
    {
      h: "Nessun limite di dimensione.",
      p: "Una registrazione di due ore qui non è un problema — ed è proprio la taglia che gli strumenti web rifiutano.",
    },
    {
      h: "Più file insieme.",
      p: "Trascina una cartella intera: la coda la smaltisce e ti dice dove è stato scritto ogni spezzone.",
    },
  ],

  notForTitle: "Quando non è la ricetta giusta",
  notForLead:
    "Copiare il flusso è ciò che rende questa ricetta veloce e senza perdite, ed è anche ciò che la limita. Ecco i casi in cui conviene altro.",
  notFor: [
    {
      h: "Il taglio deve cadere su un fotogramma preciso.",
      p: "Come misurato sopra, l'inizio arretra al fotogramma chiave più vicino, e su certi file sono diversi secondi. Un taglio esatto al fotogramma richiede una ricodifica ed è lavoro da programma di montaggio.",
    },
    {
      h: "Vuoi togliere un pezzo in mezzo.",
      p: "Questa ricetta estrae uno spezzone continuo. Togliere una parte centrale significa fare due spezzoni e unirli, ed è montaggio, non taglio.",
    },
    {
      h: "Tanto poi lo comprimerai.",
      p: "Allora taglia prima e comprimi dopo: quest'ordine costa una ricodifica invece di due, e il taglio in sé resta gratis.",
    },
    {
      h: "Alla fine ti serve un altro formato.",
      p: "In uscita c'è un MP4 con dentro i flussi originali. Se ti serve WebM, una GIF o solo l'audio, prendi la ricetta apposita: quelle per natura ricodificano.",
    },
  ],

  faqTitle: "Domande",
  faq: [
    {
      q: "Tagliare fa perdere qualità?",
      a: "No, per niente. I fotogrammi codificati vengono copiati senza toccarli, quindi l'immagine dello spezzone è identica bit per bit a quella dell'originale. È qui la differenza rispetto alla maggior parte dei taglierini online, che ricodificano e a ogni taglio ti costano una generazione di qualità.",
    },
    {
      q: "Perché il mio taglio è iniziato prima di quanto avevo chiesto?",
      a: "Perché un taglio può iniziare solo su un fotogramma chiave — uno conservato per intero — e il tuo file non ne aveva uno nel punto richiesto. L'abbiamo misurato: su un file con un fotogramma chiave ogni 8,33 secondi, chiedere di partire a 5 secondi ha prodotto uno spezzone che iniziava a 0. Su un file con un fotogramma chiave al secondo, la stessa richiesta è andata a segno. È una proprietà del file, non del programma.",
    },
    {
      q: "Come ottengo un taglio esatto al fotogramma?",
      a: "Senza ricodificare non si può: il fotogramma che vuoi colpire nel file non esiste come fotogramma completo. Se la precisione conta più della velocità e della qualità, usa un programma di montaggio, che decodifica e ricodifica per darti qualunque fotogramma.",
    },
    {
      q: "Quanto ci mette?",
      a: "Circa 0,03 secondi nelle nostre misure, e non cresce con la durata dello spezzone: cinque secondi e quindici secondi hanno impiegato lo stesso tempo. Ricodificare la stessa sorgente ha richiesto da 1,3 a 2,0 secondi, cioè una cinquantina di volte tanto.",
    },
    {
      q: "Come si scrivono inizio e fine?",
      a: "In formato HH:MM:SS — ore, minuti, secondi. 00:01:30 è un minuto e mezzo. La fine è una posizione, non una durata: per dieci secondi a partire dal primo minuto scrivi 00:01:00 e 00:01:10.",
    },
    {
      q: "Cosa succede se lascio la fine vuota?",
      a: "Lo spezzone va dal tuo punto d'inizio fino alla fine del file. È il modo più rapido per tagliare una coda lunga — per esempio una registrazione andata avanti dopo la fine della riunione.",
    },
    {
      q: "Posso togliere un pezzo in mezzo e tenere il resto?",
      a: "Non in un passaggio solo. Questa ricetta dà uno spezzone continuo. Togliere una parte centrale significa fare due spezzoni e unirli, cioè lavoro di montaggio e non di taglio.",
    },
    {
      q: "Il file originale viene modificato?",
      a: "No. Lo spezzone viene scritto accanto con il nome clip.trim.mp4, e la sorgente non viene modificata, né rinominata, né cancellata. Puoi estrarre di seguito più spezzoni diversi dallo stesso file.",
    },
    {
      q: "Cosa succede all'audio?",
      a: "Viene copiato insieme all'immagine e mantiene codec e bitrate originali. Nessuna delle due tracce viene ricodificata.",
    },
    {
      q: "C'è un limite di durata o di dimensione?",
      a: "No. MediaChef non ne impone, e dato che il lavoro è una copia e non un calcolo, un file di due ore non si taglia più lentamente di uno di due minuti. Il limite è lo spazio libero sul disco, che il programma controlla prima di partire.",
    },
    {
      q: "Quali formati posso tagliare?",
      a: "Tutto ciò che FFmpeg sa leggere: MP4, MKV, MOV, WebM, AVI, TS e altri. Il risultato viene scritto in MP4 con dentro i flussi video e audio originali.",
    },
    {
      q: "Posso tagliare più video insieme?",
      a: "Sì, ma prendono tutti lo stesso inizio e la stessa fine. Trascinali tutti sul piano di lavoro, aggiungi la ricetta e la coda li smaltirà uno dopo l'altro.",
    },
    {
      q: "Funziona senza internet?",
      a: "Sì, del tutto. FFmpeg viaggia dentro il download, quindi tagliare non tocca mai la rete. Solo la trascrizione ha bisogno di scaricare una volta il modello, ed è un'altra ricetta.",
    },
    {
      q: "C'è una filigrana o una versione a pagamento?",
      a: "No. MediaChef è open source con licenza GPL-3.0, non esiste una versione a pagamento e, dato che non si ricodifica nulla, non ci sarebbe nemmeno il posto dove mettere una filigrana.",
    },
    {
      q: "Funziona su Windows e Linux?",
      a: "Su tutte e tre le piattaforme. Per Windows c'è un installer, per Linux un AppImage e un .deb, per macOS su Apple Silicon un DMG. La ricetta si comporta allo stesso modo ovunque.",
    },
  ],

  ctaTitle: "Prenditi quello spezzone",
  ctaSub: `MediaChef ${FACTS.version} — gratis, open source, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Comprimere un video — dimensioni e bitrate misurati" },
    { page: "gif", label: "Video in GIF — dimensioni misurate per ogni impostazione" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette per categoria` },
  ],
} as const;
