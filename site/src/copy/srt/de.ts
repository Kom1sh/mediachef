// Гайд «видео в субтитры», немецкий. Реальные запросы: «untertitel erstellen
// kostenlos», «video in srt», «automatisch untertitel generieren».
import { FACTS } from "../../facts";

export default {
  title: "SRT-Untertitel aus einem Video — kostenlos, offline, auf dem eigenen Rechner",
  description:
    "Wie Sie aus einem Video zeitgenaue SRT-Untertitel bekommen, ohne es irgendwohin hochzuladen. Mit echten Messungen: die vier Whisper-Modelle nebeneinander gestoppt, wie lang die Untertitelzeilen ausfallen und was in den vier Ausgabeformaten wirklich steckt.",
  h1: "SRT-Untertitel aus einem Video erzeugen",
  crumb: "Video zu SRT",

  answer:
    "Ziehen Sie das Video in MediaChef, wählen Sie „SRT-Untertitel für ein Video erstellen“, lassen Sie das Modell auf small und die Sprache auf automatisch, und starten Sie. Neben dem Video erscheint eine .srt-Datei, Zeitmarken inklusive. Alles wird auf Ihrem Rechner berechnet: die Sprache verlässt die Festplatte nicht, und sobald das Modell heruntergeladen ist, läuft das Rezept mit abgeschaltetem Netz. Auf einem M5-Laptop brauchten 2 Minuten 43 Sekunden Sprache mit dem Standardmodell 6,2 Sekunden — rund 26-mal schneller als Echtzeit — und ergaben 73 Untertitel mit im Schnitt 39 Zeichen, kurz genug zum bequemen Lesen.",

  facts: [
    { k: "Was Sie brauchen", v: `MediaChef ${FACTS.version} plus einen einmaligen Modell-Download` },
    { k: "Standardmodell", v: "small — 488 MB, einmal geladen und dann behalten" },
    { k: "Tempo", v: "≈26× Echtzeit mit dem Standardmodell (gemessen, M5)" },
    { k: "Läuft offline", v: "Ja, sobald das Modell auf der Platte liegt" },
    { k: "Formate", v: "SRT, VTT, einfaches TXT und JSON — je ein Rezept" },
    { k: "Was herauskommt", v: "clip.subs.srt neben dem Video, das Original bleibt" },
  ],

  toc: [
    { id: "how", label: "So geht es" },
    { id: "models", label: "Welches Modell nehmen" },
    { id: "cues", label: "Wie lang die Zeilen ausfallen" },
    { id: "formats", label: "SRT, VTT, TXT oder JSON" },
    { id: "recipes", label: "Welches Rezept wofür" },
    { id: "why", label: "Warum lokal" },
    { id: "notfor", label: "Wann das falsche Werkzeug" },
    { id: "faq", label: "Fragen" },
  ],

  stepsTitle: "So erstellen Sie Untertitel für ein Video",
  steps: [
    {
      h: "MediaChef herunterladen",
      p: "Eine Datei für macOS, Windows oder Linux. FFmpeg und der Whisper-Läufer reisen beide im Download mit: nichts separat installieren, nichts in den PATH eintragen.",
    },
    {
      h: "Einmalig ein Modell laden",
      p: "Die erste Transkription verlangt ein Sprachmodell. Standard ist small mit 488 MB, mit ihm sind auch alle Messungen unten gemacht; tiny wiegt 78 MB, base 148 MB, large-v3-turbo 1,62 GB. Es wird einmal geholt, bleibt auf der Platte, und danach fasst das Rezept das Netz nicht mehr an.",
    },
    {
      h: "Video hineinziehen und Rezept wählen",
      p: "„SRT-Untertitel für ein Video erstellen“ nimmt das Video direkt — Sie müssen den Ton nicht vorher herauslösen. MediaChef dekodiert die Spur in das 16-kHz-Mono, das Whisper verlangt, in einem temporären Ordner, den Sie nie zu sehen bekommen.",
    },
    {
      h: "Starten und die .srt öffnen",
      p: "Die Datei landet neben dem Video als clip.subs.srt, mit nummerierten Untertiteln und Zeitmarken. Player, Schnittprogramme und Videoplattformen lesen sie direkt, und da es reiner Text ist, lässt sich ein Name oder ein Fachwort in jedem Editor korrigieren.",
    },
  ],
  shotAlt:
    "MediaChef bereit zum Konvertieren: die Arbeitsfläche wartet auf eine Videodatei, rechts die Warteschlange.",
  shotCaption: "Die Arbeitsfläche, auf der das Video landet. Die Rezepte erscheinen, sobald MediaChef die Datei gelesen hat.",

  tables: [
    {
      id: "models",
      title: "Welches Modell nehmen",
      lead:
        "Vier Modelle, dieselben 2 Minuten 43 Sekunden Sprache, dieselbe Maschine: ein M5-Laptop mit 16 GB, jedes Modell vorher warmgelaufen, gewertet der bessere von zwei Durchläufen.",
      head: ["Modell", "Download", "Zeit", "Gegen Echtzeit", "Wörter daneben"],
      rows: [
        ["tiny", "78 MB", "2,1 s", "×78", "5 von 540"],
        ["base", "148 MB", "2,6 s", "×63", "3 von 540"],
        ["small — der Standard", "488 MB", "6,2 s", "×26", "0 von 540"],
        ["large-v3-turbo", "1,62 GB", "11,5 s", "×14", "1 von 540"],
      ],
      note:
        "Lesen Sie die letzte Spalte mit Vorbehalt, denn das Testmaterial ist eine synthetische Stimme, die einen vorbereiteten Text vorliest: kein Akzent, kein Hintergrundlärm, niemand, der dazwischenredet. Deshalb ist hier selbst das kleinste Modell fast fehlerfrei, und so klingt eben keine echte Besprechungsaufnahme — bei schwierigem Ton geht die Schere zwischen diesen Modellen deutlich auf. Die Zeitspalte dagegen überträgt sich unmittelbar auf Ihren Fall. Und noch etwas, das der nackte Vergleich verdeckte: fast alle Abweichungen waren Zahlen in Ziffern statt in Worten — large-v3-turbo schrieb „70“, „10“, „50“, „30“, wo der Text sie ausgeschrieben hatte. Das ist Formatierung, kein Verhören.",
    },
    {
      id: "cues",
      title: "Wie lang die Untertitelzeilen ausfallen",
      lead:
        "Ein technisch richtiger Untertitel ist trotzdem unbrauchbar, wenn er zwanzig Wörter auf einmal auf den Schirm wirft. Die Modelle zerteilen dieselbe Rede sehr unterschiedlich — gemessen im selben Durchlauf wie oben.",
      head: ["Modell", "Untertitel", "Mittlere Dauer", "Zeichen im Schnitt", "Der längste"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 Zeichen"],
        ["base", "35", "4,7 s", "83", "100 Zeichen"],
        ["small — der Standard", "73", "2,2 s", "39", "58 Zeichen"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 Zeichen"],
      ],
      note:
        "Die verbreitete Rundfunkregel liegt bei etwa 42 Zeichen pro Zeile auf zwei Zeilen, also rund 84 Zeichen gleichzeitig auf dem Bild. Nach diesem Maß passt von den vieren nur small bequem hinein: 39 Zeichen im Schnitt und 58 im längsten Untertitel, während large-v3-turbo schon bei einem gewöhnlichen darüber hinausschießt. Das Standardmodell ist also nicht nur die ausgewogene Wahl bei der Genauigkeit — es zerteilt die Rede auch in die lesbarsten Stücke.",
    },
    {
      id: "formats",
      title: "SRT, VTT, reiner Text oder JSON",
      lead:
        "Dieselbe Transkription auf vier Arten geschrieben. Die Größen stammen aus denselben 2 Minuten 43 Sekunden Sprache und lassen sich daher direkt vergleichen.",
      head: ["Format", "Größe", "Was drinsteht", "Wann nehmen"],
      rows: [
        ["SRT", "5,5 KB", "Nummerierte Untertitel, Zeit mit Komma: 00:00:00,000", "Fast immer. Player, Schnittprogramme und Plattformen nehmen es"],
        ["VTT", "5,3 KB", "WEBVTT-Kopfzeile, Zeit mit Punkt: 00:00:00.000", "Untertitel für einen Webplayer, die Spur im Browser"],
        ["TXT", "3,0 KB", "Fortlaufender Text, überhaupt keine Zeitmarken", "Sie wollen die Wörter, nicht die Untertitel"],
        ["JSON", "15,2 KB", "Jeder Untertitel plus Modell und verwendete Parameter", "Das liest ein Programm, kein Mensch"],
      ],
      note:
        "SRT und VTT unterscheiden sich vor allem im Zeichen zwischen Sekunden und Millisekunden. Weist ein Player also eines zurück, ist das andere ein Rezeptwechsel und keine neue Transkription. Das JSON wiegt etwa dreimal so viel wie das SRT, weil es die Laufdaten neben dem Text mitführt.",
    },
    {
      id: "recipes",
      title: "Welches Rezept wofür",
      lead:
        `Untertitel sind nicht ein Rezept, sondern mehrere, und das richtige zu wählen spart einen Schritt. Alle stehen im Katalog mit ${FACTS.recipeCount} Rezepten.`,
      head: ["Was Sie haben", "Was Sie wollen", "Rezept"],
      rows: [
        ["Ein Video", "Untertitel daneben", "SRT-Untertitel für ein Video erstellen"],
        ["Eine Audiodatei", "Untertitel", "Audio in SRT-Untertitel transkribieren"],
        ["Sprache in einer anderen Sprache", "Englische Untertitel in einem Durchgang", "Sprache in englische Untertitel übersetzen"],
        ["Irgendetwas mit Sprache", "Nur den Text", "Audio in Text transkribieren"],
        ["Irgendetwas mit Sprache", "Eine Spur für den Webplayer", "Audio in WebVTT transkribieren"],
      ],
      note:
        "Das Übersetzungsrezept geht von fremdsprachiger Rede direkt zu zeitgenauen englischen Untertiteln, in einem einzigen Durchgang — kein erst transkribieren, dann übersetzen. Es geht allerdings nur ins Englische; das ist eine Grenze des Modells, nicht der Anwendung.",
    },
  ],

  whyTitle: "Warum Untertitel auf dem eigenen Rechner",
  whyBullets: [
    {
      h: "Die Sprache verlässt Ihre Platte nicht.",
      p: "Aufnahmen von Besprechungen, Interviews und Telefonaten sind die heikelste Art Datei, mit der die meisten überhaupt zu tun haben, und eine Online-Transkription ist per Definition eine Kopie dieses Gesprächs auf fremdem Server. Hier gibt es keinen Upload, über den man nachdenken müsste.",
    },
    {
      h: "Keine Abrechnung pro Minute.",
      p: "Transkriptionsdienste rechnen je Audiominute ab, und das macht aus einem langen Archiv eine echte Rechnung. Der Modell-Download fällt einmal an, danach kostet eine zweistündige Aufnahme so viel wie eine zweiminütige: nichts.",
    },
    {
      h: "Läuft mit abgeschaltetem Netz.",
      p: "Sobald die Modelldatei auf der Platte liegt, fasst dieses Rezept das Internet nicht mehr an. Es läuft im Flugzeug, auf einem abgeriegelten Rechner und in einem Raum, in dem das WLAN das Unzuverlässigste ist.",
    },
    {
      h: "Keine Längenbegrenzung.",
      p: "Kostenlose Web-Transkriptionen deckeln meist bei ein paar Minuten je Datei — genau dann, wenn sich eine Aufnahme lohnt, weil sie lang ist. Hier gibt es keine Obergrenze.",
    },
    {
      h: "Ein ganzer Ordner auf einmal.",
      p: "Ziehen Sie ein Verzeichnis mit Aufnahmen hinein: die Warteschlange arbeitet sie nacheinander ab und sagt Ihnen, wohin jede Untertiteldatei geschrieben wurde.",
    },
  ],

  notForTitle: "Wann das hier das falsche Werkzeug ist",
  notForLead:
    "Das Rezept schreibt eine Untertiteldatei. Das ist enger als „Untertitel ins Video bringen“, und der Unterschied zählt in diesen Fällen.",
  notFor: [
    {
      h: "Sie wollen die Untertitel fest im Bild.",
      p: "Hier entsteht eine getrennte .srt, die der Player neben dem Video lädt. Den Text dauerhaft in die Bilder zu brennen ist eine andere Operation: sie kodiert das Video neu, und danach lassen sich die Wörter weder abschalten noch korrigieren.",
    },
    {
      h: "Sie brauchen sendefähige Genauigkeit.",
      p: "Selbst auf dem sauberen Ton der Messungen oben stolperten die Modelle über ein paar Wörter, und echte Aufnahmen sind schwieriger. Was unter einer gesetzlichen Barrierefreiheitspflicht veröffentlicht wird, liest vor der Ausstrahlung ein Mensch gegen — egal, was den Entwurf erzeugt hat.",
    },
    {
      h: "Der Ton ist wirklich schlecht.",
      p: "Kräftiges Durcheinanderreden, ein per Handy aufgenommener Raum oder Musik lauter als die Stimme legen alle vier Modelle. Erst den Ton zu reparieren — und sei es nur, eine sauberere Spur herauszulösen — bringt mehr als eine Modellgröße höher zu gehen.",
    },
    {
      h: "Sie brauchen eine Übersetzung in etwas anderes als Englisch.",
      p: "Whisper übersetzt ins Englische und nur dorthin. Für jede andere Zielsprache transkribieren Sie zuerst in der Originalsprache und übersetzen den entstandenen Text mit einem dafür gebauten Werkzeug.",
    },
  ],

  faqTitle: "Fragen",
  faq: [
    {
      q: "Ist das kostenlos?",
      a: `Ja, vollständig. MediaChef ist quelloffen unter GPL-3.0: keine Bezahlversion, keine Abrechnung pro Minute, keine Längenbegrenzung. Auch die Modelle sind kostenlose Downloads. Aktuell ist Version ${FACTS.version}.`,
    },
    {
      q: "Wird mein Video irgendwohin hochgeladen?",
      a: "Nein. Die Sprache verarbeitet eine Modelldatei auf Ihrer eigenen Platte. Das Einzige, was jemals das Netz überquert, ist der einmalige Modell-Download; danach läuft das Rezept auch mit abgeschaltetem Internet.",
    },
    {
      q: "Wie lange dauert das?",
      a: "Rund 26-mal schneller als Echtzeit mit dem Standardmodell: wir haben 6,2 Sekunden für 2 Minuten 43 Sekunden Sprache auf einem M5-Laptop gemessen. In diesem Verhältnis ist eine einstündige Aufnahme in ein paar Minuten durch. Auf demselben Ton lief tiny mit ×78 und large-v3-turbo mit ×14.",
    },
    {
      q: "Welches Modell soll ich wählen?",
      a: "Fangen Sie mit small an, dem Standard. In unseren Messungen traf es jedes Wort des Testmaterials und lieferte die lesbarsten Untertitel — 39 Zeichen im Schnitt gegen 97 bei large-v3-turbo. Gehen Sie nur höher, wenn Ihr Ton schwierig ist; gehen Sie auf tiny oder base herunter, wenn Sie in zwei Sekunden einen Rohentwurf wollen.",
    },
    {
      q: "Wie groß ist der Modell-Download?",
      a: "78 MB bei tiny, 148 MB bei base, 488 MB bei small und 1,62 GB bei large-v3-turbo. Der Download fällt einmal an. Danach liegt die Datei auf der Platte und jeder spätere Lauf benutzt sie kommentarlos.",
    },
    {
      q: "Muss ich die gesprochene Sprache angeben?",
      a: "Nein. Die Sprache steht auf automatisch, und das Modell erkennt sie am Ton. Sie können sie trotzdem ausdrücklich nennen, und das lohnt sich, wenn eine Aufnahme mit ein paar Sätzen in einer anderen Sprache beginnt.",
    },
    {
      q: "Kann es die Untertitel ins Englische übersetzen?",
      a: "Ja, mit dem Rezept „Sprache in englische Untertitel übersetzen“: fremdsprachige Rede hinein, zeitgenaues englisches SRT heraus, in einem Durchgang statt erst transkribieren und dann übersetzen. Englisch ist die einzige Zielsprache, die das Modell beherrscht.",
    },
    {
      q: "Was ist der Unterschied zwischen SRT und VTT?",
      a: "Vor allem die Zeichensetzung in den Zeitmarken: SRT schreibt 00:00:00,000 mit Komma und nummeriert seine Untertitel, VTT schreibt 00:00:00.000 mit Punkt und beginnt mit einer WEBVTT-Zeile. SRT erwarten Player und Schnittprogramme; VTT will ein Webplayer für seine eigene Untertitelspur. Es sind getrennte Rezepte, ein Formatwechsel ist also ein neuer Lauf und kein Umschreiben der Datei.",
    },
    {
      q: "Kann ich die Untertitel danach bearbeiten?",
      a: "Ja — eine .srt ist reiner Text. Öffnen Sie sie in einem beliebigen Editor, um einen Eigennamen, einen Fachbegriff oder eine Zeitmarke zu korrigieren. Das ist die normale Arbeitsweise: das Modell macht die neunzig und ein paar Prozent, den Rest holen Sie von Hand nach.",
    },
    {
      q: "Warum sind manche meiner Untertitel zu lang?",
      a: "Weil das Modell entscheidet, wo es umbricht, und die größeren Modelle brechen seltener um. Wir haben 39 Zeichen pro Untertitel bei small gegen 97 bei large-v3-turbo gemessen, auf demselben Ton. Wenn Ihre Zeilen ausufern, hilft meist der Wechsel zurück auf small — und auf sauberer Sprache kostet das nichts an Genauigkeit.",
    },
    {
      q: "Erkennt es verschiedene Sprecher?",
      a: "Nein. Whisper schreibt, was gesagt wurde, nicht wer es gesagt hat. Wenn Sie Kennzeichnungen wie „Sprecher 1 / Sprecher 2“ brauchen, setzen Sie sie von Hand oder nehmen ein Werkzeug, das genau dafür gebaut ist.",
    },
    {
      q: "Was passiert, wenn in der Datei keine Sprache ist?",
      a: "Der Lauf hält an und sagt Ihnen, dass er nichts Verständliches gehört hat, statt stillschweigend eine leere Datei zu schreiben. Stille erzeugt keine Untertitel, und das ist Absicht.",
    },
    {
      q: "Läuft das unter Windows und Linux?",
      a: "Auf allen drei Plattformen. Die Spracherkennung läuft überall auf der CPU und auf Apple Silicon zusätzlich auf der GPU — daher die schnellen Zahlen oben. Dasselbe Rezept auf einem bescheidenen Windows-Laptop ist langsamer, aber immer noch schneller, als die Aufnahme anzuhören.",
    },
    {
      q: "Kann ich mehrere Dateien auf einmal untertiteln?",
      a: "Ja. Ziehen Sie einen ganzen Ordner hinein, fügen Sie das Rezept hinzu, und die Warteschlange arbeitet sie nacheinander ab. Jede Untertiteldatei wird neben ihrer eigenen Quelle geschrieben.",
    },
    {
      q: "Wird die Videodatei verändert?",
      a: "Nein. Daneben wird eine eigene .srt geschrieben — clip.subs.srt — und das Video wird weder verändert noch umbenannt noch neu kodiert. Dieses Rezept fasst das Bild überhaupt nicht an.",
    },
  ],

  ctaTitle: "Holen Sie sich die Untertitel zu diesem Video",
  ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio in Text — dieselbe Maschine, nur die Wörter" },
    { page: "trim", label: "Video schneiden — gemessen und verlustfrei" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte nach Kategorie` },
  ],
} as const;
