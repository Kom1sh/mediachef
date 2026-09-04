// Тексты локали «de». Структура зеркальна остальным локалям.
import { FACTS } from "../facts";

export const ui = {
  title: "MediaChef — Video- und Audio-Konverter offline mit Transkription",
  description:
    "Kostenlose Open-Source-App für macOS, Windows und Linux: Video und Audio auf dem eigenen Rechner umwandeln und Sprache mit Whisper in Text verwandeln. Ohne Upload, ohne Größenlimit, ohne Abo.",
  nav: { recipes: "Rezepte", transcribe: "Transkription", privacy: "Offline", faq: "Fragen" },
  skipToContent: "Zum Inhalt",
  heroTitle1: "Jede Datei in jedes Format.",
  heroTitle2: "Sprache in Text.",
  heroAccent: "Alles auf Ihrem Rechner.",
  heroSub:
    "MediaChef ist eine kostenlose App, die FFmpeg und Whisper in Rezeptkarten verwandelt: Video und Audio umwandeln, den Ton aus einem Clip ziehen, eine Aufnahme in Text überführen — offline, auf dem eigenen Rechner, ohne dass irgendetwas hochgeladen wird.",
  trust: [
    `Version ${FACTS.version}`,
    `${FACTS.recipeCount} fertige Rezepte`,
    `${FACTS.modelCount} Whisper-Modelle`,
    "macOS · Windows · Linux",
    "Open Source · GPL-3.0",
  ],
  ctaMac: "Für macOS laden",
  ctaWin: "Für Windows laden",
  ctaLinux: "Für Linux laden",
  ctaNote: "Kostenlos und quelloffen —",
  ctaNoteLink: "Code auf GitHub ansehen",
  howTitle: "So funktioniert es",
  steps: [
    { n: "1", h: "Datei ablegen", p: "Ziehen Sie ein Video oder eine Aufnahme hinein. MediaChef liest die Datei aus und zeigt nur die Rezepte, die zu ihrem Inhalt passen." },
    { n: "2", h: "Rezept wählen", p: "Jede Aktion ist eine schlichte Karte: „Audio als MP3 extrahieren“, „SRT-Untertitel für ein Video erstellen“, „Video komprimieren“. Die Vorgaben sitzen bereits, und die Vorschau zeigt den exakten FFmpeg-Befehl." },
    { n: "3", h: "Ergebnis abholen", p: "Die Datei landet neben dem Original — oder in einem Ordner Ihrer Wahl. Die Warteschlange zeigt Fortschritt, Restzeit und den Pfad des Ergebnisses." },
  ],
  shotAlt:
    "Hauptfenster von MediaChef: Seitenleiste mit Konvertierung, Modellen und Einstellungen, eine Ablagefläche für Dateien und die Aufgabenliste rechts.",
  shotCaption:
    "Das echte Fenster, im selben Farbschema, in dem Sie gerade lesen. Die Ablagefläche in der Mitte, die Warteschlange rechts, die Engines bereits eingebaut.",
  outTitle: "Was die App sofort kann",
  outLead:
    "Siebzehn Rezepte sind eingebaut. Jedes ist eine echte FFmpeg- oder Whisper-Aufgabe mit bereits gesetzten Parametern, und jedes schreibt sein Ergebnis neben Ihre Datei als {Name}.{was}.{Endung}.",
  outHead: ["Richtung", "Rezept in der App", "Was dabei herauskommt"],
  outRows: [
    ["Video → Audio", "Audio als MP3 extrahieren", "<code>clip.audio.mp3</code> mit 128, 192 oder 320 kbps"],
    ["Video → Untertitel", "SRT-Untertitel erstellen", "<code>clip.subs.srt</code> mit Zeitmarken"],
    ["Audio → Text", "Audio in Text transkribieren", "<code>talk.transcript.txt</code>, reiner Text"],
    ["Beliebige Sprache → Englisch", "Sprache in englischen Text übersetzen", "<code>talk.english.txt</code> in einem Durchgang"],
    ["MP4 → MKV", "MP4 in MKV umwandeln", "Neu verpackt, nicht neu kodiert — Sekunden, ohne Qualitätsverlust"],
    ["Video → kleiner", "Video komprimieren (Qualitätsvorgabe)", "H.264 mit CRF 23, 28 oder 33"],
    ["Video → GIF", "Video zu GIF", "10–24 Bilder/s, Breite 320–640"],
    ["Alles andere", "Eigener FFmpeg-Befehl", "Ihre eigenen Argumente, mit Befehlsvorschau"],
  ],
  modelsTitle: "Whisper-Modelle",
  modelsLead:
    "Die Transkription läuft über whisper.cpp mit den Whisper-Modellen von OpenAI. Ein Modell wird einmal im Bildschirm „Modelle“ geladen; danach funktioniert alles mit abgeschaltetem Netz. Größeres Modell, besserer Text, längere Rechenzeit.",
  modelsHead: ["Modell", "Download", "Wofür"],
  modelSizes: {
    tiny: "78 MB",
    base: "148 MB",
    small: "488 MB",
    "large-v3-turbo": "1,62 GB",
  },
  modelNotes: {
    tiny: "Am schnellsten, grobe Qualität. Ein Entwurf klarer Sprache in einem Bruchteil der Zeit.",
    base: "Schnell, brauchbare Qualität. Reicht, um in einer Aufnahme die gesuchte Stelle zu finden.",
    small: "Die empfohlene Balance — die Vorgabe in allen Transkriptionsrezepten.",
    "large-v3-turbo": "Beste Qualität, auf Apple Silicon optimiert. Für Text, der veröffentlicht wird.",
  },
  defaultTag: "Standard",
  recipesTitle: "Rezepte statt Befehle",
  recipesLead:
    "FFmpeg kann fast alles — in der Sprache des Terminals. MediaChef übersetzt: Sie wählen, was passieren soll, die Parameter stehen schon. Die Vorschau zeigt den echten Befehl, ganz nebenbei lernt man ihn.",
  recipes: [
    { tile: "tile-ochre", h: "Audio als MP3 extrahieren", p: "Holen Sie die Tonspur aus jedem Video." },
    { tile: "tile-green", h: "SRT-Untertitel erstellen", p: "Whisper hört zu und schreibt eine SRT-Datei." },
    { tile: "tile-green", h: "Video komprimieren", p: "Bringen Sie einen Clip auf Messenger-taugliche Größe." },
    { tile: "tile-purple", h: "Video zu GIF", p: "Ein sauberes GIF in Schleife, 10 bis 24 Bilder/s." },
    { tile: "tile-green", h: "Audio in Text transkribieren", p: "Ein Meeting oder eine Sprachnachricht als reiner Text." },
    { tile: "tile-blue", h: "Sprache ins Englische übersetzen", p: "Whisper transkribiert und übersetzt in einem Durchgang." },
    { tile: "tile-blue", h: "MP4 in MKV umwandeln", p: "Neu verpacken ohne neu zu kodieren — sofort." },
    { tile: "tile-red", h: "Ton aus Video entfernen", p: "Alle Tonspuren löschen, das Bild behalten." },
  ],
  trTitle: "Audio in Text transkribieren, ohne den Rechner zu verlassen",
  trBullets: [
    { h: "Whisper läuft lokal.", p: "Das Sprachmodell von OpenAI läuft über whisper.cpp auf Ihrem eigenen Prozessor — Aufnahmen verlassen den Rechner nie." },
    { h: "Modelle werden in der App geladen.", p: "Von tiny mit 78 MB bis large-v3-turbo mit 1,62 GB — je nach Aufgabe im Bildschirm „Modelle“ wählen." },
    { h: "Text oder Untertitel.", p: "Reines TXT, SRT und VTT mit Zeitmarken oder JSON mit den Zeiten jedes Abschnitts für eigene Werkzeuge." },
    { h: "Ehrliches Ergebnis.", p: "Enthält eine Datei keine Sprache, sagt MediaChef „Keine Sprache erkannt“ — statt eine leere Datei mit grünem Haken abzuliefern." },
  ],
  recipesLink: "Ausführliche Anleitung: MP4 in MP3 umwandeln →",
  catalogLink: `Alle ${FACTS.recipeCount} Rezepte, nach Kategorien →`,
  trLink: "Ausführliche Anleitung: Audio in Text transkribieren →",
  privTitle: "Ihre Dateien gehen nirgendwohin",
  privLead:
    "Ein Online-Konverter verlangt, die Datei auf einen fremden Server zu laden, in einer Warteschlange zu warten und der Aufbewahrungsrichtlinie zu vertrauen. MediaChef arbeitet auf Ihrem Prozessor: ein Gigabyte Bildschirmaufnahme und das private Audio eines Meetings werden gleich behandelt — bei abgeschaltetem WLAN.",
  privChips: ["Kein Upload", "Kein Größenlimit", "Kein Abo"],
  ossTitle: "Open Source, Engines inklusive",
  ossLead:
    "GPL-3.0, die gesamte Entwicklungsgeschichte ist öffentlich auf GitHub. Seit 0.4.0 bringt jeder Download seine eigenen Engines mit — nichts im PATH zu installieren, nichts zu konfigurieren.",
  engineRows: [
    { k: `FFmpeg ${FACTS.ffmpeg}`, v: "Konvertierung · GPL v3" },
    { k: `whisper.cpp ${FACTS.whisper}`, v: "Spracherkennung · MIT" },
    { k: "macOS · Windows · Linux", v: "dmg ~66 MB · Installer ~82 MB · AppImage ~181 MB · deb ~118 MB" },
  ],
  ossNotice: "Genaue Versionen und Lizenzen aller eingebauten Teile — NOTICE.md",
  faqTitle: "Häufige Fragen",
  faq: [
    { q: "Ist es wirklich kostenlos?", a: "Ja. MediaChef ist Open Source unter GPL-3.0 — kein Konto, keine Testphase, kein Wasserzeichen. Konverter und Transkription sind die gesamte App, und der Code liegt öffentlich auf GitHub." },
    { q: "Welche Formate werden unterstützt?", a: "Alles, was FFmpeg liest: MP4, MKV, MOV, WebM, AVI, TS, MP3, WAV, FLAC, M4A, OGG und Dutzende mehr. MediaChef prüft die Datei mit ffprobe, statt der Endung zu glauben — die angezeigten Rezepte sind also die, die tatsächlich passen." },
    { q: "Wohin werden meine Dateien hochgeladen?", a: "Nirgendwohin. Konvertierung und Transkription laufen vollständig auf Ihrem Rechner. Das Einzige, was MediaChef je herunterlädt, ist ein Whisper-Modell — einmalig, im Bildschirm „Modelle“." },
    { q: "Wie genau ist die Transkription?", a: "Sie nutzt die Whisper-Modelle von OpenAI über whisper.cpp v1.7.6. Die Genauigkeit hängt am gewählten Modell: tiny ist sofort fertig und grob, small ist die ausgewogene Vorgabe, large-v3-turbo kommt bei klarer Sprache nah an menschliches Niveau. Die Sprache wird automatisch erkannt." },
    { q: "Funktioniert es offline?", a: "Ja. FFmpeg und Whisper stecken im Download, die Konvertierung funktioniert also ab dem ersten Start offline, die Transkription, sobald Sie einmal ein Modell geladen haben." },
    { q: "Warum nicht einfach einen Online-Konverter?", a: "Für eine kleine, öffentliche Datei ist ein Online-Konverter in Ordnung. Private Aufnahmen, Videos mit mehreren Gigabyte, Stapel und alles unter Verschwiegenheitspflicht macht man besser lokal: keine Wartezeit fürs Hochladen, keine Größengrenze und nichts, was auf einer fremden Festplatte liegen bleibt." },
  ],
  finalTitle: "Setzen Sie einen Chef an Ihre Mediendateien",
  finalSub: `Kostenlos, quelloffen, ${FACTS.platformCount} Plattformen. Version ${FACTS.version}.`,
  betaNote:
    "MediaChef ist jung: Die Builds sind noch nicht von Apple oder Microsoft signiert, der erste Start fragt deshalb nach — in jedem Download liegt eine Anleitung als reiner Text bei.",
  contactNote:
    "Etwas kaputt oder fehlt etwas? Schreiben Sie uns:",
  footRights: "© 2026 mediachef.app · GPL-3.0",
  footTagline: "Eine quelloffene Medienküche.",
  tocLabel: "Auf dieser Seite",
  breadcrumbHome: "Startseite",
  alsoLabel: "Weiterlesen",
  footNavLabel: "Projektlinks",

  menu: {
    navLabel: "Website",
    menu: "Menü",
    features: "Funktionen",
    guides: "Anleitungen",
    download: "Herunterladen",
    faq: "Fragen",
    gConvert: "Konvertierung",
    gTranscribe: "Transkription",
    gTrust: "Datenschutz und Code",
    gMac: "macOS",
    gWin: "Windows",
    gLinux: "Linux",
    allFiles: "Alle Dateien und Versionshinweise",
    footProduct: "Produkt",
    footGuides: "Anleitungen",
    footDownload: "Herunterladen",
    footProject: "Projekt",
    footBlurb: `Eine kostenlose Medienküche für macOS, Windows und Linux. FFmpeg ${FACTS.ffmpeg} und whisper.cpp ${FACTS.whisper} stecken im Download — separat zu installieren ist nichts.`,
    license: "Lizenz GPL-3.0",
    notice: "Was eingebaut ist — NOTICE.md",
    sourceCode: "Quellcode auf GitHub",
    releases: "Alle Versionen",
    langLabel: "Sprache",
    // Подпись на схеме окна приложения в hero.
    dropHere: "Dateien hier ablegen",
    dlWin: "Windows · Installer",
    nApple: "Apple Silicon",
    nZip: "Apple Silicon, ohne Installer",
    nWin: "64 Bit",
    nAppimage: "x86_64, läuft direkt",
    nDeb: "x86_64, Debian und Ubuntu",
    sHow: "So funktioniert es",
    sRecipes: "Rezepte",
    sOut: "Was die App sofort kann",
    sTranscribe: "Transkription",
    sModels: "Whisper-Modelle",
    sPrivacy: "Offline und privat",
    sOss: "Open Source",
    sFaq: "Fragen",
    pMp3: "MP4 in MP3",
    pTranscribe: "Audio in Text",
  },
};

export const landings = {
  mp3: {
    title: "MP4 in MP3 umwandeln — kostenlos und offline — MediaChef",
    description:
      "Ziehen Sie den Ton aus einem MP4 und speichern Sie ihn als MP3 auf dem eigenen Rechner: ohne Upload, ohne Größengrenze, ohne Wasserzeichen. Kostenlose Open-Source-App für macOS, Windows und Linux.",
    h1: "MP4 in MP3 umwandeln — kostenlos, offline, auf Ihrem Rechner",
    crumb: "MP4 in MP3",
    lead:
      "MediaChef bringt ein Rezept namens „Audio als MP3 extrahieren“ mit. Video ablegen, Bitrate wählen, Start drücken: Die Tonspur wird als MP3 neben dem Original geschrieben. Die Datei verlässt Ihren Rechner nie, es gibt kein Größenlimit, und das Ganze funktioniert mit abgeschaltetem Netz.",
    sections: { how: "how", table: "bitrate", why: "offline", faq: "faq" },
    toc: ["MP4 in MP3 umwandeln", "Welche Bitrate wählen", "Warum auf dem eigenen Rechner", "Fragen"],
    stepsTitle: "MP4 in MP3 umwandeln — Schritt für Schritt",
    steps: [
      { h: "MediaChef herunterladen", p: "Eine Datei für macOS, Windows oder Linux. FFmpeg ist bereits drin — nichts separat zu installieren, nichts in den PATH einzutragen." },
      { h: "MP4 ablegen", p: "MediaChef liest die Datei mit ffprobe und behält nur die passenden Rezepte. Ein Video mit Tonspur bekommt die MP3-Karte sofort." },
      { h: "„Audio als MP3 extrahieren“ wählen", p: "Bitrate aussuchen: 128k für Sprache, 192k als Vorgabe, 320k fürs Archiv. Die Befehlsvorschau ändert sich beim Umschalten mit." },
      { h: "Start drücken und Datei abholen", p: "Das MP3 erscheint neben dem Video als clip.audio.mp3. Die Warteschlange zeigt Fortschritt, Restzeit und den fertigen Pfad." },
    ],
    shotAlt:
      "MediaChef bereit zur Umwandlung von MP4 in MP3: die Ablagefläche wartet auf eine Videodatei, rechts die Aufgabenliste.",
    shotCaption: "Die Fläche, auf der das MP4 landet. Die Rezepte erscheinen, sobald MediaChef die Datei gelesen hat.",
    tableTitle: "Welche Bitrate wählen",
    tableLead:
      "Das Rezept bietet drei Bitraten. Die Größen unten gelten für eine Stunde Audio — reine Rechnung aus der Bitrate, eine zweistündige Aufnahme wiegt also schlicht das Doppelte.",
    tableHead: ["Bitrate", "Eine Stunde Audio", "Wählen, wenn"],
    tableRows: [
      ["128 kbps", "≈ 58 MB", "Sprache: Interviews, Podcasts, Vorlesungen, Sprachnotizen. Kleinste Datei, bei einer Stimme ohne hörbaren Verlust."],
      ["192 kbps", "≈ 86 MB", "Die Vorgabe. Musik, die Sie tatsächlich hören, und alles, bei dem Sie unsicher sind."],
      ["320 kbps", "≈ 144 MB", "Archivierung, oder Audio, das Sie weiter bearbeiten und später erneut kodieren."],
    ],
    tableNote:
      "Nicht nur MP4: Dasselbe Rezept erscheint für MKV, MOV, WebM, AVI, TS und alles andere, was FFmpeg lesen kann — vorausgesetzt, die Datei hat eine Tonspur.",
    whyTitle: "Warum auf dem eigenen Rechner umwandeln",
    whyBullets: [
      { h: "Nichts wird hochgeladen.", p: "Ein mitgeschnittenes Gespräch oder ein unveröffentlichter Schnitt bleibt auf Ihrer Platte. Es gibt keine Serverkopie, deren Aufbewahrungsrichtlinie man glauben müsste." },
      { h: "Keine Größengrenze.", p: "Online-Konverter machen zwischen 100 MB und 2 GB Schluss und stellen Sie in eine Warteschlange. Eine vier Gigabyte große Bildschirmaufnahme wandelt sich wie eine mit vier Megabyte." },
      { h: "Schneller bei echten Dateien.", p: "Eine vorhandene Tonspur zu extrahieren geht schnell. Langsam ist das Hochladen des Videos davor — und lokal gibt es diesen Schritt nicht." },
      { h: "Kostenlos, ohne Konto.", p: "Open Source unter GPL-3.0: keine Anmeldung, keine Testphase, kein Wasserzeichen, kein Limit pro Datei." },
      { h: "Stapelweise statt einzeln.", p: "Legen Sie alle Clips auf einmal ab; die Warteschlange arbeitet sie ab und nennt Ihnen den Pfad jedes MP3." },
    ],
    faqTitle: "Häufige Fragen",
    faq: [
      { q: "Verliert MP4 zu MP3 an Qualität?", a: "MP3 ist ein verlustbehaftetes Format, die Spur wird also einmal neu kodiert. Bei den voreingestellten 192 kbps ist das bei Sprache nicht hörbar und bei Musik sehr nah dran. Ist die Datei ein Master, an dem Sie weiterarbeiten, nehmen Sie 320 kbps." },
      { q: "Wie groß darf die Datei sein?", a: "MediaChef setzt keine Grenze — die Grenze ist Ihr freier Speicherplatz, und die App prüft ihn vor dem Start. Die Länge spielt ebenfalls keine Rolle: eine dreistündige Aufnahme ist eine Aufgabe in der Warteschlange." },
      { q: "Funktioniert es ohne Internet?", a: "Ja, vollständig. FFmpeg steckt im Download, die Konvertierung fasst das Netz nie an. Nur die Transkription braucht einmalig einen Modell-Download." },
      { q: "Kann ich mehrere Videos gleichzeitig umwandeln?", a: "Ja. Legen Sie alle ab, fügen Sie das Rezept hinzu, und die Warteschlange arbeitet sie nacheinander ab — mit Fortschritt und Restzeit für jedes." },
      { q: "Gibt es ein Wasserzeichen oder eine Bezahlversion?", a: "Nein. MediaChef ist Open Source unter GPL-3.0 ganz ohne Bezahlversion und fasst Ihr Audio über die gewünschte Umwandlung hinaus nicht an." },
      { q: "Wenn ich eine MP4 in MP3 konvertiere, bleibt das Video erhalten?", a: "Ja. MediaChef liest das Video und legt eine neue MP3 daneben: Die MP4 wird weder überschrieben noch umbenannt oder gelöscht, Sie können dieselbe Datei also beliebig oft umwandeln. Hochgeladen wird ebenfalls nichts, alles läuft ohne Verbindung." },
    ],
    ctaTitle: "Holen Sie das MP3 aus diesem Video",
    ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
    also: [
      { page: "catalog", label: "Der vollständige Rezeptkatalog, nach Kategorien" },
      { page: "transcribe", label: "Audio in Text transkribieren — offline, mit Whisper" },
      { page: "home", label: `Alle ${FACTS.recipeCount} Rezepte und wie MediaChef arbeitet` },
    ],
  },
  transcribe: {
    title: "Audio in Text transkribieren — offline mit Whisper — MediaChef",
    description:
      "Verwandeln Sie Aufnahmen auf dem eigenen Rechner mit Whisper in Text: TXT, SRT, VTT oder JSON. Ohne Upload, ohne Minutenpreis, ohne Längenbegrenzung. Kostenlose App für macOS, Windows und Linux.",
    h1: "Audio in Text transkribieren — offline, auf dem eigenen Rechner",
    crumb: "Audio in Text",
    lead:
      "MediaChef führt Whisper von OpenAI lokal über whisper.cpp aus. Ein Modell einmal laden, dann eine Aufnahme oder ein Video ablegen und wählen, was herauskommen soll: reiner Text, SRT- oder VTT-Untertitel mit Zeitmarken, oder JSON mit der Zeit jedes Abschnitts. Das Audio wird nie hochgeladen, und es gibt keinen Minutenpreis.",
    sections: { how: "how", table: "models", why: "offline", faq: "faq" },
    toc: ["Eine Aufnahme transkribieren", "Welches Whisper-Modell wählen", "Warum lokal transkribieren", "Fragen"],
    outLabel: "Was dabei herauskommt",
    outSample: "00:00:04  Hallo zusammen, wir fangen an…\n00:00:11  Erster Punkt: die Pläne fürs Quartal.\n00:00:19  Es gibt drei Szenarien, ich zeige die Tabelle.",
    outNote: "TXT ohne Zeitmarken, SRT und VTT mit ihnen, JSON mit Anfang und Ende jedes Abschnitts.",
    stepsTitle: "Eine Aufnahme transkribieren",
    steps: [
      { h: "MediaChef herunterladen", p: "Eine Datei für macOS, Windows oder Linux. whisper.cpp v1.7.6 steckt bereits im Download; nur das Modell kommt separat." },
      { h: "Whisper-Modell wählen", p: "Öffnen Sie „Modelle“ und laden Sie eines — small (488 MB) ist die ausgewogene Vorgabe. Einmal geladen, danach transkribiert die App mit abgeschaltetem Netz." },
      { h: "Aufnahme oder Video ablegen", p: "Audio und Video gehen beide: MediaChef holt den Ton aus einem Video selbst heraus, ein Meeting-Mitschnitt und ein MP4 nehmen denselben Weg." },
      { h: "Gewünschte Ausgabe wählen", p: "„Audio in Text transkribieren“ für TXT, „Audio in SRT-Untertitel transkribieren“ oder „Audio in WebVTT transkribieren“ für Untertitel mit Zeitmarken, „Audio in JSON mit Zeitmarken“ für eigene Werkzeuge." },
      { h: "Start drücken und lesen", p: "Der Text landet neben der Datei als talk.transcript.txt. Die Warteschlange zeigt den Fortschritt; enthält die Datei keine Sprache, sagt MediaChef das, statt eine leere zu schreiben." },
    ],
    shotAlt:
      "MediaChef vor der Transkription: die Ablagefläche für eine Aufnahme, in der Seitenleiste „Modelle“, wo Whisper-Modelle geladen werden.",
    shotCaption: "Die Modelle sitzen in der Seitenleiste — einmal laden, danach offline transkribieren.",
    tableTitle: "Welches Whisper-Modell wählen",
    tableLead:
      "Vier Modelle stehen im Katalog und werden in der App geladen. Größer heißt besserer Text und längere Rechenzeit auf derselben Maschine — wählen Sie also je Aufgabe statt ein für alle Mal.",
    tableHead: ["Modell", "Download", "Wann es passt"],
    tableRows: [
      ["tiny", "78 MB", "Ein erster Durchgang bei klarer Sprache, oder wenn Sie nur finden müssen, wo ein Thema beginnt."],
      ["base", "148 MB", "Notizen für sich selbst: lesbarer Text, den Sie ohnehin überfliegen und nachbessern."],
      ["small", "488 MB", "Die Vorgabe in allen Transkriptionsrezepten und das Modell, bei dem die meisten bleiben. Interviews, Meetings, Vorlesungen."],
      ["large-v3-turbo", "1,62 GB", "Text, der an andere geht: veröffentlichte Untertitel, zitierte Passagen. Auf Apple Silicon optimiert."],
    ],
    tableNote:
      "Die Sprache wird automatisch erkannt, lässt sich aber auch festlegen. Zwei zusätzliche Rezepte übersetzen jede Sprache ins Englische — als Text oder als Untertitel mit Zeitmarken — im selben Durchgang.",
    whyTitle: "Warum lokal transkribieren",
    whyBullets: [
      { h: "Vertrauliches Audio bleibt vertraulich.", p: "Interviews, Therapienotizen, Anwaltsgespräche, alles unter Verschwiegenheitspflicht: Die Datei liest ein Prozess auf Ihrem eigenen Rechner und sonst nichts." },
      { h: "Kein Minutenpreis.", p: "Transkription in der Cloud rechnet pro Minute ab. Lokal kostet die zehnte Stunde Audio so viel wie die erste: nichts." },
      { h: "Keine Längen- oder Größengrenze.", p: "Eine vierstündige Aufnahme ist eine Aufgabe in der Warteschlange, kein Bezahltarif und kein Behelf, die Datei zu zerteilen." },
      { h: "Funktioniert ganz ohne Netz.", p: "Liegt das Modell auf der Platte, läuft die Transkription offline: im Flugzeug, im Labor, auf einer abgeschotteten Maschine." },
      { h: "Untertitel und Text aus einem Durchgang.", p: "SRT und VTT tragen die Zeitmarken für einen Player, TXT ist sauberer Fließtext, JSON enthält die Abschnittszeiten für eigene Skripte." },
    ],
    faqTitle: "Häufige Fragen",
    faq: [
      { q: "Wie genau ist die Whisper-Transkription?", a: "Die Genauigkeit hängt am Modell: tiny ist ein Rohentwurf, small die ausgewogene Vorgabe, large-v3-turbo kommt bei klarer Sprache nah an menschliches Niveau. Sauberes Audio mit einer Stimme gelingt am besten; starke Akzente, Durcheinanderreden und Musik unter der Stimme kosten Genauigkeit — wie bei jeder Spracherkennung." },
      { q: "Welche Sprachen kann es?", a: "Whisper deckt rund hundert Sprachen ab und erkennt die Sprache selbst; Sie können sie auch festlegen, wenn die Erkennung danebenliegt. Zwei Rezepte übersetzen Sprache aus jeder davon in einem Durchgang ins Englische, als Text oder als SRT-Untertitel." },
      { q: "In welchen Formaten kommt der Text?", a: "TXT für reinen Text, SRT und VTT mit Zeitmarken für Player und Schnittprogramme, und JSON mit Anfang und Ende jedes Abschnitts für Skripte und Werkzeuge." },
      { q: "Brauche ich Internet?", a: "Einmal, um im Bildschirm „Modelle“ ein Whisper-Modell zu laden — je nach Wahl 78 MB bis 1,62 GB. Danach läuft die Transkription vollständig offline." },
      { q: "Was, wenn die Aufnahme keine Sprache enthält?", a: "MediaChef meldet „Keine Sprache erkannt“, statt eine leere Datei zu schreiben und die Aufgabe grün abzuhaken. Stille, Musik ohne Gesang und eine versehentlich gewählte Datei enden gleich ehrlich." },
      { q: "Kann ich auch ein Video in Text umwandeln oder nur Audio?", a: "Video geht genauso. MediaChef holt den Ton direkt aus der Datei, eine MP4, MKV oder MOV geht also unmittelbar in die Transkription — es gibt sogar ein eigenes Rezept, „Text aus einem Video holen“. Vorher konvertieren müssen Sie nichts." },
    ],
    ctaTitle: "Machen Sie Text aus dieser Aufnahme",
    ctaSub: `MediaChef ${FACTS.version} — Whisper lokal, kostenlos und quelloffen.`,
    also: [
      { page: "catalog", label: "Der vollständige Rezeptkatalog, nach Kategorien" },
      { page: "mp3", label: "MP4 in MP3 umwandeln — kostenlos und offline" },
      { page: "home", label: `Alle ${FACTS.recipeCount} Rezepte und wie MediaChef arbeitet` },
    ],
  },
};

/** Каталог рецептов: /<locale>/<slug>/. Названия рецептов, описания и алиасы
 *  берутся из recipes/*.yaml — здесь только обвязка страницы. */
export const catalog = {
  title: `Alle ${FACTS.recipeCount} MediaChef-Rezepte — Video, Audio und Transkription`,
  description: "Alle Rezepte, die MediaChef mitbringt: Video und Audio umwandeln, komprimieren, zuschneiden, Größe ändern, den Ton herausholen, ein GIF erzeugen, Sprache mit Whisper in Text transkribieren. Kostenlos, quelloffen, läuft ohne Verbindung auf macOS, Windows und Linux.",
  h1: `Alle ${FACTS.recipeCount} Rezepte`,
  crumb: "Rezepte",
  lead: "MediaChef verlangt keine Kommandozeilenoptionen. Jede Aufgabe ist eine Karte: Datei ablegen, Karte wählen, starten. Das hier ist der vollständige Katalog, so wie er ausgeliefert wird — was jedes Rezept annimmt, was es zurückgibt und was Sie in die Suche der Anwendung tippen können, um es zu finden.",
  // Разделы страницы. Категории из YAML сведены в них по смыслу
  // результата — см. BUCKET в recipes.ts.
  sections: {
    speech: "Sprache, Text und Untertitel",
    video: "Video",
    audio: "Audio",
    advanced: "Erweitert",
  },
  // Названия категорий совпадают с теми, что человек увидит в самом приложении.
  cats: {
    "extract": "Extrahieren",
    "transcribe": "Transkribieren",
    "convert-video": "Video umwandeln",
    "convert-audio": "Audio umwandeln",
    "compress": "Komprimieren",
    "cut": "Zuschneiden",
    "geometry": "Größe",
    "gif": "GIF",
    "audio-in-video": "Ton im Video",
    "advanced": "Erweitert",
  },
  accepts: "Nimmt",
  produces: "Gibt",
  settings: "Einstellungen",
  searchAs: "Zu finden auch über",
  types: { video: "Video", audio: "Audio", any: "jede Datei" },
  noParams: "Nichts einzustellen.",
  ctaTitle: "Den ganzen Satz holen",
  ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "MP4 in MP3 umwandeln — kostenlos und offline" },
    { page: "transcribe", label: "Audio in Text transkribieren — offline, mit Whisper" },
  ],
};

export default { ui, landings, catalog };
