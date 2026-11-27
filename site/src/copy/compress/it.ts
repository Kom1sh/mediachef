// Гайд «сжать видео», итальянский. Поисковые формулировки: «comprimere
// video», «ridurre le dimensioni del video», «alleggerire un video».
import { FACTS } from "../../facts";

export default {
  title: "Comprimere video — gratis, offline, senza limiti di dimensione",
  description:
    "Comprimi un MP4 offline con MediaChef. Scegli un livello di qualità o imposta la dimensione in MB per rispettare un limite.",
  h1: "Comprimere video sul tuo computer",
  crumb: "Comprimere video",

  answer:
    "Trascina un video in MediaChef. Per ridurlo, scegli «Comprimi video (preset di qualità)» e parti da CRF 28. Se hai un limite in MB, scegli «Comprimi video a una dimensione» e inserisci il massimo. Avvia il lavoro e controlla il nuovo MP4. L’originale resta sul tuo computer.",

  facts: [
    { k: "Cosa serve", v: `MediaChef ${FACTS.version} — un download, FFmpeg è già dentro` },
    { k: "Funziona offline", v: "Sì, del tutto — la rete non viene mai toccata" },
    { k: "Livelli di qualità", v: "23 (alta) · 28 (predefinito) · 33 (file piccolo)" },
    { k: "Codec", v: `CRF: Video H.264, audio AAC a 128 kbps (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Cosa ottieni", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (MB)" },
    { k: "Velocità", v: "CRF: 20 s di 1080p30 in 1,3–2,0 s su un portatile Apple Silicon" },
  ],

  toc: [
    { id: "how", label: "Come si fa" },
    { id: "level", label: "Quale livello scegliere" },
    { id: "size", label: "Cosa ottieni davvero" },
    { id: "bigger", label: "Quando comprimere ingrandisce" },
    { id: "changes", label: "Cosa cambia e cosa no" },
    { id: "why", label: "Perché sul tuo computer" },
    { id: "notfor", label: "Quando è la ricetta sbagliata" },
    { id: "faq", label: "Domande" },
  ],

  stepsTitle: "Come comprimere un video",
  steps: [
    {
      h: "Scarica MediaChef",
      p: "Un file per macOS, Windows o Linux. FFmpeg viaggia dentro il download: niente da installare a parte, niente da aggiungere al PATH.",
    },
    {
      h: "Trascina il video sul piano",
      p: "MediaChef legge il file con ffprobe e lascia solo le ricette che servono. Qualsiasi video riceve la scheda di compressione, qualunque sia il formato di partenza.",
    },
    {
      h: "Scegli la qualità o la dimensione obiettivo",
      p: "Per ridurre il file, scegli «Comprimi video (preset di qualità)» e parti da 28. Per un limite in MB, scegli «Comprimi video a una dimensione» e inserisci il massimo. L’app calcola il bitrate in base alla durata e può abbassare la risoluzione.",
    },
    {
      h: "Fai clic su «Aggiungi alla coda»",
      p: "Al termine, controlla la dimensione del file. La coda mostra dove è stato salvato il file. Di norma si trova accanto all’originale. La modalità qualità crea clip.compressed.mp4. La modalità dimensione crea clip.small.mp4.",
    },
  ],
  shotAlt:
    "MediaChef pronto a convertire: il piano attende un file video, a destra c'è la coda dei lavori.",
  shotCaption: "Il piano su cui arriva il video. Le ricette compaiono quando MediaChef ha letto il file.",

  tables: [
    {
      id: "level",
      title: "Quale livello di qualità scegliere",
      lead:
        "Il numero fissa la qualità, non la dimensione — ed è la cosa più utile da capire. Stai dicendo al codificatore quanto bene deve apparire l'immagine; la dimensione del file è quanto questo costa sul tuo materiale.",
      head: ["Livello", "Immagine", "Scegli quando"],
      rows: [
        ["23", "Difficile da distinguere dall'originale a distanza normale", "Il video conta per sé: un pezzo di portfolio, materiale che rimonterai, tutto ciò che finirà su uno schermo grande."],
        ["28", "Buona. La trama fine si ammorbidisce se la cerchi", "Il predefinito. Condividere, caricare, inviare — il livello giusto finché non c'è un motivo diverso."],
        ["33", "Visibilmente più morbida; compaiono blocchi nel movimento rapido e nelle scene scure", "Scegli 33 se accetti una perdita visibile di qualità in cambio di un file più piccolo. Per un limite in MB, usa la modalità dimensione."],
      ],
      note:
        "Poiché l'obiettivo è la qualità, lo stesso livello dà un file piccolo su una registrazione dello schermo statica e grande su riprese a mano libera con foglie in movimento. Due clip al livello 28 possono differire di diverse volte.",
    },
    {
      id: "size",
      title: "Cosa ottieni davvero",
      lead:
        "Misure in CRF su due clip di 20 secondi a 1080p30, una con sfumature e una ricca di dettagli. Dimensioni e bitrate valgono solo per queste clip.",
      head: ["Livello", "Clip morbido", "Clip dettagliato", "Bitrate ottenuto"],
      rows: [
        ["Sorgente", "47,0 MB", "23,9 MB", "10–20 Mbit/s"],
        ["23", "24,1 MB", "13,2 MB", "5,5–10,1 Mbit/s"],
        ["28", "11,0 MB", "6,4 MB", "2,7–4,6 Mbit/s"],
        ["33", "4,0 MB", "3,8 MB", "1,6–1,7 Mbit/s"],
      ],
      note:
        "Lo schema tiene su entrambi i clip: ogni passo della scala dimezza circa il file. Passare da 23 a 33 ha dato 6,1× sul clip morbido e 3,5× su quello dettagliato — più il materiale è difficile, meno c'è da guadagnare.",
    },
    {
      id: "bigger",
      title: "Quando comprimere ingrandisce il file",
      lead:
        "Questo sorprende, quindi diciamolo chiaramente: chiedere una qualità più alta di quella che il file ha già obbliga il codificatore a spendere più bit di quanti il file contenga. L'abbiamo misurato rimettendo in ingresso il risultato del livello 33.",
      head: ["Applicato a un file da 1,66 Mbit/s", "Risultato", "Effetto"],
      rows: [
        ["Livello 23", "10,6 MB da 4,0 MB", "2,7 volte più grande"],
        ["Livello 28", "6,1 MB da 4,0 MB", "1,5 volte più grande"],
        ["Livello 33", "3,4 MB da 4,0 MB", "1,2 volte più piccolo, e più morbido"],
      ],
      note:
        "Guarda quindi che cosa hai prima di comprimere. Una registrazione da telefono a 40 Mbit/s ha molto da dare; qualcosa già scaricato dal web a 2 Mbit/s quasi nulla, e ricodificarlo toglie solo qualità.",
    },
    {
      id: "changes",
      title: "Cosa cambia e cosa resta come era",
      lead:
        "La ricetta ricodifica; non reinquadra. Sapere esattamente cosa tocca risparmia un giro di sorprese.",
      head: ["Proprietà", "Dopo la compressione", "Nota"],
      rows: [
        ["Risoluzione", "Invariata", "1080p in ingresso, 1080p in uscita. Per meno pixel c'è la ricetta di ridimensionamento."],
        ["Fotogrammi al secondo", "Invariati", "Tutti i fotogrammi restano; cambia solo come vengono memorizzati."],
        ["Durata", "Invariata", "Per accorciare il clip c'è la ricetta di taglio."],
        ["Codec video", "H.264", "Codificato con il preset veryfast — da qui i venti secondi in meno di due."],
        ["Audio", "AAC a 128 kbps", "Sempre ricodificato, qualunque fosse. Sufficiente per parlato e musica in un clip che condividi."],
        ["L'originale", "Intatto", "Accanto viene scritto un nuovo file; nulla viene sovrascritto."],
      ],
    },
  ],

  whyTitle: "Perché comprimere sul proprio computer",
  whyBullets: [
    {
      h: "Nessun caricamento sul cloud.",
      p: "MediaChef comprime il video sul tuo computer. L’originale e il file compresso restano sul dispositivo.",
    },
    {
      h: "L'originale resta.",
      p: "Il risultato è un file nuovo accanto alla sorgente, quindi un livello scelto male costa una passata in più, non il materiale.",
    },
    {
      h: "Una cartella intera in una volta.",
      p: "Trascina tutti i clip: la coda li percorre e ti dice dove è finito ogni risultato.",
    },
  ],

  notForTitle: "Quando è la ricetta sbagliata",
  notForLead:
    "Comprimere è ricodificare, e ricodificare costa sempre qualcosa. Questi sono i casi in cui un'altra ricetta fa il lavoro meglio o a minor prezzo.",
  notFor: [
    {
      h: "Ti serve solo un pezzo del clip.",
      p: "Se ti serve solo un tratto, usa prima «Taglia il video senza ricodificare». La ricetta copia le tracce senza ricodificarle. Comprimi il tratto se è ancora troppo grande.",
    },
    {
      h: "Il file è già molto compresso.",
      p: "Come misurato sopra, un file da 1,66 Mbit/s è cresciuto di 2,7 volte al livello 23. Guarda prima il bitrate; se è già basso, non c'è nulla da guadagnare.",
    },
    {
      h: "Ti servono meno pixel, non meno bit.",
      p: "Questa ricetta mantiene la risoluzione. Se un file 4K pesa perché è 4K, la ricetta «Riduci a 720p» affronta la causa vera.",
    },
    {
      h: "Stai archiviando un master.",
      p: "H.264 a qualunque di questi livelli è con perdita, e la perdita si accumula a ogni ricodifica futura. Lascia il master come è e comprimi le copie.",
    },
  ],

  faqTitle: "Domande",
  faq: [
    {
      q: "Di quanto si ridurrà il mio file?",
      a: "Dipende dalla sorgente e dalla durata. Con CRF 28, le clip della tabella occupavano 11,0 e 6,4 MB. Per un limite preciso, usa la modalità dimensione obiettivo.",
    },
    {
      q: "Cosa significano i numeri 23, 28 e 33?",
      a: "È il fattore di qualità costante di H.264: un obiettivo di qualità in cui più basso vuol dire meglio. Il codificatore spende il bitrate necessario per raggiungere quella qualità sul tuo materiale. Per questo lo stesso livello dà dimensioni molto diverse su una registrazione dello schermo statica e su riprese a mano libera.",
    },
    {
      q: "Quale livello devo scegliere?",
      a: "Parti da 28. Prova 23 per conservare più dettagli o 33 per un file più piccolo. Per un limite in MB, usa «Comprimi video a una dimensione» e controlla il risultato.",
    },
    {
      q: "Perché comprimere ha ingrandito il mio file?",
      a: "Perché hai chiesto una qualità più alta di quella che il file aveva già. L'abbiamo misurato: un file da 1,66 Mbit/s è uscito 2,7 volte più grande al livello 23 e 1,5 volte più grande al livello 28. Se un file ha già un bitrate basso, comprimerlo ancora toglie solo qualità — guarda che cosa hai prima di lanciare la ricetta.",
    },
    {
      q: "Cambia la risoluzione?",
      a: "La modalità qualità mantiene la risoluzione. La modalità dimensione può abbassarla in base al bitrate disponibile.",
    },
    {
      q: "Che ne è dell'audio?",
      a: "La modalità qualità ricodifica l’audio in AAC a 128 kbps. La modalità dimensione può usare un bitrate audio più basso. Conserva l’originale se ti serve l’audio intatto.",
    },
    {
      q: "Il file originale viene sovrascritto?",
      a: "Entrambe le modalità salvano un nuovo MP4 accanto all’originale: clip.compressed.mp4 per la qualità e clip.small.mp4 per la dimensione. L’originale rimane intatto.",
    },
    {
      q: "Quanto tempo richiede?",
      a: "Su un portatile Apple Silicon, venti secondi di 1080p30 hanno richiesto da 1,3 a 2,0 secondi — circa dieci a quindici volte più rapido che guardarli. I clip più lunghi crescono quasi linearmente e la coda mostra il tempo rimanente. È il preset veryfast a comprare quella velocità.",
    },
    {
      q: "C'è un limite di dimensione?",
      a: "Il file in ingresso non ha un limite fisso. Lascia abbastanza spazio per il risultato. La ricetta per dimensione accetta un obiettivo da 1 a 4000 MB.",
    },
    {
      q: "Comprimere due volte lo renderà ancora più piccolo?",
      a: "Una seconda passata può ridurre o aumentare il peso e peggiorare l’immagine. Se il primo risultato supera il limite, applica la ricetta per dimensione al file originale.",
    },
    {
      q: "Quali formati posso comprimere?",
      a: "Tutto ciò che FFmpeg legge: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV e il resto. L'uscita è sempre MP4 con H.264, la combinazione che si riproduce ovunque senza plugin.",
    },
    {
      q: "Posso comprimere più video in una volta?",
      a: "Sì. Trascinali tutti sul piano, aggiungi la ricetta, e la coda li farà uno dopo l'altro con avanzamento e tempo rimanente per ciascuno.",
    },
    {
      q: "Funziona senza internet?",
      a: "Sì, del tutto. FFmpeg viaggia dentro il download, quindi comprimere non tocca mai la rete. Solo la trascrizione ha bisogno di scaricare un modello una volta, e quella è un'altra ricetta.",
    },
    {
      q: "C'è una filigrana o una versione a pagamento?",
      a: "No. MediaChef è open source sotto GPL-3.0, senza versione a pagamento, e non scrive nulla nell'immagine oltre alla ricodifica che hai chiesto.",
    },
    {
      q: "Funziona su Windows e Linux?",
      a: "Su tutte e tre le piattaforme. Per Windows c'è un installer, per Linux un AppImage e un .deb, per macOS un DMG per Apple Silicon. La ricetta e i suoi livelli sono identici ovunque.",
    },
  ],

  ctaTitle: "Alleggerisci quel file",
  ctaSub: `MediaChef ${FACTS.version} — gratis, open source, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Video in GIF — dimensioni misurate per ogni impostazione" },
    { page: "mp3", label: "Convertire MP4 in MP3 — gratis e offline" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette, per categoria` },
  ],
} as const;
