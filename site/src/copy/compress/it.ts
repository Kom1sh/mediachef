// Гайд «сжать видео», итальянский. Поисковые формулировки: «comprimere
// video», «ridurre le dimensioni del video», «alleggerire un video».
import { FACTS } from "../../facts";

export default {
  title: "Comprimere video — gratis, offline, senza limiti di dimensione",
  description:
    "Come ridurre le dimensioni di un video sul tuo computer: scegli uno dei tre livelli di qualità e avvia. Niente da caricare, nessun tetto di dimensione, nessuna filigrana. Dentro: dimensioni misurate, bitrate ottenuti e il caso in cui comprimere ingrandisce il file.",
  h1: "Comprimere video sul tuo computer",
  crumb: "Comprimere video",

  answer:
    "Trascina il video in MediaChef, scegli la ricetta «Comprimi video», seleziona un livello di qualità e avvia. Il file più piccolo appare accanto all'originale, che resta intatto. Ogni passo della scala — 23, 28, 33 — dimezza circa il file: nelle nostre misure 23 ha dato 5,5–10 Mbit/s, 28 ha dato 2,7–4,6 e 33 circa 1,6. Non viene caricato nulla, non c'è tetto di dimensione, e venti secondi di 1080p si ricodificano in meno di due secondi.",

  facts: [
    { k: "Cosa serve", v: `MediaChef ${FACTS.version} — un download, FFmpeg è già dentro` },
    { k: "Funziona offline", v: "Sì, del tutto — la rete non viene mai toccata" },
    { k: "Livelli di qualità", v: "23 (alta) · 28 (predefinito) · 33 (file piccolo)" },
    { k: "Codec", v: `Video H.264, audio AAC a 128 kbps (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Cosa ottieni", v: "clip.compressed.mp4 accanto all'originale, che viene conservato" },
    { k: "Velocità", v: "20 s di 1080p30 in 1,3–2,0 s su un portatile Apple Silicon" },
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
      h: "Scegli «Comprimi video» e un livello",
      p: "Una sola impostazione: 23, 28 o 33, dove un numero più basso significa immagine migliore e file più grande. 28 è il predefinito e la prima scelta giusta per quasi tutto.",
    },
    {
      h: "Avvia e confronta",
      p: "Il risultato arriva accanto all'originale come clip.compressed.mp4. Il file di partenza non viene modificato, quindi puoi guardarli entrambi e rilanciare la ricetta a un altro livello se hai sbagliato.",
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
        ["33", "Visibilmente più morbida; compaiono blocchi nel movimento rapido e nelle scene scure", "Il file deve entrare in un limite preciso. Sceglilo di proposito, non per abitudine."],
      ],
      note:
        "Poiché l'obiettivo è la qualità, lo stesso livello dà un file piccolo su una registrazione dello schermo statica e grande su riprese a mano libera con foglie in movimento. Due clip al livello 28 possono differire di diverse volte.",
    },
    {
      id: "size",
      title: "Cosa ottieni davvero",
      lead:
        "Misurato su due clip 1080p30 da venti secondi: uno con sfumature morbide e movimento continuo, l'altro con dettaglio fine in tutto il quadro — più o meno il lato facile e quello difficile di ciò che incontra un codificatore. La colonna del bitrate è quella che si trasferisce al tuo materiale; i megabyte appartengono a questi clip.",
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
      h: "Non viene caricato nulla.",
      p: "Il video che si vuole alleggerire è di solito proprio quello non ancora pubblicato. Resta sul tuo disco: nessuna copia su un server di cui dovresti credere alla politica di conservazione.",
    },
    {
      h: "Nessun limite di dimensione.",
      p: "I compressori online finiscono fra 100 MB e 2 GB, cioè esattamente nell'intervallo in cui comprimere comincia a contare. Un file da quattro giga è trattato come uno da quattro mega.",
    },
    {
      h: "Più rapido di un caricamento.",
      p: "Venti secondi di 1080p si ricodificano qui in meno di due. Su un servizio web lo stesso clip deve prima andare e tornare.",
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
      p: "Tagliare prima è gratis: la ricetta «Taglia senza ricodificare» copia il flusso invece di ricalcolarlo, in centesimi di secondo e senza perdita. Taglia, poi comprimi se è ancora troppo grande.",
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
      a: "Dipende dal bitrate da cui parti, non dalla dimensione del file. Nelle nostre misure il livello 28 ha prodotto 2,7–4,6 Mbit/s e il 33 circa 1,6 Mbit/s, qualunque fosse la sorgente. Dividi il tuo bitrate attuale per questi numeri per stimare: una registrazione da telefono a 40 Mbit/s scende di circa dieci volte al livello 28, mentre un download a 3 Mbit/s si muove appena.",
    },
    {
      q: "Cosa significano i numeri 23, 28 e 33?",
      a: "È il fattore di qualità costante di H.264: un obiettivo di qualità in cui più basso vuol dire meglio. Il codificatore spende il bitrate necessario per raggiungere quella qualità sul tuo materiale. Per questo lo stesso livello dà dimensioni molto diverse su una registrazione dello schermo statica e su riprese a mano libera.",
    },
    {
      q: "Quale livello devo scegliere?",
      a: "Parti da 28 — è il predefinito e va bene per condividere, inviare e caricare. Usa 23 quando il video conta per sé e lo guarderai da vicino o lo rimonterai. Usa 33 solo quando il file deve entrare in un limite preciso; l'ammorbidimento si vede nel movimento rapido e nelle scene scure.",
    },
    {
      q: "Perché comprimere ha ingrandito il mio file?",
      a: "Perché hai chiesto una qualità più alta di quella che il file aveva già. L'abbiamo misurato: un file da 1,66 Mbit/s è uscito 2,7 volte più grande al livello 23 e 1,5 volte più grande al livello 28. Se un file ha già un bitrate basso, comprimerlo ancora toglie solo qualità — guarda che cosa hai prima di lanciare la ricetta.",
    },
    {
      q: "Cambia la risoluzione?",
      a: "No. 1080p in ingresso significa 1080p in uscita; la ricetta cambia come l'immagine è memorizzata, non quanto è grande. Se vuoi meno pixel, usa «Riduci a 720p», che affronta la dimensione alla sua origine e si combina con questa.",
    },
    {
      q: "Che ne è dell'audio?",
      a: "L'audio viene ricodificato in AAC a 128 kbps, qualunque fosse prima. È abbastanza trasparente per il parlato e per la musica in un clip che condividi. Se ti serve l'audio originale intatto, estrailo prima con «Estrai l'audio in MP3» oppure conserva il file sorgente.",
    },
    {
      q: "Il file originale viene sovrascritto?",
      a: "No. Il risultato viene scritto accanto come clip.compressed.mp4, e la sorgente non viene modificata, rinominata né cancellata. Puoi rilanciare la ricetta a un altro livello e confrontare.",
    },
    {
      q: "Quanto tempo richiede?",
      a: "Su un portatile Apple Silicon, venti secondi di 1080p30 hanno richiesto da 1,3 a 2,0 secondi — circa dieci a quindici volte più rapido che guardarli. I clip più lunghi crescono quasi linearmente e la coda mostra il tempo rimanente. È il preset veryfast a comprare quella velocità.",
    },
    {
      q: "C'è un limite di dimensione?",
      a: "No. MediaChef non ne pone; il limite è lo spazio libero su disco, e l'applicazione lo controlla prima di partire. È la differenza pratica principale rispetto ai compressori web, che di solito finiscono fra 100 MB e 2 GB.",
    },
    {
      q: "Comprimere due volte lo renderà ancora più piccolo?",
      a: "Più piccolo sì, ma ogni passata perde qualità in modo permanente e la seconda guadagna molto meno della prima. Se il risultato pesa ancora, torna all'originale e usa un numero più alto invece di impilare passate sulla copia compressa.",
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
