// Гайд «видео в субтитры», итальянский. Реальные запросы: «creare sottotitoli
// automatici», «video in srt», «sottotitolare un video».
import { FACTS } from "../../facts";

export default {
  title: "Sottotitoli SRT da un video — gratis, offline, sul tuo computer",
  description:
    "Come ricavare da un video sottotitoli SRT con i tempi senza caricarlo da nessuna parte. Con misure vere: i quattro modelli Whisper cronometrati uno accanto all'altro, quanto vengono lunghe le battute e cosa contiene davvero ciascuno dei quattro formati.",
  h1: "Creare sottotitoli SRT da un video",
  crumb: "Video in SRT",

  answer:
    "Trascina il video in MediaChef, scegli «Crea sottotitoli SRT per un video», lascia il modello su small e la lingua su automatico, e avvia. Accanto al video comparirà un file .srt, tempi compresi. Tutto viene calcolato sulla tua macchina: il parlato non esce dal disco e, una volta scaricato il modello, la ricetta funziona con la rete spenta. Su un portatile M5, 2 minuti e 43 secondi di parlato hanno richiesto 6,2 secondi con il modello predefinito — circa 26 volte più veloce del tempo reale — e hanno prodotto 73 battute da 39 caratteri in media, abbastanza corte da leggersi con comodo.",

  facts: [
    { k: "Cosa serve", v: `MediaChef ${FACTS.version} più uno scaricamento del modello, una volta sola` },
    { k: "Modello predefinito", v: "small — 488 MB, scaricato una volta e poi tenuto" },
    { k: "Velocità", v: "≈26× il tempo reale con il modello predefinito (misurato, M5)" },
    { k: "Funziona offline", v: "Sì, una volta che il modello è sul disco" },
    { k: "Formati", v: "SRT, VTT, TXT semplice e JSON — una ricetta per ciascuno" },
    { k: "Cosa ottieni", v: "clip.subs.srt accanto al video, con l'originale intatto" },
  ],

  toc: [
    { id: "how", label: "Come si fa" },
    { id: "models", label: "Quale modello scegliere" },
    { id: "cues", label: "Quanto vengono lunghe le battute" },
    { id: "formats", label: "SRT, VTT, TXT o JSON" },
    { id: "recipes", label: "Quale ricetta per quale caso" },
    { id: "why", label: "Perché farlo in locale" },
    { id: "notfor", label: "Quando non è lo strumento giusto" },
    { id: "faq", label: "Domande" },
  ],

  stepsTitle: "Come sottotitolare un video",
  steps: [
    {
      h: "Scarica MediaChef",
      p: "Un file per macOS, Windows o Linux. Sia FFmpeg sia il motore di Whisper viaggiano dentro lo scaricamento: non c'è nulla da installare a parte né nulla da aggiungere al PATH.",
    },
    {
      h: "Scarica un modello, una volta sola",
      p: "La prima trascrizione chiede un modello vocale. Quello predefinito è small, da 488 MB, ed è con lui che sono fatte tutte le misure qui sotto; tiny pesa 78 MB, base 148 MB e large-v3-turbo 1,62 GB. Viene preso una volta, resta sul disco e da lì in poi la ricetta non tocca più la rete.",
    },
    {
      h: "Butta dentro il video e scegli la ricetta",
      p: "«Crea sottotitoli SRT per un video» prende il video direttamente: non serve estrarre prima l'audio. MediaChef decodifica la traccia nel mono a 16 kHz che Whisper pretende, in una cartella temporanea che non vedrai mai.",
    },
    {
      h: "Avvia e apri il .srt",
      p: "Il file arriva accanto al video con il nome clip.subs.srt, con le battute numerate e i loro tempi. Lettori, programmi di montaggio e piattaforme lo leggono così com'è e, dato che è testo semplice, un nome o un termine si corregge in qualsiasi editor.",
    },
  ],
  shotAlt:
    "MediaChef pronto a convertire: il piano di lavoro aspetta un file video, la coda dei lavori è a destra.",
  shotCaption: "Il piano di lavoro dove arriva il video. Le ricette compaiono quando MediaChef ha letto il file.",

  tables: [
    {
      id: "models",
      title: "Quale modello scegliere",
      lead:
        "Quattro modelli, gli stessi 2 minuti e 43 secondi di parlato, la stessa macchina: un portatile M5 con 16 GB, ogni modello scaldato prima e conteggiata la migliore di due passate.",
      head: ["Modello", "Scaricamento", "Tempo", "Contro il tempo reale", "Parole sbagliate"],
      rows: [
        ["tiny", "78 MB", "2,1 s", "×78", "5 su 540"],
        ["base", "148 MB", "2,6 s", "×63", "3 su 540"],
        ["small — quello predefinito", "488 MB", "6,2 s", "×26", "0 su 540"],
        ["large-v3-turbo", "1,62 GB", "11,5 s", "×14", "1 su 540"],
      ],
      note:
        "Leggi l'ultima colonna con cautela, perché l'audio di prova è una voce sintetica che legge un testo preparato: senza accento, senza rumore di fondo, senza nessuno che parli sopra. Ecco perché qui persino il modello più piccolo è quasi perfetto, e non è così che suona la registrazione di una riunione vera — su audio difficile la distanza fra questi modelli si allarga parecchio. La colonna del tempo, invece, si trasferisce al tuo caso di peso. E c'è una cosa che il confronto grezzo nascondeva: quasi tutte le discrepanze erano numeri scritti in cifre anziché in lettere — large-v3-turbo ha scritto «70», «10», «50», «30» dove il testo li diceva per esteso — e questa è formattazione, non un errore d'ascolto.",
    },
    {
      id: "cues",
      title: "Quanto vengono lunghe le battute",
      lead:
        "Un sottotitolo tecnicamente giusto resta inutilizzabile se butta venti parole sullo schermo tutte insieme. I modelli spezzano lo stesso parlato in modi molto diversi, e questo è misurato sulla stessa passata di sopra.",
      head: ["Modello", "Battute", "Durata media", "Caratteri in media", "La più lunga"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 caratteri"],
        ["base", "35", "4,7 s", "83", "100 caratteri"],
        ["small — quello predefinito", "73", "2,2 s", "39", "58 caratteri"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 caratteri"],
      ],
      note:
        "La regola diffusa in televisione sta intorno ai 42 caratteri per riga su due righe, quindi circa 84 caratteri sullo schermo insieme. Con questo metro, dei quattro solo small ci sta comodo: 39 caratteri in media e 58 nella battuta più lunga, mentre large-v3-turbo sfora il limite già su una battuta qualunque. Il modello predefinito, insomma, non è solo la scelta equilibrata sull'accuratezza — è anche quello che spezza il parlato nei pezzi più leggibili.",
    },
    {
      id: "formats",
      title: "SRT, VTT, testo semplice o JSON",
      lead:
        "La stessa trascrizione scritta in quattro modi. Le dimensioni vengono dagli stessi 2 minuti e 43 secondi di parlato, quindi si confrontano direttamente.",
      head: ["Formato", "Dimensione", "Cosa c'è dentro", "Quando prenderlo"],
      rows: [
        ["SRT", "5,5 KB", "Battute numerate, tempi con la virgola: 00:00:00,000", "Quasi sempre. Lo prendono lettori, montaggio e piattaforme"],
        ["VTT", "5,3 KB", "Intestazione WEBVTT, tempi con il punto: 00:00:00.000", "Sottotitoli per un lettore web, la traccia del browser"],
        ["TXT", "3,0 KB", "Testo di seguito, senza alcun tempo", "Vuoi le parole, non i sottotitoli"],
        ["JSON", "15,2 KB", "Ogni battuta più il modello e i parametri usati", "A leggerlo sarà un programma, non una persona"],
      ],
      note:
        "SRT e VTT si distinguono soprattutto per il carattere fra secondi e millesimi, quindi se un lettore rifiuta l'uno, l'altro è un cambio di ricetta e non una nuova trascrizione. Il JSON pesa circa il triplo dell'SRT perché porta i dati della passata accanto al testo.",
    },
    {
      id: "recipes",
      title: "Quale ricetta per quale caso",
      lead:
        `I sottotitoli non sono una ricetta ma diverse, e scegliere quella giusta ti risparmia un passaggio. Sono tutte nel catalogo da ${FACTS.recipeCount} ricette.`,
      head: ["Cosa hai", "Cosa vuoi", "Ricetta"],
      rows: [
        ["Un video", "Sottotitoli accanto", "Crea sottotitoli SRT per un video"],
        ["Un file audio", "Sottotitoli", "Trascrivi audio in sottotitoli SRT"],
        ["Parlato in un'altra lingua", "Sottotitoli inglesi in una passata", "Traduci il parlato in sottotitoli inglesi"],
        ["Qualsiasi cosa con del parlato", "Solo il testo", "Trascrivi audio in testo"],
        ["Qualsiasi cosa con del parlato", "Una traccia per lettore web", "Trascrivi audio in WebVTT"],
      ],
      note:
        "La ricetta di traduzione va dal parlato straniero direttamente a sottotitoli inglesi con i tempi, in una passata sola — niente «prima trascrivi, poi traduci». Va però solo verso l'inglese: è un limite del modello, non dell'applicazione.",
    },
  ],

  whyTitle: "Perché sottotitolare sul proprio computer",
  whyBullets: [
    {
      h: "Il parlato non esce dal tuo disco.",
      p: "Le registrazioni di riunioni, interviste e telefonate sono il tipo di file più delicato che la maggior parte delle persone si trovi a maneggiare, e una trascrizione online è per definizione una copia di quella conversazione sul server di qualcun altro. Qui non c'è nessun caricamento su cui ragionare.",
    },
    {
      h: "Niente tariffa al minuto.",
      p: "I servizi di trascrizione contano al minuto di audio, e questo trasforma un archivio lungo in una fattura vera. Il modello si scarica una volta e poi una registrazione di due ore costa quanto una di due minuti: niente.",
    },
    {
      h: "Funziona con la rete spenta.",
      p: "Appena il file del modello è sul disco, questa ricetta non tocca più internet. Funziona in aereo, su una macchina blindata e in una stanza dove il wifi è la cosa meno affidabile presente.",
    },
    {
      h: "Nessun limite di durata.",
      p: "I trascrittori web gratuiti in genere ti fermano a pochi minuti per file, proprio quando una registrazione merita di essere trascritta perché è lunga. Qui non c'è tetto.",
    },
    {
      h: "Una cartella intera in una volta.",
      p: "Butta dentro una cartella di registrazioni: la coda le smaltisce una alla volta e ti dice dove è finito ogni file di sottotitoli.",
    },
  ],

  notForTitle: "Quando non è lo strumento giusto",
  notForLead:
    "La ricetta scrive un file di sottotitoli. È un lavoro più stretto di «mettere i sottotitoli a un video», e la differenza conta in questi casi.",
  notFor: [
    {
      h: "Vuoi i sottotitoli impressi nell'immagine.",
      p: "Qui esce un .srt separato che il lettore carica accanto al video. Bruciare il testo dentro i fotogrammi è un'altra operazione: ricodifica il video, e dopo quelle parole non si possono più spegnere né correggere.",
    },
    {
      h: "Ti serve un'accuratezza da messa in onda.",
      p: "Anche sull'audio pulito misurato sopra i modelli sono inciampati su qualche parola, e le registrazioni vere sono più difficili. Tutto ciò che si pubblica sotto un obbligo di accessibilità lo rilegge una persona prima di uscire, qualunque cosa abbia prodotto la bozza.",
    },
    {
      h: "L'audio è davvero brutto.",
      p: "Voci fitte che si accavallano, una stanza registrata col telefono o la musica più alta della voce mettono a terra tutti e quattro i modelli. Sistemare prima l'audio — anche solo estrarne una traccia più pulita — rende più che salire di taglia di modello.",
    },
    {
      h: "Ti serve una traduzione in qualcosa che non sia l'inglese.",
      p: "Whisper traduce in inglese e solo in inglese. Per qualsiasi altra lingua di arrivo, trascrivi prima nella lingua originale e traduci quel testo con uno strumento fatto per quello.",
    },
  ],

  faqTitle: "Domande",
  faq: [
    {
      q: "È gratis?",
      a: `Sì, tutto quanto. MediaChef è open source con licenza GPL-3.0: nessuna versione a pagamento, nessun addebito al minuto, nessun tetto di durata. Anche i modelli si scaricano gratis. La versione attuale è la ${FACTS.version}.`,
    },
    {
      q: "Il mio video viene caricato da qualche parte?",
      a: "No. Il parlato lo elabora un file di modello che sta sul tuo disco. L'unica cosa che attraversa la rete è lo scaricamento del modello, una volta sola, e dopo la ricetta gira anche con internet spento.",
    },
    {
      q: "Quanto ci mette?",
      a: "Circa 26 volte più veloce del tempo reale con il modello predefinito: abbiamo misurato 6,2 secondi per 2 minuti e 43 secondi di parlato su un portatile M5. Con quel rapporto, una registrazione di un'ora se ne va in un paio di minuti. Sullo stesso audio tiny ha fatto ×78 e large-v3-turbo ×14.",
    },
    {
      q: "Quale modello dovrei scegliere?",
      a: "Parti da small, quello predefinito. Nelle nostre misure ha azzeccato ogni parola dell'audio di prova e ha prodotto le battute più leggibili — 39 caratteri in media contro 97 di large-v3-turbo. Sali solo se il tuo audio è difficile; scendi a tiny o base se vuoi una bozza in un paio di secondi.",
    },
    {
      q: "Quanto pesa il modello?",
      a: "78 MB tiny, 148 MB base, 488 MB small e 1,62 GB large-v3-turbo. Lo scaricamento avviene una volta sola. Dopo il file resta sul disco e ogni passata successiva lo usa senza chiedere.",
    },
    {
      q: "Devo dirgli in che lingua si parla?",
      a: "No. La lingua è su automatico e il modello la ricava dall'audio. Puoi comunque indicarla esplicitamente, e conviene farlo quando una registrazione si apre con qualche frase in un'altra lingua.",
    },
    {
      q: "Può tradurre i sottotitoli in inglese?",
      a: "Sì, con la ricetta «Traduci il parlato in sottotitoli inglesi»: entra parlato straniero, esce un SRT inglese con i tempi, in una passata sola invece di trascrivere e poi tradurre. L'inglese è l'unica lingua di arrivo che il modello sostiene.",
    },
    {
      q: "Che differenza c'è fra SRT e VTT?",
      a: "Soprattutto la punteggiatura nei tempi: l'SRT scrive 00:00:00,000 con la virgola e numera le battute, il VTT scrive 00:00:00.000 con il punto e comincia con una riga WEBVTT. L'SRT è ciò che si aspettano lettori e programmi di montaggio; il VTT è ciò che vuole un lettore web per la propria traccia di sottotitoli. Sono ricette distinte, quindi cambiare formato è rilanciare, non riscrivere il file.",
    },
    {
      q: "Posso correggere i sottotitoli dopo?",
      a: "Sì, un .srt è testo semplice. Aprilo in qualsiasi editor per sistemare un nome proprio, un termine tecnico o un tempo. È il modo normale di lavorare: il modello fa il novanta e qualcosa per cento, il resto lo recuperi a mano.",
    },
    {
      q: "Perché alcune mie battute sono troppo lunghe?",
      a: "Perché è il modello a decidere dove spezzare, e i modelli grandi spezzano meno spesso. Abbiamo misurato 39 caratteri per battuta con small contro 97 con large-v3-turbo, sullo stesso audio. Se le tue battute si allungano, tornare a small di solito risolve — e su parlato pulito non costa nulla in accuratezza.",
    },
    {
      q: "Distingue chi parla?",
      a: "No. Whisper scrive cosa è stato detto, non chi l'ha detto. Se ti servono le etichette «Interlocutore 1 / Interlocutore 2», dovrai metterle a mano o usare uno strumento fatto proprio per quello.",
    },
    {
      q: "Cosa succede se nel file non c'è parlato?",
      a: "La passata si ferma e ti dice che non ha sentito nulla di riconoscibile, invece di scrivere in silenzio un file vuoto. Il silenzio non produce sottotitoli, ed è voluto.",
    },
    {
      q: "Funziona su Windows e Linux?",
      a: "Su tutte e tre le piattaforme. Il parlato viene elaborato dalla CPU ovunque e, su Apple Silicon, anche dalla GPU: da lì vengono i numeri veloci qui sopra. La stessa ricetta su un portatile Windows modesto sarà più lenta, ma comunque più rapida che ascoltarsi la registrazione.",
    },
    {
      q: "Posso sottotitolare più file insieme?",
      a: "Sì. Butta dentro una cartella intera, aggiungi la ricetta e la coda li smaltisce uno dopo l'altro. Ogni file di sottotitoli viene scritto accanto alla propria sorgente.",
    },
    {
      q: "Il file video viene modificato?",
      a: "No. Accanto viene scritto un .srt separato — clip.subs.srt — e il video non viene modificato, né rinominato, né ricodificato. Questa ricetta non tocca affatto l'immagine.",
    },
  ],

  ctaTitle: "Prenditi i sottotitoli di quel video",
  ctaSub: `MediaChef ${FACTS.version} — gratis, open source, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio in testo — lo stesso motore, solo le parole" },
    { page: "trim", label: "Tagliare un video — misurato e senza perdite" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette per categoria` },
  ],
} as const;
