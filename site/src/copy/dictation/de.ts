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
    "Drücken Sie die rechte ⌥-Taste irgendwo auf dem Mac, sagen Sie einen Satz, drücken Sie noch einmal — und der Text wird direkt in das Feld getippt, in dem der Cursor steht: ein Terminal, ein Chat, ein Browserformular. Erkannt wird von demselben Whisper, den MediaChef schon mitbringt, also verlässt der Ton Ihre Festplatte nicht und niemand zählt Minuten. In unserer Messung kam ein Satz von fünf Sekunden nach 780 Millisekunden zurück.",

  facts: [
    { k: "Stand", v: "Seit Version 0.8.0 veröffentlicht, vorerst nur macOS" },
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
      p: "Im Diktat-Tab gibt es einen Schalter und einen Auslöser zur Wahl: die rechte ⌥-Taste, die rechte ⌘-Taste oder eine von zwei Kombinationen. Bis Sie einschalten, registriert MediaChef überhaupt keinen systemweiten Kurzbefehl: eine Anwendung, die sich still eine Systemkombination nimmt, ist eine Anwendung, die andere kaputt macht.",
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
  shotCaption: "Der Diktat-Tab in MediaChef: Auslöser, Modelle, Sprache, Wörterbuch und Stand der Berechtigung — alles an einem Ort.",

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
      h: "Sie sind nicht auf einem Mac.",
      p: "macOS kommt zuerst, weil dort gebaut und geprüft wurde. Windows und Linux folgen: die Erkennung ist schon plattformübergreifend, Arbeit je Plattform brauchen der Kurzbefehl und das Tippen des Textes.",
    },
    {
      h: "Sie brauchen Schreiben im Sprechen.",
      p: "Der Text landet im Feld, wenn Sie fertig sind, nicht Wort für Wort beim Sprechen: so wird ein Satz als Ganzes und genauer erkannt. Während Sie sprechen, ist ein Entwurf der Erkennung im Panel unter der Notch sichtbar — getippt wird aber ein einziges sauberes Ergebnis, kein Strom von Korrekturen.",
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
      a: "Standard ist die rechte ⌥-Taste — ein einzelner Modifier: halten und sprechen, oder einmal tippen zum Starten und noch einmal zum Beenden; mit Shift wird der Text per Enter abgeschickt. Ein Modifier allein tippt nichts und kollidiert mit nichts. Kombinationen wie ⌥ Space tippten im Haltemodus ein Leerzeichen, wenn ⌥ zuerst losgelassen wurde — deshalb sind sie raus; ⌃⌥ Space und ⌃⌥ D bleiben als Ausweichmöglichkeiten.",
    },
    {
      q: "Warum braucht es die Bedienungshilfen-Freigabe?",
      a: "Für zwei Dinge. Die Auslösetaste zu hören: ein einzelner Modifier lässt sich nicht als gewöhnlicher Kurzbefehl registrieren, MediaChef hört die Tastatur also selbst ab, und das erlaubt macOS nur mit Bedienungshilfen. Und Text in das Fenster einer anderen Anwendung zu tippen, was das System als synthetische Eingabe behandelt. Eine Berechtigung deckt beides ab und wird einmal erteilt; danach die App neu starten.",
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
      a: `Ja. MediaChef ist quelloffen unter GPL-3.0, ohne Bezahlversion und ohne Abo — das Diktat eingeschlossen. Veröffentlicht ist Version ${FACTS.version}, das Diktat ist enthalten.`,
    },
    {
      q: "Warum zeigt das Panel einen anderen Text als den, der getippt wird?",
      a: "Das sind zwei getrennte Durchläufe. Während Sie sprechen, zeigt das Panel einen Entwurf, den ein leichtes Modell alle anderthalb Sekunden erzeugt, damit es der Sprache folgen kann. Getippt wird das Endergebnis Ihres Hauptmodells über die ganze Aufnahme, mit Ihrem Fachwörterbuch. Beide Modelle wählt man im Diktat-Tab: setzen Sie für die Vorschau dasselbe Modell wie für das Hauptmodell, und der Unterschied verschwindet — um den Preis, dass das Panel hinterherhängt.",
    },
    {
      q: "Warum fragt es nach einem Update erneut nach Berechtigungen?",
      a: "macOS bindet die Berechtigung an die Signatur der App, nicht an ihren Namen. MediaChef hat kein Apple-Zertifikat — wir werden keines bezahlen —, also ist jede Version anders signiert, und das System behandelt die aktualisierte App als eine neue. Die App entfernt den veralteten Eintrag selbst und fragt erneut: ein Schalter und ein „Erlauben“ pro Update.",
    },
    {
      q: "Der Schalter in den Systemeinstellungen ist an, das Diktat funktioniert aber nicht.",
      a: "Dann gehört dieser Eintrag zur vorigen Kopie der App — genau das passiert nach einem Update. Aus- und wieder einschalten bindet ihn nicht neu, das haben wir ausprobiert. MediaChef löscht diesen Eintrag von sich aus und löst die Systemabfrage aus: in der Liste einschalten und die App neu starten.",
    },
    {
      q: "Die Aufnahme ist leer, obwohl das Mikrofon funktioniert.",
      a: "Meist liegt es am Headset: AirPods im Case bleiben verbunden und bleiben der Standardeingang, und macOS liefert von ihnen glatte Nullen — an jede App, nicht nur an unsere. Die Benachrichtigung nennt das Gerät, von dem die Stille kam. Setzen Sie das Headset auf oder wählen Sie das Mikrofon ausdrücklich im Diktat-Tab.",
    },
    {
      q: "Kann ich ein bestimmtes Mikrofon wählen?",
      a: "Ja, der Diktat-Tab listet die Eingabegeräte. „Wie das System“ heißt: das zuletzt verbundene Headset, nicht das Laptop-Mikrofon — und genau darum ist die ausdrückliche Wahl verlässlicher.",
    },
    {
      q: "Was passiert, wenn ich den Auslöser drücke und nichts sage?",
      a: "Es wird nichts getippt. Eine leere Aufnahme erreicht die Erkennung nicht einmal: Whisper schweigt bei Stille nicht, es erfindet — das russische Modell tippte Untertitel-Credits. Solche Untertitler-Signaturen werden erkannt und als Stille behandelt, und Sie bekommen „keine Sprache gehört“.",
    },
    {
      q: "Warum ist der erste Druck nach dem Start langsamer?",
      a: "Das Audiosystem von macOS wacht auf: bis zu zwei Sekunden beim ersten Öffnen des Mikrofons pro Start. Das Panel erscheint sofort, noch bevor die Aufnahme läuft — halten Sie die Taste also, bis es sagt, dass es zuhört. Danach dauert das Öffnen zig Millisekunden.",
    },
    {
      q: "Wie schicke ich eine Nachricht per Stimme, ohne Enter zu drücken?",
      a: "Drücken Sie den Auslöser zusammen mit Shift: der Text wird getippt, und Enter folgt von selbst. Ein leeres Diktat drückt niemals Enter — sonst würde Schweigen eine leere Nachricht senden oder im Terminal den vorigen Befehl ausführen.",
    },
    {
      q: "Was passiert, wenn ich bei gehaltenem Auslöser eine andere Taste drücke?",
      a: "Die Aufnahme wird abgebrochen und nichts getippt. Die rechte ⌥ plus ein Buchstabe ist der Kurzbefehl einer anderen Anwendung, kein Diktat, und die App behandelt ihn genau so.",
    },
    {
      q: "Wird das Diktierte auf die Festplatte geschrieben?",
      a: "Nein. Die Aufnahme liegt in einem temporären Ordner und wird mit ihm gelöscht, und eine Historie der Abschriften ist standardmäßig aus. Die App verspricht, dass Ihre Inhalte das Gerät nicht verlassen; alles Diktierte im Klartext darauf zu schreiben würde dazu schlecht passen — diktiert werden Passwörter und Ausschnitte privater Gespräche.",
    },
    {
      q: "Funktioniert es über Vollbild-Anwendungen?",
      a: "Ja. Das Panel wird über Vollbildfenstern und auf allen Schreibtischen gezeichnet — Vollbild-Editoren und -Terminals sind genau dort, wo diktiert wird.",
    },
    {
      q: "Eine andere App belegt den Auslöser schon. Was nun?",
      a: "Der Diktat-Tab bietet auch die rechte ⌘ — der andere einzelne Modifier, dem macOS keine eigene Aktion zuweist — sowie zwei gewöhnliche Kombinationen, ⌃⌥ Leertaste und ⌃⌥ D, falls beide Modifier bereits vergeben sind.",
    },
  ],

  ctaTitle: "MediaChef heute",
  ctaSub: `Version ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux. Das Diktat ist drin.`,
  also: [
    { page: "transcribe", label: "Audio in Text — dieselbe Maschine, für Dateien" },
    { page: "srt", label: "Video in SRT-Untertitel — gemessen und offline" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte nach Kategorie` },
  ],
} as const;
