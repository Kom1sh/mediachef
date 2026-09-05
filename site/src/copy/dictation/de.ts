// Гайд «голосовой ввод», немецкий. Реальные запросы: «spracheingabe mac»,
// «diktieren offline», «sprache zu text kostenlos».
import { FACTS } from "../../facts";

export default {
  title: "Spracheingabe auf dem Mac — offline, kostenlos, ohne Minutenabrechnung",
  description:
    "Kurzbefehl irgendwo drücken, sprechen — und die Wörter erscheinen da, wo der Cursor steht. Die Erkennung läuft auf Ihrem eigenen Rechner mit Whisper: nichts wird hochgeladen, nichts abgerechnet. Drin: gemessene Verzögerung, Modellgrößen und die eine Freigabe, die es braucht.",
  h1: "Mit der Stimme schreiben, ohne dass etwas den Rechner verlässt",
  crumb: "Spracheingabe",

  answer:
    "Drücken Sie ⌥ Space irgendwo auf dem Mac, sagen Sie einen Satz, drücken Sie noch einmal — und der Text wird direkt in das Feld getippt, in dem der Cursor steht: ein Terminal, ein Chat, ein Browserformular. Erkannt wird von demselben Whisper, den MediaChef schon mitbringt, also verlässt der Ton Ihre Festplatte nicht und niemand zählt Minuten. In unserer Messung kam ein Satz von fünf Sekunden nach 780 Millisekunden zurück. Es ist die einzige Funktion auf dieser Seite, die noch nicht veröffentlicht ist: sie ist fertig und intern im täglichen Gebrauch, und sie kommt mit der nächsten Version.",

  facts: [
    { k: "Stand", v: "Noch nicht veröffentlicht — kommt mit der nächsten Version" },
    { k: "Wo es läuft", v: "Vollständig auf Ihrem Rechner, ohne Konto und ohne Upload" },
    { k: "Tempo", v: "780 ms von der Taste zum Text bei einem Fünf-Sekunden-Satz (gemessen)" },
    { k: "Was es kostet", v: "Nichts. Kein Abo, keine Minutenabrechnung" },
    { k: "Plattform", v: "macOS zuerst; Windows und Linux danach" },
    { k: "Einmaliger Download", v: "Ein Sprachmodell, 488 MB beim voreingestellten" },
  ],

  toc: [
    { id: "how", label: "Wie es funktioniert" },
    { id: "speed", label: "Wie schnell es ist" },
    { id: "models", label: "Welches Modell nehmen" },
    { id: "dictionary", label: "Ihm Ihre Wörter beibringen" },
    { id: "delivery", label: "Wohin der Text geht" },
    { id: "why", label: "Warum lokal" },
    { id: "notfor", label: "Wann es nicht hilft" },
    { id: "faq", label: "Fragen" },
  ],

  stepsTitle: "Wie das Diktat funktioniert",
  steps: [
    {
      h: "Einmal einschalten",
      p: "In den Einstellungen gibt es einen Schalter und drei Kurzbefehle zur Wahl. Bis Sie einschalten, registriert MediaChef überhaupt keinen systemweiten Kurzbefehl: eine Anwendung, die sich still eine Systemkombination nimmt, ist eine Anwendung, die andere kaputt macht.",
    },
    {
      h: "Kurzbefehl irgendwo drücken",
      p: "Funktioniert mit MediaChef im Hintergrund oder mit geschlossenem Fenster. Zwei Wege: die Taste halten, während Sie sprechen, oder einmal zum Starten und einmal zum Stoppen drücken — je nachdem, wie lang der Gedanke ist.",
    },
    {
      h: "Sprechen",
      p: "Das Mikrofon öffnet sich nur während des Diktats, deshalb erlischt der orange Punkt in der Menüleiste, sobald Sie fertig sind. Zwischen zwei Tastendrücken hört niemand zu.",
    },
    {
      h: "Der Text erscheint, wo der Cursor steht",
      p: "Direkt in das aktive Feld getippt, ohne die Zwischenablage anzufassen. Wenn Sie das Gegenteil bevorzugen — in die Zwischenablage —, ist das die Einstellung daneben.",
    },
  ],
  shotAlt:
    "MediaChef bereit zum Konvertieren: die Arbeitsfläche wartet auf eine Videodatei, rechts die Warteschlange.",
  shotCaption: "MediaChef heute. Das Diktat fügt den drei vorhandenen Modi einen vierten hinzu.",

  tables: [
    {
      id: "speed",
      title: "Wie schnell es wirklich ist",
      lead:
        "Durchgehend gemessen auf einem M5-Laptop: vom Loslassen der Taste bis zum ausgelieferten Text. Die erste Zeile ist ein echtes Diktat aus der lebenden Sitzung, die übrigen ein fester Fünfzehn-Sekunden-Satz durch jedes Modell.",
      head: ["Was gemessen wurde", "Modell", "Zeit"],
      rows: [
        ["Echter Fünf-Sekunden-Satz, von der Taste zum getippten Text", "small", "780 ms"],
        ["Satz von fünfzehn Sekunden", "tiny", "nicht getrennt gemessen"],
        ["Satz von fünfzehn Sekunden", "small", "0,66–0,75 s"],
        ["Satz von fünfzehn Sekunden", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Diese Zahlen verbergen zwei Dinge, und beide sind es wert, gewusst zu werden. Das Mikrofon braucht 56 Millisekunden bis zum ersten Sample, ein im selben Augenblick wie der Tastendruck begonnenes Wort kann also beschnitten werden — in der Praxis spricht man nach der Taste, und niemand merkt es. Und das allererste Diktat nach der Freigabe des Mikrofons geht verloren: das System zeigt etwa 1,8 Sekunden lang seinen Dialog. Noch einmal drücken, und es läuft.",
    },
    {
      id: "models",
      title: "Welches Modell nehmen",
      lead:
        "Dieselben vier Modelle, die die Transkriptionsrezepte verwenden — wenn Sie mit MediaChef also schon Dateien transkribieren, liegt das Modell auf Ihrer Platte und das Diktat kostet keinen einzigen Download.",
      head: ["Modell", "Download", "Charakter"],
      rows: [
        ["tiny", "78 MB", "Das schnellste, grob — reicht für eine Notiz an sich selbst"],
        ["base", "148 MB", "Schnell, ordentlich"],
        ["small — das voreingestellte", "488 MB", "Die Balance, und das, was die Rezepte schon nutzen"],
        ["large-v3-turbo", "1,62 GB", "Beste Qualität, etwa doppeltes Warten"],
      ],
      note:
        "Fangen Sie mit small an. Es ist voreingestellt aus einem praktischen und nicht aus einem technischen Grund: es ist dasselbe Modell wie in den Rezepten, für einen bestehenden Nutzer läuft das Diktat also ohne jeden Download. Gehen Sie auf large-v3-turbo, wenn Ihr Ton schwierig ist — starker Akzent, lauter Raum, zwei Sprachen in einem Satz — und nehmen Sie ungefähr die doppelte Wartezeit pro Satz in Kauf.",
    },
    {
      id: "dictionary",
      title: "Ihm Ihre Wörter beibringen",
      lead:
        "Jedes Fach hat Wörter, die die Erkennung zerlegt: Produktnamen, Jargon, der Nachname einer Kollegin. Diese Liste können Sie dem Modell geben, und es hört auf zu raten. Unten dieselbe Aufnahme, ohne und mit einem Wörterbuch aus vierzig Begriffen.",
      head: ["Ohne Wörterbuch", "Mit"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "Gekostet hat es 0,04 Sekunden: 0,87 gegen 0,83 auf demselben Ausschnitt. Die Obergrenze liegt bei etwa 224 Token, also ungefähr 400 Zeichen in Kyrillisch oder dem Dreifachen in lateinischer Schrift; MediaChef zählt für Sie und kürzt, denn Whisper schneidet eine zu lange Liste stillschweigend ab. Genau das kann das in macOS eingebaute Diktat nicht: ihm lässt sich Ihr Vokabular nicht beibringen.",
    },
    {
      id: "delivery",
      title: "Wohin der Text geht",
      lead:
        "Zwei Möglichkeiten, und der Unterschied wiegt schwerer, als er klingt, wenn man mehrmals pro Stunde diktiert.",
      head: ["Einstellung", "Was passiert", "Was es braucht"],
      rows: [
        ["Tippen", "Die Wörter erscheinen im aktiven Feld. Ihre Zwischenablage bleibt unangetastet", "Die Bedienungshilfen-Freigabe, einmal"],
        ["Zwischenablage", "Der Text wird kopiert, und Sie fügen ihn mit ⌘V selbst ein", "Nichts außer dem Mikrofon"],
      ],
      note:
        "Tippen lässt die Zwischenablage in Ruhe, und genau deshalb lohnt es sich: würde jedes Diktat sie überschreiben, könnten Sie dort keinen Link aufbewahren, während Sie arbeiten. macOS zählt das Tippen in eine andere Anwendung als synthetische Eingabe und verlangt die Bedienungshilfen-Freigabe — der erste Versuch öffnet von selbst den richtigen Bereich der Systemeinstellungen. Fehlt die Freigabe, landet der Text trotzdem in der Zwischenablage: ein Diktat geht niemals verloren.",
    },
  ],

  whyTitle: "Warum es lokal zu tun der eigentliche Punkt ist",
  whyBullets: [
    {
      h: "Ihre Stimme wird nicht hochgeladen.",
      p: "Diktiert wird genau das, was man in kein Webformular einfügen würde: halbfertige Gedanken, Kundennamen, der Satz, den man gerade abschicken will. Diktat in der Cloud ist per Definition eine Kopie von allem davon auf fremdem Server.",
    },
    {
      h: "Kein Minutenzähler.",
      p: "Transkriptionsdienste rechnen je Minute ab, und das lässt einen vor dem Sprechen nachdenken. Hier fällt der Modell-Download einmal an, und das hundertste Diktat des Tages kostet genau so viel wie das erste.",
    },
    {
      h: "Läuft mit abgeschaltetem Netz.",
      p: "Im Flugzeug, auf einem abgeriegelten Rechner, in einem Raum, in dem das WLAN das Unzuverlässigste ist. Liegt das Modell auf der Platte, fasst das Diktat das Internet nicht mehr an.",
    },
    {
      h: "Es lernt Ihr Vokabular.",
      p: "Das Wörterbuch ist eine einfache Liste Ihrer Wörter, und es ist das Einzige, was das in macOS eingebaute Diktat nicht kann.",
    },
    {
      h: "Quelloffen, kein Abo.",
      p: "GPL-3.0, alles auf GitHub nachlesbar. Die bezahlten Werkzeuge dieser Nische verlangen monatlich für das, was darunter dasselbe offene Modell ist.",
    },
  ],

  notForTitle: "Wann es nicht hilft",
  notForLead:
    "Offen gesagt, denn es später zu erfahren ist schlimmer, als es jetzt zu lesen.",
  notFor: [
    {
      h: "Sie wollen es sofort.",
      p: "Das ist die einzige Seite dieser Website, die etwas beschreibt, das man noch nicht herunterladen kann. Das Diktat ist fertig und intern im täglichen Gebrauch, und es kommt mit der nächsten Version — die heute veröffentlichte hat es nicht.",
    },
    {
      h: "Sie sind nicht auf einem Mac.",
      p: "macOS kommt zuerst, weil dort gebaut und geprüft wurde. Windows und Linux folgen: die Erkennung ist schon plattformübergreifend, Arbeit je Plattform brauchen der Kurzbefehl und das Tippen des Textes.",
    },
    {
      h: "Sie brauchen Schreiben im Sprechen.",
      p: "Der Text kommt, wenn Sie fertig sind, nicht Wort für Wort während des Sprechens. Das ist ein bewusster Tausch: einen ganzen Satz zu erkennen ist genauer, und bei diesen Geschwindigkeiten brächte der laufende Modus nichts.",
    },
    {
      h: "Sie brauchen Sprecher-Unterscheidung.",
      p: "Es schreibt, was gesagt wurde, nicht wer es gesagt hat. Für ein Interview mit zwei Stimmen brauchen Sie ein Transkriptionswerkzeug, das dafür gebaut ist, nicht einen Diktat-Kurzbefehl.",
    },
  ],

  faqTitle: "Fragen",
  faq: [
    {
      q: "Wird meine Stimme irgendwohin geschickt?",
      a: "Nein. Den Ton erkennt eine Modelldatei auf Ihrer eigenen Platte, und er wird mit dem temporären Ordner gelöscht, in dem er lag. Das Einzige, was jemals das Netz überquert, ist der einmalige Modell-Download; danach läuft das Diktat mit vollständig abgeschaltetem Netz.",
    },
    {
      q: "Wie schnell ist es?",
      a: "780 Millisekunden vom Loslassen der Taste bis zum Erscheinen des Textes, gemessen an einem echten Fünf-Sekunden-Satz mit dem Standardmodell auf einem M5-Laptop. Ein Satz von fünfzehn Sekunden brauchte 0,66–0,75 Sekunden. Das schwere large-v3-turbo braucht etwa das Doppelte.",
    },
    {
      q: "Funktioniert es in jeder Anwendung?",
      a: "Ja: der Kurzbefehl wird systemweit registriert, er greift also in einem Terminal, einem Browser, einem Messenger oder einem Editor — mit MediaChef im Hintergrund oder sogar mit geschlossenem Fenster.",
    },
    {
      q: "Welche Kombination benutzt es?",
      a: "⌥ Space als Standard, mit ⌃⌥ Space und ⌃⌥ D als Alternativen. Bewusst nicht Cmd plus Buchstabe: ein systemweiter Kurzbefehl wird abgefangen, bevor irgendeine Anwendung ihn sieht — sich ⌘D zu nehmen würde also „duplizieren“ in jedem Ihrer Programme zerstören.",
    },
    {
      q: "Warum braucht es die Bedienungshilfen-Freigabe?",
      a: "Nur um den Text in das Fenster einer anderen Anwendung zu tippen, was macOS als synthetische Eingabe zählt. Wenn Sie sie nicht erteilen möchten, stellen Sie die Auslieferung auf die Zwischenablage: die braucht nichts außer dem Mikrofon, und Sie fügen mit ⌘V selbst ein.",
    },
    {
      q: "Und wenn ich sie nicht erteile?",
      a: "Der Text geht in die Zwischenablage, und eine Mitteilung sagt, warum — mit dem richtigen Bereich der Systemeinstellungen schon geöffnet. Nichts Diktiertes geht jemals an einer fehlenden Freigabe verloren.",
    },
    {
      q: "Wie viel Platte braucht es?",
      a: "Die App plus ein Sprachmodell: 488 MB beim voreingestellten, 78 MB beim kleinsten, 1,62 GB beim größten. Wenn Sie MediaChef schon zum Transkribieren von Dateien nutzen, liegt das Modell bereits da und das Diktat fügt nichts hinzu.",
    },
    {
      q: "Versteht es Deutsch, oder zwei Sprachen gleichzeitig?",
      a: "Whisper beherrscht 99 Sprachen, und Sie können Ihre nennen oder sie erkennen lassen. Sprachen in einem Satz zu mischen ist genau der Fall, in dem das schwere Modell seine Größe rechtfertigt und in dem das Wörterbuch am meisten hilft.",
    },
    {
      q: "Wie lang darf ein Diktat sein?",
      a: "Fünf Minuten, danach hält es von selbst an und transkribiert das Gehörte, statt es wegzuwerfen. In der Praxis diktiert man in Sätzen, nicht in Monologen.",
    },
    {
      q: "Kann ich mitten im Satz abbrechen?",
      a: "Escape während der Aufnahme wirft die Aufnahme weg und liefert nichts. Es wird nur für die Dauer des Diktats registriert, stört Escape also an keiner anderen Stelle.",
    },
    {
      q: "Ersetzt es das in macOS eingebaute Diktat?",
      a: "Es macht dieselbe Arbeit mit zwei Unterschieden, die zählen: diesem lässt sich Ihr Vokabular beibringen, und der Ton bleibt auf Ihrem Rechner. Ist Ihnen beides gleichgültig, ist das eingebaute schon da und ebenfalls kostenlos.",
    },
    {
      q: "Wirklich kostenlos?",
      a: `Ja. MediaChef ist quelloffen unter GPL-3.0, ohne Bezahlversion und ohne Abo — das Diktat eingeschlossen. Veröffentlicht ist Version ${FACTS.version}; das Diktat kommt mit der nächsten.`,
    },
  ],

  ctaTitle: "MediaChef heute",
  ctaSub: `Version ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux. Das Diktat kommt mit der nächsten Version.`,
  also: [
    { page: "transcribe", label: "Audio in Text — dieselbe Maschine, für Dateien" },
    { page: "srt", label: "Video in SRT-Untertitel — gemessen und offline" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte nach Kategorie` },
  ],
} as const;
