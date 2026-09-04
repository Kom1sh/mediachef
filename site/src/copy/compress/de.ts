// Гайд «сжать видео», немецкий. Поисковые формулировки: «video komprimieren»,
// «video verkleinern», «videogröße reduzieren».
import { FACTS } from "../../facts";

export default {
  title: "Video komprimieren — kostenlos, offline, ohne Größengrenze",
  description:
    "Wie Sie ein Video auf dem eigenen Rechner verkleinern: eine von drei Qualitätsstufen wählen, starten. Kein Hochladen, keine Größengrenze, kein Wasserzeichen. Drinnen: gemessene Größen, erreichte Bitraten und der Fall, in dem Komprimieren die Datei größer macht.",
  h1: "Video komprimieren auf dem eigenen Rechner",
  crumb: "Video komprimieren",

  answer:
    "Ziehen Sie das Video in MediaChef, wählen Sie das Rezept „Video komprimieren“, dann eine Qualitätsstufe, und starten Sie. Die kleinere Datei erscheint neben dem Original, das unangetastet bleibt. Jede Stufe der Skala — 23, 28, 33 — halbiert die Datei etwa: in unseren Messungen ergab 23 5,5–10 Mbit/s, 28 ergab 2,7–4,6 und 33 rund 1,6. Hochgeladen wird nichts, es gibt keine Größengrenze, und zwanzig Sekunden 1080p werden in unter zwei Sekunden neu kodiert.",

  facts: [
    { k: "Was Sie brauchen", v: `MediaChef ${FACTS.version} — ein Download, FFmpeg ist schon drin` },
    { k: "Läuft offline", v: "Ja, vollständig — das Netz wird nie angefasst" },
    { k: "Qualitätsstufen", v: "23 (hoch) · 28 (Standard) · 33 (kleine Datei)" },
    { k: "Codec", v: `H.264-Video, AAC-Ton mit 128 kbit/s (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Ergebnis", v: "clip.compressed.mp4 neben dem Original, das erhalten bleibt" },
    { k: "Geschwindigkeit", v: "20 s 1080p30 in 1,3–2,0 s auf einem Apple-Silicon-Notebook" },
  ],

  toc: [
    { id: "how", label: "So geht es" },
    { id: "level", label: "Welche Stufe" },
    { id: "size", label: "Was dabei herauskommt" },
    { id: "bigger", label: "Wann Komprimieren vergrößert" },
    { id: "changes", label: "Was sich ändert, was nicht" },
    { id: "why", label: "Warum auf dem eigenen Rechner" },
    { id: "notfor", label: "Wann es das falsche Rezept ist" },
    { id: "faq", label: "Fragen" },
  ],

  stepsTitle: "So komprimieren Sie ein Video",
  steps: [
    {
      h: "MediaChef herunterladen",
      p: "Eine Datei für macOS, Windows oder Linux. FFmpeg reist im Download mit — nichts separat installieren, nichts in den PATH eintragen.",
    },
    {
      h: "Video auf die Arbeitsfläche ziehen",
      p: "MediaChef liest die Datei mit ffprobe und lässt nur die passenden Rezepte übrig. Jedes Video bekommt die Komprimieren-Karte, unabhängig vom Ausgangsformat.",
    },
    {
      h: "„Video komprimieren“ und eine Stufe wählen",
      p: "Eine einzige Einstellung: 23, 28 oder 33, wobei eine kleinere Zahl besseres Bild und größere Datei bedeutet. 28 ist der Standard und für fast alles die richtige erste Annahme.",
    },
    {
      h: "Starten und vergleichen",
      p: "Das Ergebnis landet neben dem Original als clip.compressed.mp4. Die Ausgangsdatei wird nicht verändert, Sie können also beide ansehen und das Rezept mit einer anderen Stufe erneut laufen lassen.",
    },
  ],
  shotAlt:
    "MediaChef bereit zum Umwandeln: die Arbeitsfläche wartet auf eine Videodatei, rechts die Warteschlange.",
  shotCaption: "Die Arbeitsfläche, auf die das Video kommt. Rezepte erscheinen, sobald MediaChef die Datei gelesen hat.",

  tables: [
    {
      id: "level",
      title: "Welche Qualitätsstufe wählen",
      lead:
        "Die Zahl gibt die Qualität vor, nicht die Größe — das ist das Nützlichste daran zu verstehen. Sie sagen dem Encoder, wie gut das Bild aussehen muss; die Dateigröße ist, was das bei Ihrem Material kostet.",
      head: ["Stufe", "Bild", "Nehmen, wenn"],
      rows: [
        ["23", "Aus normalem Abstand kaum vom Original zu unterscheiden", "Das Video zählt für sich: eine Portfolioarbeit, Material für weiteren Schnitt, alles für die große Leinwand."],
        ["28", "Gut. Feine Textur wird weicher, wenn man danach sucht", "Der Standard. Teilen, hochladen, verschicken — die richtige Stufe, solange kein Grund dagegen spricht."],
        ["33", "Sichtbar weicher; bei schneller Bewegung und in dunklen Szenen zeigen sich Blöcke", "Die Datei muss in eine konkrete Grenze passen. Bewusst wählen, nicht aus Gewohnheit."],
      ],
      note:
        "Weil die Qualität das Ziel ist, ergibt dieselbe Stufe bei einer statischen Bildschirmaufnahme eine kleine und bei Handkamera mit bewegtem Laub eine große Datei. Zwei Clips auf Stufe 28 können sich um ein Mehrfaches unterscheiden.",
    },
    {
      id: "size",
      title: "Was dabei herauskommt",
      lead:
        "Gemessen an zwei zwanzig Sekunden langen 1080p30-Clips: einer mit sanften Verläufen und durchgehender Bewegung, einer mit feiner Struktur im ganzen Bild — etwa das leichte und das schwere Ende dessen, was einem Encoder begegnet. Die Bitratenspalte ist der Wert, der sich auf Ihr Material übertragen lässt; die Megabyte gehören zu diesen Clips.",
      head: ["Stufe", "Sanfter Clip", "Detailreicher Clip", "Erreichte Bitrate"],
      rows: [
        ["Quelle", "47,0 MB", "23,9 MB", "10–20 Mbit/s"],
        ["23", "24,1 MB", "13,2 MB", "5,5–10,1 Mbit/s"],
        ["28", "11,0 MB", "6,4 MB", "2,7–4,6 Mbit/s"],
        ["33", "4,0 MB", "3,8 MB", "1,6–1,7 Mbit/s"],
      ],
      note:
        "Das Muster hält bei beiden Clips: jede Stufe der Skala halbiert die Datei etwa. Von 23 auf 33 ergab 6,1× beim sanften und 3,5× beim detailreichen Clip — je schwerer das Material, desto weniger ist zu gewinnen.",
    },
    {
      id: "bigger",
      title: "Wann Komprimieren die Datei vergrößert",
      lead:
        "Das überrascht, darum klar gesagt: eine höhere Qualität zu verlangen, als die Datei bereits hat, heißt den Encoder mehr Bits ausgeben zu lassen, als in der Datei stecken. Wir haben es gemessen, indem wir das Ergebnis von Stufe 33 erneut hineingegeben haben.",
      head: ["Angewandt auf eine Datei mit 1,66 Mbit/s", "Ergebnis", "Wirkung"],
      rows: [
        ["Stufe 23", "10,6 MB aus 4,0 MB", "2,7-mal größer"],
        ["Stufe 28", "6,1 MB aus 4,0 MB", "1,5-mal größer"],
        ["Stufe 33", "3,4 MB aus 4,0 MB", "1,2-mal kleiner und weicher"],
      ],
      note:
        "Schauen Sie also nach, was Sie haben, bevor Sie komprimieren. Eine Handyaufnahme mit 40 Mbit/s hat viel zu geben; etwas schon aus dem Netz Geladenes mit 2 Mbit/s fast nichts, und neu zu kodieren nimmt nur Qualität.",
    },
    {
      id: "changes",
      title: "Was sich ändert und was bleibt",
      lead:
        "Das Rezept kodiert neu; es beschneidet nicht. Zu wissen, was es genau anfasst, erspart eine Runde Überraschungen.",
      head: ["Eigenschaft", "Nach dem Komprimieren", "Anmerkung"],
      rows: [
        ["Auflösung", "Unverändert", "1080p hinein, 1080p heraus. Für weniger Pixel gibt es das Rezept zum Verkleinern."],
        ["Bilder pro Sekunde", "Unverändert", "Alle Bilder bleiben; nur ihre Speicherung ändert sich."],
        ["Länge", "Unverändert", "Zum Kürzen gibt es das Rezept zum Zuschneiden."],
        ["Video-Codec", "H.264", "Kodiert mit der Vorgabe veryfast — daher zwanzig Sekunden in unter zwei."],
        ["Ton", "AAC mit 128 kbit/s", "Wird immer neu kodiert, was auch hereinkam. Für Sprache und Musik in einem geteilten Clip ausreichend."],
        ["Das Original", "Unangetastet", "Eine neue Datei wird daneben geschrieben; nichts wird überschrieben."],
      ],
    },
  ],

  whyTitle: "Warum auf dem eigenen Rechner komprimieren",
  whyBullets: [
    {
      h: "Es wird nichts hochgeladen.",
      p: "Das Video, das man verkleinern will, ist meist genau das noch nicht veröffentlichte. Es bleibt auf Ihrer Festplatte — keine Kopie auf einem Server, dessen Aufbewahrungsregeln Sie glauben müssten.",
    },
    {
      h: "Keine Größengrenze.",
      p: "Online-Kompressoren enden zwischen 100 MB und 2 GB, also genau in dem Bereich, in dem Komprimieren erst wichtig wird. Eine Vier-Gigabyte-Datei wird behandelt wie eine mit vier Megabyte.",
    },
    {
      h: "Schneller als hochladen.",
      p: "Zwanzig Sekunden 1080p werden hier in unter zwei Sekunden neu kodiert. Bei einem Webdienst muss derselbe Clip erst hin und zurück.",
    },
    {
      h: "Das Original bleibt.",
      p: "Das Ergebnis ist eine neue Datei neben der Quelle, eine falsch gewählte Stufe kostet also einen weiteren Durchlauf, nicht das Material.",
    },
    {
      h: "Ein ganzer Ordner auf einmal.",
      p: "Ziehen Sie alle Clips hinein: die Warteschlange arbeitet sie ab und nennt für jedes Ergebnis den Pfad.",
    },
  ],

  notForTitle: "Wann es das falsche Rezept ist",
  notForLead:
    "Komprimieren heißt neu kodieren, und neu kodieren kostet immer etwas. Das sind die Fälle, in denen ein anderes Rezept die Arbeit besser oder günstiger macht.",
  notFor: [
    {
      h: "Sie brauchen nur einen Ausschnitt.",
      p: "Zuerst zu schneiden ist kostenlos: das Rezept „Ohne Neukodierung zuschneiden“ kopiert den Datenstrom, statt ihn neu zu berechnen — in Hundertstelsekunden und ohne Verlust. Schneiden, dann komprimieren, falls es noch zu groß ist.",
    },
    {
      h: "Die Datei ist schon stark komprimiert.",
      p: "Wie oben gemessen, wuchs eine Datei mit 1,66 Mbit/s auf Stufe 23 um das 2,7-Fache. Schauen Sie zuerst auf die Bitrate; ist sie schon niedrig, ist nichts zu gewinnen.",
    },
    {
      h: "Sie brauchen weniger Pixel, nicht weniger Bits.",
      p: "Dieses Rezept behält die Auflösung. Ist eine 4K-Datei schwer, weil sie 4K ist, geht das Rezept „Auf 720p verkleinern“ die tatsächliche Ursache an.",
    },
    {
      h: "Sie archivieren ein Master.",
      p: "H.264 ist auf jeder dieser Stufen verlustbehaftet, und der Verlust summiert sich bei jedem künftigen Neukodieren. Lassen Sie das Master, wie es ist, und komprimieren Sie Kopien.",
    },
  ],

  faqTitle: "Fragen",
  faq: [
    {
      q: "Um wie viel wird meine Datei kleiner?",
      a: "Das hängt von der Bitrate ab, mit der Sie starten, nicht von der Dateigröße. In unseren Messungen ergab Stufe 28 2,7–4,6 Mbit/s und Stufe 33 rund 1,6 Mbit/s, unabhängig von der Quelle. Teilen Sie Ihre aktuelle Bitrate durch diese Werte: eine Handyaufnahme mit 40 Mbit/s fällt auf Stufe 28 etwa um das Zehnfache, ein Download mit 3 Mbit/s bewegt sich kaum.",
    },
    {
      q: "Was bedeuten die Zahlen 23, 28 und 33?",
      a: "Es ist der Constant Rate Factor von H.264: ein Qualitätsziel, bei dem niedriger besser heißt. Der Encoder gibt so viel Bitrate aus, wie nötig ist, um diese Qualität bei Ihrem Material zu erreichen. Deshalb ergibt dieselbe Stufe bei einer statischen Bildschirmaufnahme und bei Handkameraarbeit sehr verschiedene Größen.",
    },
    {
      q: "Welche Stufe soll ich wählen?",
      a: "Beginnen Sie mit 28 — das ist der Standard und richtig für Teilen, Verschicken und Hochladen. Nehmen Sie 23, wenn das Video für sich zählt und Sie es genau ansehen oder neu schneiden. Nehmen Sie 33 nur, wenn die Datei in eine konkrete Grenze passen muss; das Weichwerden zeigt sich bei schneller Bewegung und in dunklen Szenen.",
    },
    {
      q: "Warum ist meine Datei nach dem Komprimieren größer?",
      a: "Weil Sie eine höhere Qualität verlangt haben, als die Datei schon hatte. Wir haben das gemessen: eine Datei mit 1,66 Mbit/s kam auf Stufe 23 um das 2,7-Fache größer und auf Stufe 28 um das 1,5-Fache größer heraus. Hat eine Datei schon eine niedrige Bitrate, nimmt weiteres Komprimieren nur Qualität — sehen Sie nach, was Sie haben, bevor Sie das Rezept starten.",
    },
    {
      q: "Ändert sich die Auflösung?",
      a: "Nein. 1080p hinein heißt 1080p heraus; das Rezept ändert, wie das Bild gespeichert wird, nicht wie groß es ist. Wollen Sie weniger Pixel, nehmen Sie „Auf 720p verkleinern“, das die Größe an ihrer Quelle angeht und sich mit diesem kombinieren lässt.",
    },
    {
      q: "Was passiert mit dem Ton?",
      a: "Der Ton wird zu AAC mit 128 kbit/s neu kodiert, was auch vorher war. Für Sprache und für Musik in einem geteilten Clip ist das transparent genug. Brauchen Sie den Originalton unangetastet, holen Sie ihn vorher mit „Audio als MP3 extrahieren“ heraus oder behalten Sie die Quelldatei.",
    },
    {
      q: "Wird die Originaldatei überschrieben?",
      a: "Nein. Das Ergebnis wird daneben als clip.compressed.mp4 geschrieben, und die Quelle wird nicht verändert, umbenannt oder gelöscht. Sie können das Rezept mit einer anderen Stufe erneut laufen lassen und vergleichen.",
    },
    {
      q: "Wie lange dauert das?",
      a: "Auf einem Apple-Silicon-Notebook brauchten zwanzig Sekunden 1080p30 zwischen 1,3 und 2,0 Sekunden — etwa zehn- bis fünfzehnmal schneller, als sie anzusehen. Längere Clips skalieren fast linear, und die Warteschlange zeigt die Restzeit. Die Vorgabe veryfast erkauft diese Geschwindigkeit.",
    },
    {
      q: "Gibt es eine Größengrenze?",
      a: "Nein. MediaChef setzt keine; die Grenze ist der freie Speicherplatz, und die Anwendung prüft ihn vor dem Start. Das ist der wesentliche praktische Unterschied zu Web-Kompressoren, die meist zwischen 100 MB und 2 GB enden.",
    },
    {
      q: "Wird es durch zweimaliges Komprimieren noch kleiner?",
      a: "Kleiner ja, aber jeder Durchlauf verliert Qualität endgültig, und der zweite gewinnt viel weniger als der erste. Ist das Ergebnis noch zu schwer, gehen Sie zurück zum Original und nehmen eine höhere Zahl, statt Durchläufe auf der komprimierten Kopie zu stapeln.",
    },
    {
      q: "Welche Formate kann ich komprimieren?",
      a: "Alles, was FFmpeg liest: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV und die übrigen. Die Ausgabe ist immer MP4 mit H.264 — die Kombination, die überall ohne Zusatz läuft.",
    },
    {
      q: "Kann ich mehrere Videos auf einmal komprimieren?",
      a: "Ja. Ziehen Sie alle auf die Arbeitsfläche, fügen Sie das Rezept hinzu, und die Warteschlange arbeitet sie nacheinander ab, mit Fortschritt und Restzeit für jedes.",
    },
    {
      q: "Funktioniert es ohne Internet?",
      a: "Ja, vollständig. FFmpeg reist im Download mit, Komprimieren berührt das Netz also nie. Nur die Transkription braucht einmalig einen Modell-Download, und das ist ein anderes Rezept.",
    },
    {
      q: "Gibt es ein Wasserzeichen oder eine Bezahlversion?",
      a: "Nein. MediaChef ist quelloffen unter GPL-3.0, ohne Bezahlversion, und schreibt nichts ins Bild außer der Neukodierung, um die Sie gebeten haben.",
    },
    {
      q: "Läuft es auf Windows und Linux?",
      a: "Auf allen drei Plattformen. Für Windows gibt es einen Installer, für Linux ein AppImage und ein .deb, für macOS ein DMG für Apple Silicon. Rezept und Stufen sind überall gleich.",
    },
  ],

  ctaTitle: "Machen Sie diese Datei kleiner",
  ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Video in GIF — gemessene Größen für jede Einstellung" },
    { page: "mp3", label: "MP4 in MP3 umwandeln — kostenlos und offline" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte, nach Kategorien` },
  ],
} as const;
