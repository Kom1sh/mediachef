// Гайд «голосовой ввод», итальянский. Реальные запросы: «dettatura vocale mac»,
// «voce in testo offline», «scrivere parlando».
import { FACTS } from "../../facts";

export default {
  title: "Dettatura vocale sul Mac — offline, gratis, senza addebito al minuto",
  description:
    "Premi una scorciatoia dove vuoi, parla, e le parole compaiono dove sta il cursore. Il riconoscimento gira sulla tua macchina con Whisper: niente viene caricato, niente viene tariffato. Dentro: latenza misurata, dimensioni dei modelli e l'unico permesso che serve.",
  h1: "Scrivere con la voce senza che nulla lasci il computer",
  crumb: "Dettatura vocale",

  answer:
    "Premi ⌥ Space in qualsiasi punto del Mac, di' una frase, premi di nuovo: il testo viene scritto direttamente nel campo dove sta il cursore — un terminale, una chat, un modulo del browser. Riconosce lo stesso Whisper che MediaChef porta già con sé, quindi l'audio non esce dal tuo disco e nessuno conta i minuti. Nella nostra misura una frase di cinque secondi è tornata in 780 millisecondi. È l'unica funzione di questo sito non ancora pubblicata: è finita e in uso quotidiano all'interno, e arriva con la prossima versione.",

  facts: [
    { k: "Stato", v: "Non ancora pubblicata — arriva con la prossima versione" },
    { k: "Dove gira", v: "Interamente sulla tua macchina, senza account e senza caricamenti" },
    { k: "Velocità", v: "780 ms dal tasto al testo su una frase di cinque secondi (misurato)" },
    { k: "Quanto costa", v: "Niente. Né abbonamento né addebito al minuto" },
    { k: "Piattaforma", v: "macOS per primo; Windows e Linux dopo" },
    { k: "Scaricamento unico", v: "Un modello vocale, 488 MB quello predefinito" },
  ],

  toc: [
    { id: "how", label: "Come funziona" },
    { id: "speed", label: "Quanto è veloce" },
    { id: "models", label: "Quale modello usare" },
    { id: "dictionary", label: "Insegnargli le tue parole" },
    { id: "delivery", label: "Dove finisce il testo" },
    { id: "why", label: "Perché in locale" },
    { id: "notfor", label: "Quando non aiuterà" },
    { id: "faq", label: "Domande" },
  ],

  stepsTitle: "Come funziona la dettatura",
  steps: [
    {
      h: "Accenderla una volta",
      p: "Nelle Impostazioni c'è un interruttore e tre scorciatoie a scelta. Finché non l'accendi, MediaChef non registra nessuna scorciatoia globale: un'applicazione che si prende in silenzio una combinazione di sistema è un'applicazione che rompe le altre.",
    },
    {
      h: "Premere la scorciatoia dove vuoi",
      p: "Funziona con MediaChef in secondo piano o con la finestra chiusa. Due modi: tenere premuto il tasto mentre parli, oppure premerlo una volta per iniziare e una per fermare — a seconda della lunghezza del pensiero.",
    },
    {
      h: "Parlare",
      p: "Il microfono si apre solo per il tempo della dettatura, così il punto arancione nella barra dei menu si spegne appena hai finito. Tra una pressione e l'altra nessuno ascolta.",
    },
    {
      h: "Il testo compare dove sta il cursore",
      p: "Scritto direttamente nel campo attivo, senza toccare gli appunti. Se preferisci il contrario, che finisca negli appunti, è l'impostazione accanto.",
    },
  ],
  shotAlt:
    "MediaChef pronto a convertire: il piano di lavoro aspetta un file video, la coda dei lavori è a destra.",
  shotCaption: "MediaChef oggi. La dettatura aggiungerà un quarto modo ai tre già presenti.",

  tables: [
    {
      id: "speed",
      title: "Quanto è veloce davvero",
      lead:
        "Misura da un capo all'altro su un portatile M5: dal rilascio del tasto alla consegna del testo. La prima riga è una dettatura vera dalla sessione viva, le altre una frase fissa di quindici secondi passata in ciascun modello.",
      head: ["Cosa è stato misurato", "Modello", "Tempo"],
      rows: [
        ["Frase vera di cinque secondi, dal tasto al testo scritto", "small", "780 ms"],
        ["Frase di quindici secondi", "tiny", "non misurato a parte"],
        ["Frase di quindici secondi", "small", "0,66–0,75 s"],
        ["Frase di quindici secondi", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Questi numeri nascondono due cose, ed entrambe vale la pena saperle. Il microfono impiega 56 millisecondi a consegnare il primo campione, quindi una parola iniziata nello stesso istante della pressione può essere tagliata — in pratica si parla dopo il tasto, e nessuno se ne accorge. E la primissima dettatura dopo aver concesso il permesso del microfono va perduta: il sistema passa circa 1,8 secondi a mostrare la sua finestra. Premi di nuovo e funziona.",
    },
    {
      id: "models",
      title: "Quale modello usare",
      lead:
        "Gli stessi quattro modelli che usano le ricette di trascrizione: se già trascrivi file con MediaChef il modello è sul tuo disco e la dettatura non costa nessuno scaricamento.",
      head: ["Modello", "Scaricamento", "Carattere"],
      rows: [
        ["tiny", "78 MB", "Il più veloce, grezzo — va bene per un appunto per sé"],
        ["base", "148 MB", "Veloce, discreto"],
        ["small — il predefinito", "488 MB", "L'equilibrio, e quello che le ricette usano già"],
        ["large-v3-turbo", "1,62 GB", "Qualità migliore, circa il doppio dell'attesa"],
      ],
      note:
        "Comincia da small. È il predefinito per una ragione pratica più che tecnica: è lo stesso modello delle ricette, quindi a un utente già esistente la dettatura funziona senza scaricare niente. Passa a large-v3-turbo se il tuo audio è difficile — accento marcato, stanza rumorosa, due lingue nella stessa frase — e accetta circa il doppio dell'attesa per frase.",
    },
    {
      id: "dictionary",
      title: "Insegnargli le tue parole",
      lead:
        "Ogni mestiere ha parole che il riconoscimento massacra: nomi di prodotti, gergo, il cognome di un collega. Quella lista puoi darla al modello, e smette di indovinare. Sotto, la stessa registrazione senza e con un dizionario di quaranta termini.",
      head: ["Senza dizionario", "Con"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "È costato 0,04 secondi: 0,87 contro 0,83 sullo stesso spezzone. Il tetto è di circa 224 gettoni, cioè attorno ai 400 caratteri in cirillico o il triplo in alfabeto latino; MediaChef li conta per te e taglia, perché Whisper tronca in silenzio una lista troppo lunga. È esattamente ciò che la dettatura integrata di macOS non sa fare: non le si può insegnare il tuo vocabolario.",
    },
    {
      id: "delivery",
      title: "Dove finisce il testo",
      lead:
        "Due scelte, e la differenza pesa più di quanto sembri quando si detta più volte all'ora.",
      head: ["Impostazione", "Cosa succede", "Cosa serve"],
      rows: [
        ["Scriverlo", "Le parole compaiono nel campo attivo. I tuoi appunti restano intatti", "Il permesso Accessibilità, una volta"],
        ["Negli appunti", "Il testo viene copiato e lo incolli tu con ⌘V", "Nulla oltre al microfono"],
      ],
      note:
        "Scrivere lascia in pace gli appunti, ed è proprio per questo che conviene preferirlo: se ogni dettatura li sovrascrivesse, non potresti tenerci un collegamento mentre lavori. macOS considera lo scrivere in un'altra applicazione come input sintetico e chiede il permesso Accessibilità — il primo tentativo apre da sé il riquadro giusto delle Impostazioni di Sistema. Quando il permesso manca, il testo finisce comunque negli appunti: una dettatura non si perde mai.",
    },
  ],

  whyTitle: "Perché farlo in locale è tutto il punto",
  whyBullets: [
    {
      h: "La tua voce non viene caricata.",
      p: "Si detta proprio quello che non si incollerebbe in un modulo web: idee a metà, nomi di clienti, la frase che stai per mandare. La dettatura nel cloud è per definizione una copia di tutto questo sul server di qualcun altro.",
    },
    {
      h: "Nessun contatore al minuto.",
      p: "I servizi di trascrizione fatturano al minuto, e questo fa pensare prima di parlare. Qui lo scaricamento del modello è unico, e la centesima dettatura della giornata costa esattamente quanto la prima.",
    },
    {
      h: "Funziona con la rete spenta.",
      p: "In aereo, su una macchina blindata, in una stanza dove il wifi è la cosa meno affidabile presente. Una volta che il modello è sul disco, la dettatura non tocca internet.",
    },
    {
      h: "Impara il tuo vocabolario.",
      p: "Il dizionario è una semplice lista delle tue parole, ed è l'unica cosa che la dettatura integrata in macOS non sa fare.",
    },
    {
      h: "Open source, nessun abbonamento.",
      p: "GPL-3.0, tutto leggibile su GitHub. Gli strumenti a pagamento di questa nicchia chiedono un mensile per quello che sotto è lo stesso modello aperto.",
    },
  ],

  notForTitle: "Quando non aiuterà",
  notForLead:
    "Detto chiaro, perché scoprirlo dopo è peggio che leggerlo adesso.",
  notFor: [
    {
      h: "La vuoi adesso.",
      p: "È l'unica pagina di questo sito che descrive qualcosa che non si può ancora scaricare. La dettatura è finita e in uso quotidiano all'interno, ed esce con la prossima versione — ma quella pubblicata oggi non l'ha.",
    },
    {
      h: "Non sei su un Mac.",
      p: "macOS viene per primo perché è lì che è stata costruita e provata. Windows e Linux seguono: il motore di riconoscimento è già multipiattaforma, il lavoro per piattaforma serve alla scorciatoia e alla scrittura del testo.",
    },
    {
      h: "Ti serve che scriva mentre parli.",
      p: "Il testo arriva quando hai finito, non parola per parola durante il discorso. È uno scambio voluto: riconoscere la frase intera è più preciso e, a queste velocità, il modo continuo non porterebbe nulla.",
    },
    {
      h: "Ti serve distinguere chi parla.",
      p: "Scrive cosa è stato detto, non chi l'ha detto. Per un'intervista a due voci serve uno strumento di trascrizione fatto per quello, non una scorciatoia di dettatura.",
    },
  ],

  faqTitle: "Domande",
  faq: [
    {
      q: "La mia voce viene mandata da qualche parte?",
      a: "No. L'audio lo riconosce un file di modello che sta sul tuo disco, e viene cancellato insieme alla cartella temporanea in cui è vissuto. L'unica cosa che attraversa la rete è lo scaricamento del modello, una volta sola; dopo la dettatura funziona a rete completamente spenta.",
    },
    {
      q: "Quanto è veloce?",
      a: "780 millisecondi dal rilascio del tasto alla comparsa del testo, misurati su una frase vera di cinque secondi con il modello predefinito su un portatile M5. Una frase di quindici secondi ha richiesto 0,66–0,75 secondi. Il modello pesante large-v3-turbo richiede circa il doppio.",
    },
    {
      q: "Funziona in qualsiasi applicazione?",
      a: "Sì: la scorciatoia è registrata a livello di sistema, quindi scatta in un terminale, in un browser, in una chat o in un editor, con MediaChef in secondo piano o perfino con la finestra chiusa.",
    },
    {
      q: "Quale combinazione usa?",
      a: "⌥ Space per impostazione predefinita, con ⌃⌥ Space e ⌃⌥ D come alternative. Deliberatamente non Cmd più una lettera: una scorciatoia globale viene intercettata prima che la veda qualsiasi applicazione, quindi prendersi ⌘V o ⌘D romperebbe quel comando in ogni programma che hai.",
    },
    {
      q: "Perché serve il permesso Accessibilità?",
      a: "Solo per scrivere il testo nella finestra di un'altra applicazione, cosa che macOS conta come input sintetico. Se preferisci non concederlo, sposta la consegna sugli appunti: quella non richiede nulla oltre al microfono, e incolli tu con ⌘V.",
    },
    {
      q: "E se non lo concedo?",
      a: "Il testo va negli appunti e una notifica dice perché, con il riquadro giusto delle Impostazioni di Sistema già aperto. Niente di dettato va mai perduto per un permesso mancante.",
    },
    {
      q: "Quanto disco serve?",
      a: "L'applicazione più un modello vocale: 488 MB quello predefinito, 78 MB se scegli il più piccolo, 1,62 GB il più grande. Se già usi MediaChef per trascrivere file, il modello è già sul tuo disco e la dettatura non aggiunge nulla.",
    },
    {
      q: "Capisce l'italiano, o due lingue insieme?",
      a: "Whisper sostiene 99 lingue, e puoi indicare la tua o lasciargliela rilevare. Mescolare lingue nella stessa frase è proprio il caso in cui il modello pesante si guadagna la taglia e in cui il dizionario aiuta di più.",
    },
    {
      q: "Quanto può durare una dettatura?",
      a: "Cinque minuti, dopo i quali si ferma da sola e trascrive quello che ha sentito invece di buttarlo. In pratica si detta a frasi, non a monologhi.",
    },
    {
      q: "Posso annullare a metà frase?",
      a: "Esc durante la registrazione butta la presa e non consegna nulla. È registrato solo per la durata della dettatura, quindi non interferisce con Esc in nessun altro posto.",
    },
    {
      q: "Sostituisce la dettatura integrata di macOS?",
      a: "Fa lo stesso lavoro con due differenze che contano: a questa si può insegnare il tuo vocabolario, e l'audio resta sulla tua macchina. Se nessuna delle due ti riguarda, quella integrata è già lì ed è anch'essa gratuita.",
    },
    {
      q: "È davvero gratis?",
      a: `Sì. MediaChef è open source con licenza GPL-3.0, senza versione a pagamento e senza abbonamento — dettatura compresa. La versione pubblicata è la ${FACTS.version}; la dettatura arriva con la prossima.`,
    },
  ],

  ctaTitle: "MediaChef oggi",
  ctaSub: `Versione ${FACTS.version} — gratis, open source, macOS · Windows · Linux. La dettatura arriva con la prossima versione.`,
  also: [
    { page: "transcribe", label: "Audio in testo — lo stesso motore, per i file" },
    { page: "srt", label: "Video in sottotitoli SRT — misurato e offline" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette per categoria` },
  ],
} as const;
