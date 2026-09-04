// Гайд «видео в GIF», итальянский. Поисковые формулировки: «convertire video
// in gif», «trasformare video in gif», «fare una gif». Разделитель дробной
// части — запятая, единицы MB/KB.
//
// «GIF» в итальянском женского рода — «una GIF», «la GIF»: так и пишем.
import { FACTS } from "../../facts";

export default {
  title: "Video in GIF — gratis e offline, sul tuo computer",
  description:
    "Come fare una GIF da un video sul tuo computer: scegli i fotogrammi al secondo e la larghezza, avvia. Niente da caricare, nessun limite di dimensione, nessuna filigrana. Dentro, le dimensioni misurate per ogni impostazione.",
  h1: "Video in GIF, sul tuo computer",
  crumb: "Video in GIF",

  answer:
    "Trascina il video in MediaChef, scegli la ricetta «Video in GIF», imposta i fotogrammi al secondo e la larghezza, poi avvia. La GIF appare accanto al file originale. Non viene caricato nulla: FFmpeg lavora sulla tua macchina, quindi non c'è né tetto di dimensione né coda. Con le impostazioni predefinite — 15 fotogrammi al secondo e 480 pixel di larghezza — una GIF costa circa 130 KB per secondo di video: dieci secondi vengono intorno a 1,3 MB.",

  facts: [
    { k: "Cosa serve", v: `MediaChef ${FACTS.version} — un download, FFmpeg è già dentro` },
    { k: "Funziona offline", v: "Sì, del tutto — la rete non viene mai toccata" },
    { k: "Cosa accetta", v: "MP4, MKV, MOV, WebM, AVI, TS e tutto il resto che FFmpeg legge" },
    { k: "Impostazioni", v: "Fotogrammi/s 10 / 15 / 24 · larghezza 320 / 480 / 640 pixel" },
    { k: "Cosa ottieni", v: "clip.gif, scritto accanto al video di partenza" },
    { k: "Prezzo", v: "Gratis, open source (GPL-3.0), senza account e senza filigrana" },
  ],

  toc: [
    { id: "how", label: "Come si fa" },
    { id: "fps", label: "Quanti fotogrammi" },
    { id: "width", label: "Quale larghezza" },
    { id: "size", label: "Quanto peserà" },
    { id: "duration", label: "Quanto conta la durata" },
    { id: "why", label: "Perché sul tuo computer" },
    { id: "notfor", label: "Quando la GIF è una cattiva idea" },
    { id: "faq", label: "Domande" },
  ],

  stepsTitle: "Come trasformare un video in GIF",
  steps: [
    {
      h: "Scarica MediaChef",
      p: "Un file per macOS, Windows o Linux. FFmpeg viaggia dentro il download: niente da installare a parte, niente da aggiungere al PATH.",
    },
    {
      h: "Trascina il video sul piano",
      p: "MediaChef legge il file con ffprobe e lascia solo le ricette che servono. La scheda GIF compare per qualsiasi video; il formato di partenza non conta.",
    },
    {
      h: "Scegli «Video in GIF»",
      p: "Due impostazioni: fotogrammi al secondo e larghezza in pixel. L'altezza si calcola dalla larghezza e le proporzioni restano — un clip 16:9 a 480 di larghezza esce 480×270.",
    },
    {
      h: "Avvia e prendi il file",
      p: "La GIF appare accanto al video come clip.gif. La coda mostra l'avanzamento e il percorso finale; trascina più video insieme e verranno fatti uno dopo l'altro.",
    },
  ],
  shotAlt:
    "MediaChef pronto a convertire: il piano attende un file video, a destra c'è la coda dei lavori.",
  shotCaption: "Il piano su cui arriva il video. Le ricette compaiono quando MediaChef ha letto il file.",

  tables: [
    {
      id: "fps",
      title: "Quanti fotogrammi al secondo scegliere",
      lead:
        "I fotogrammi al secondo decidono quanto il movimento appare fluido e, in proporzione diretta, quanto pesa il file. Una GIF conserva ogni fotogramma quasi per conto suo, quindi il doppio dei fotogrammi vuol dire più o meno il doppio della dimensione.",
      head: ["Fotogrammi/s", "Come appare", "Scegli quando"],
      rows: [
        ["10", "A scatti sul movimento veloce, bene su quello lento", "Registrazioni dello schermo, un cursore che si muove, testo che compare. Il file più piccolo."],
        ["15", "Abbastanza fluido per quasi tutto", "Il valore predefinito. Reazioni, scene brevi e tutto ciò di cui non sei sicuro."],
        ["24", "Come al cinema, senza scatti visibili", "Movimento veloce, sport, panoramiche — e solo se la dimensione ti va bene."],
      ],
      note:
        "Il conto è esatto: fotogrammi = fotogrammi/s × secondi. Dieci secondi a 15 sono 150 fotogrammi; a 24 diventano 240.",
    },
    {
      id: "width",
      title: "Quale larghezza scegliere",
      lead:
        "Tu indichi la larghezza, l'altezza si calcola per mantenere le proporzioni, e il ridimensionamento usa il filtro Lanczos. In tabella, in cosa si trasforma un video 16:9.",
      head: ["Larghezza", "Il 16:9 diventa", "Scegli quando"],
      rows: [
        ["320 px", "320×180", "Chat e messaggistica, dove la GIF viene mostrata piccola comunque. Circa la metà di 480."],
        ["480 px", "480×270", "Il valore predefinito. Leggibile in un post o in un messaggio e ancora leggera."],
        ["640 px", "640×360", "Quando conta il dettaglio: una demo di interfaccia, testo piccolo sullo schermo. Circa 1,5 volte più di 480."],
      ],
      note:
        "Nulla viene ingrandito: se la sorgente è larga 320 pixel resta a 320, anche se chiedi 640.",
    },
    {
      id: "size",
      title: "Quanto peserà il file",
      lead:
        "Misurato, non stimato: dieci secondi di video 1280×720 con movimento in tutto il quadro, passati per questa stessa ricetta. Un'immagine tranquilla si comprime meglio, una carica peggio — prendilo come la metà alta dell'intervallo.",
      head: ["Fotogrammi/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 MB", "0,88 MB", "1,36 MB"],
        ["15", "0,65 MB", "1,28 MB", "1,98 MB"],
        ["24", "0,98 MB", "1,96 MB", "3,05 MB"],
      ],
      note:
        "L'impostazione più economica e quella più costosa differiscono di quasi sette volte, e fra loro ci sono due clic. Se la GIF esce troppo pesante, abbassa prima la larghezza: all'occhio costa meno che perdere fotogrammi.",
    },
    {
      id: "duration",
      title: "Come la durata cambia la dimensione",
      lead:
        "La crescita è lineare, perché ogni secondo aggiunge i propri fotogrammi. Con le impostazioni predefinite — 15 fotogrammi, larghezza 480 — un secondo costa circa 130 KB, e questa cifra si muove appena con la durata.",
      head: ["Durata", "Dimensione predefinita", "Al secondo"],
      rows: [
        ["3 s", "0,37 MB", "128 KB"],
        ["5 s", "0,64 MB", "131 KB"],
        ["10 s", "1,28 MB", "131 KB"],
        ["20 s", "2,56 MB", "131 KB"],
        ["30 s", "3,82 MB", "130 KB"],
      ],
      note:
        "Perciò la durata è la leva più forte: tagliare un clip da trenta secondi a otto riduce il file di circa quattro volte, e nessuna impostazione ci si avvicina.",
    },
  ],

  whyTitle: "Perché convertire sul proprio computer",
  whyBullets: [
    {
      h: "Non viene caricato nulla.",
      p: "Un montaggio non pubblicato, la registrazione di una chiamata privata, una cattura dello schermo con i dati di un cliente: nulla lascia il disco. Non c'è copia su un server di cui dovresti credere alla politica di conservazione.",
    },
    {
      h: "Nessun limite di dimensione.",
      p: "I convertitori online finiscono fra 100 MB e 2 GB e ti mettono in coda. Una registrazione dello schermo da quattro giga si converte come una da quattro mega.",
    },
    {
      h: "Nessuna attesa per il caricamento.",
      p: "Fare la GIF è rapido; su un servizio web la parte lenta è mandarci prima il video. In locale quel passaggio non esiste.",
    },
    {
      h: "Gratis, senza account e senza filigrana.",
      p: "Open source sotto GPL-3.0: nessuna registrazione, nessun periodo di prova e niente stampato nell'angolo della tua GIF.",
    },
    {
      h: "Più di uno alla volta.",
      p: "Trascina una cartella intera di clip: la coda li percorre e ti dice dove è finita ogni GIF.",
    },
  ],

  notForTitle: "Quando la GIF è una cattiva idea",
  notForLead:
    "La GIF è un formato d'immagine del 1987 che fa un lavoro che i formati video fanno meglio. Vale la pena sceglierla di proposito, e questi sono i casi in cui non conviene.",
  notFor: [
    {
      h: "Ti serve l'audio.",
      p: "Una GIF non ha alcuna traccia audio: il formato non ha dove metterla. Se il clip ha bisogno del suono, lascialo video.",
    },
    {
      h: "Ti servono colori fedeli.",
      p: "Un fotogramma di GIF contiene al massimo 256 colori. Le sfumature, gli incarnati e le scene scure si dividono in bande visibili. Chi soffre di più è il materiale girato; un'interfaccia piatta o un cartone quasi non lo notano.",
    },
    {
      h: "Il clip è lungo.",
      p: "A 130 KB al secondo, una GIF di due minuti è circa 16 MB. Lo stesso clip come MP4 è di solito diverse volte più piccolo e si vede meglio.",
    },
    {
      h: "Va dove verrà ricodificato comunque.",
      p: "Diverse piattaforme di chat e social trasformano la GIF caricata in un video dalla loro parte. Lì hai pagato il sovrapprezzo di dimensione della GIF per nulla.",
    },
  ],

  faqTitle: "Domande",
  faq: [
    {
      q: "Quanto può durare la GIF?",
      a: "MediaChef non mette limiti: il limite è il tuo disco, e l'applicazione controlla lo spazio libero prima di partire. Il limite pratico è la dimensione: con le impostazioni predefinite ogni secondo costa circa 130 KB, quindi una GIF di un minuto è circa 8 MB e una di cinque minuti circa 39 MB. Se va in un messaggio, taglia prima il clip.",
    },
    {
      q: "Perché la mia GIF pesa più del video da cui è nata?",
      a: "Perché la GIF conserva i fotogrammi quasi per conto loro, mentre l'MP4 conserva la differenza fra loro. Su materiale girato vero questo rende l'MP4 diverse volte più piccolo a parità di immagine. Non è qualcosa che MediaChef possa correggere: è com'è fatto il formato.",
    },
    {
      q: "Una GIF ha l'audio?",
      a: "No. Il formato GIF non ha traccia audio, quindi il suono viene scartato nella conversione. Se ti serve il suono come file separato, applica al video originale la ricetta «Estrai l'audio in MP3».",
    },
    {
      q: "Perché i colori sembrano peggiori che nel video?",
      a: "Un fotogramma di GIF ammette al massimo 256 colori, e il video ne ha milioni. Le sfumature morbide — un cielo, una dissolvenza, una scena scura — diventano bande visibili. Le registrazioni dello schermo e la grafica piatta non perdono quasi nulla, perché avevano già pochi colori.",
    },
    {
      q: "Posso fare una GIF solo di una parte del video?",
      a: "Sì, in due passaggi: con la ricetta «Taglia senza ricodificare» estrai il frammento che vuoi e da quello fai la GIF. Tagliare prima è anche il modo più economico di alleggerire il file: la durata conta più di qualsiasi impostazione.",
    },
    {
      q: "Quali fotogrammi al secondo e quale larghezza scegliere?",
      a: "Parti dai valori predefiniti, 15 fotogrammi e 480 pixel: leggibile in un post, dieci secondi circa 1,3 MB. Scendi a 320 se il file deve essere piccolo e sali a 640 quando c'è testo piccolo che deve restare leggibile. Usa 24 solo per movimento veloce, e 10 per le registrazioni dello schermo, dove gli scatti si notano appena.",
    },
    {
      q: "Come rendo la GIF più piccola?",
      a: "In quest'ordine: accorcia il clip, poi riduci la larghezza, poi i fotogrammi. La durata è lineare, quindi passare da trenta secondi a otto risparmia circa quattro volte. Scendere da 640 a 320 pixel risparmia circa tre volte. Passare da 24 a 15 fotogrammi risparmia un terzo, ma è il cambiamento più visibile.",
    },
    {
      q: "C'è una filigrana o una versione a pagamento?",
      a: "No. MediaChef è open source sotto GPL-3.0, senza alcuna versione a pagamento, e non scrive nulla nell'immagine oltre alla conversione che hai chiesto.",
    },
    {
      q: "Funziona senza internet?",
      a: "Sì, del tutto. FFmpeg viaggia dentro il download, quindi fare una GIF non tocca mai la rete. Solo la trascrizione ha bisogno di scaricare un modello una volta, e quella è un'altra ricetta.",
    },
    {
      q: "Da quali formati video posso convertire?",
      a: "Da tutto ciò che FFmpeg riesce a leggere: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV e gli altri. MediaChef controlla il file con ffprobe e offre la ricetta GIF a qualsiasi video che abbia immagine.",
    },
    {
      q: "Posso convertire più video in una volta?",
      a: "Sì. Trascinali tutti sul piano, aggiungi la ricetta, e la coda li farà uno dopo l'altro, con avanzamento e tempo rimanente per ciascuno.",
    },
    {
      q: "La GIF va in loop?",
      a: "Sì: le GIF scritte così si ripetono all'infinito, ed è così che le riproducono tutti i visualizzatori e i browser.",
    },
    {
      q: "Una GIF può avere lo sfondo trasparente?",
      a: "Il formato ammette un colore trasparente, ma convertire un video normale non gli dà nulla da rendere trasparente: i fotogrammi di un video sono completamente opachi. La trasparenza ha senso solo per materiale che l'aveva già.",
    },
    {
      q: "Funziona su Windows e Linux o solo su macOS?",
      a: "Su tutti e tre. Per Windows c'è un installer, per Linux un AppImage e un .deb, per macOS un DMG per Apple Silicon. Ricetta e impostazioni sono identiche ovunque.",
    },
  ],

  ctaTitle: "Fai una GIF da questo clip",
  ctaSub: `MediaChef ${FACTS.version} — gratis, open source, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convertire MP4 in MP3 — gratis e offline" },
    { page: "transcribe", label: "Trascrivere audio in testo con Whisper, offline" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette, per categoria` },
  ],
} as const;
