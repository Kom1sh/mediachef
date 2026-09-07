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
    "Premi il tasto ⌥ destro in qualsiasi punto del Mac, di' una frase, premi di nuovo: il testo viene scritto direttamente nel campo dove sta il cursore — un terminale, una chat, un modulo del browser. Riconosce lo stesso Whisper che MediaChef porta già con sé, quindi l'audio non esce dal tuo disco e nessuno conta i minuti. Nella nostra misura una frase di cinque secondi è tornata in 780 millisecondi.",

  facts: [
    { k: "Stato", v: "Pubblicata dalla versione 0.8.0, per ora solo macOS" },
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
      p: "Nella scheda Dettatura c'è un interruttore e un attivatore a scelta: il tasto ⌥ destro, il tasto ⌘ destro o una di due combinazioni. Finché non l'accendi, MediaChef non registra nessuna scorciatoia globale: un'applicazione che si prende in silenzio una combinazione di sistema è un'applicazione che rompe le altre.",
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
  shotCaption: "La scheda Dettatura di MediaChef: attivatore, modelli, lingua, dizionario e stato del permesso, tutto in un posto.",

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
      h: "Non sei su un Mac.",
      p: "macOS viene per primo perché è lì che è stata costruita e provata. Windows e Linux seguono: il motore di riconoscimento è già multipiattaforma, il lavoro per piattaforma serve alla scorciatoia e alla scrittura del testo.",
    },
    {
      h: "Ti serve che scriva mentre parli.",
      p: "Il testo arriva nel campo quando hai finito, non parola per parola mentre parli: così la frase viene riconosciuta intera e con più precisione. Mentre parli, una bozza del riconoscimento è visibile nel pannello sotto il notch — ma ciò che viene scritto è un unico risultato pulito, non una serie di correzioni.",
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
      a: "Di default il tasto ⌥ destro — un modificatore da solo: tienilo premuto e parla, oppure premilo una volta per iniziare e di nuovo per finire; con Shift il testo viene inviato con Invio. Un modificatore da solo non scrive nulla e non entra in conflitto con nulla. Combinazioni come ⌥ Space scrivevano uno spazio in modalità pressione prolungata se ⌥ veniva rilasciato prima, quindi sono state tolte; ⌃⌥ Space e ⌃⌥ D restano come alternative.",
    },
    {
      q: "Perché serve il permesso Accessibilità?",
      a: "Per due cose. Sentire il tasto di attivazione: un modificatore da solo non si può registrare come scorciatoia normale, quindi MediaChef ascolta la tastiera da sé, e macOS lo consente solo con Accessibilità. E scrivere testo nella finestra di un'altra applicazione, che il sistema considera input sintetico. Un solo permesso copre entrambe e si concede una volta; poi riavvia l'app.",
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
      a: `Sì. MediaChef è open source con licenza GPL-3.0, senza versione a pagamento e senza abbonamento — dettatura compresa. La versione pubblicata è la ${FACTS.version}, dettatura compresa.`,
    },
    {
      q: "Perché il pannello mostra un testo diverso da quello che viene scritto?",
      a: "Sono due passaggi distinti. Mentre parli, il pannello mostra una bozza prodotta da un modello leggero ogni secondo e mezzo, per stare al passo con il parlato. Ciò che viene scritto è il risultato finale del modello principale sull'intera registrazione, con il tuo dizionario dei termini. Entrambi i modelli si scelgono nella scheda Dettatura: imposta per l'anteprima lo stesso modello del principale e la differenza sparisce — al prezzo di un pannello in ritardo.",
    },
    {
      q: "Perché dopo un aggiornamento chiede di nuovo i permessi?",
      a: "macOS lega il permesso alla firma dell'app, non al suo nome. MediaChef non ha un certificato Apple — non intendiamo pagarlo — quindi ogni versione è firmata in modo diverso e il sistema tratta l'app aggiornata come nuova. L'app stessa rimuove la voce scaduta e richiede il permesso: un interruttore e un «Consenti» per aggiornamento.",
    },
    {
      q: "L'interruttore nelle Impostazioni di Sistema è attivo, ma la dettatura non funziona.",
      a: "Vuol dire che quella voce appartiene alla copia precedente dell'app: è quello che succede dopo un aggiornamento. Disattivarla e riattivarla non la ricollega, abbiamo provato. MediaChef cancella quella voce da sé e fa comparire la richiesta di sistema: attivala nell'elenco e riavvia l'app.",
    },
    {
      q: "La registrazione è venuta vuota anche se il microfono funziona.",
      a: "Di solito è l'auricolare: gli AirPods nella custodia restano collegati e restano l'ingresso predefinito, e macOS ne consegna zeri puri — a qualunque app, non solo alla nostra. La notifica dice da quale dispositivo è arrivato il silenzio. Indossa l'auricolare, oppure scegli il microfono esplicitamente nella scheda Dettatura.",
    },
    {
      q: "Posso scegliere un microfono specifico?",
      a: "Sì: la scheda Dettatura elenca i dispositivi di ingresso. «Come il sistema» significa l'ultimo auricolare collegato e non il microfono del portatile, ed è proprio per questo che una scelta esplicita è più affidabile.",
    },
    {
      q: "Cosa succede se premo l'attivatore e non dico niente?",
      a: "Non viene scritto nulla. Una registrazione vuota non arriva nemmeno al riconoscimento: Whisper non tace davanti al silenzio, inventa — il modello russo scriveva i crediti dei sottotitoli. Quelle firme dei sottotitolatori vengono riconosciute e trattate come silenzio, e tu ricevi «nessun parlato».",
    },
    {
      q: "Perché la prima pressione dopo l'avvio è più lenta?",
      a: "Il sottosistema audio di macOS si sta svegliando: fino a due secondi alla prima apertura del microfono per avvio. Il pannello compare subito, prima che parta la registrazione, quindi tieni premuto il tasto finché non dice che sta ascoltando. Dopo, l'apertura richiede decine di millisecondi.",
    },
    {
      q: "Come invio un messaggio con la voce senza premere Invio?",
      a: "Premi l'attivatore insieme a Shift: il testo viene scritto e Invio arriva da sé. Una dettatura vuota non premerà mai Invio — altrimenti tacere invierebbe un messaggio vuoto, o eseguirebbe il comando precedente in un terminale.",
    },
    {
      q: "Cosa succede se premo un altro tasto tenendo l'attivatore?",
      a: "La registrazione viene annullata e non viene scritto nulla. Il tasto ⌥ destro più una lettera è la scorciatoia di qualcun altro, non una dettatura, e il programma la interpreta così.",
    },
    {
      q: "Quello che detto viene salvato su disco?",
      a: "No. La registrazione vive in una cartella temporanea e viene cancellata con essa, e conservare uno storico delle trascrizioni è disattivato per impostazione predefinita. L'app promette che i tuoi contenuti non lasciano la macchina; scriverci sopra in chiaro tutto ciò che detti stonerebbe con quella promessa — si dettano password e pezzi di conversazioni private.",
    },
    {
      q: "Funziona sopra le applicazioni a schermo intero?",
      a: "Sì. Il pannello viene disegnato sopra le finestre a schermo intero e su tutte le scrivanie — editor e terminali a schermo intero sono esattamente dove si detta.",
    },
    {
      q: "Un'altra app usa già l'attivatore. E ora?",
      a: "La scheda Dettatura offre anche il tasto ⌘ destro — l'altro modificatore da solo a cui macOS non assegna azioni proprie — più due combinazioni ordinarie, ⌃⌥ Spazio e ⌃⌥ D, nel caso entrambi i modificatori siano già occupati.",
    },
  ],

  ctaTitle: "MediaChef oggi",
  ctaSub: `Versione ${FACTS.version} — gratis, open source, macOS · Windows · Linux. La dettatura è inclusa.`,
  also: [
    { page: "transcribe", label: "Audio in testo — lo stesso motore, per i file" },
    { page: "srt", label: "Video in sottotitoli SRT — misurato e offline" },
    { page: "catalog", label: `Tutte le ${FACTS.recipeCount} ricette per categoria` },
  ],
} as const;
