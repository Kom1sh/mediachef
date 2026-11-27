// Гайд «сжать видео», немецкий. Поисковые формулировки: «video komprimieren»,
// «video verkleinern», «videogröße reduzieren».
import { FACTS } from "../../facts";

export default {
  title: "Video komprimieren — kostenlos, offline, ohne Größengrenze",
  description:
    "Komprimieren Sie ein MP4 offline in MediaChef. Wählen Sie eine Qualitätsstufe oder geben Sie ein Dateilimit in MB an.",
  h1: "Video komprimieren auf dem eigenen Rechner",
  crumb: "Video komprimieren",

  answer:
    "Ziehen Sie das Video in MediaChef. Für eine kleinere Datei wählen Sie „Video komprimieren (Qualitätsvorgabe)“ und beginnen mit CRF 28. Bei einem Dateilimit in MB wählen Sie „Video auf eine Dateigröße komprimieren“ und geben das Maximum ein. Starten Sie den Auftrag und prüfen Sie das neue MP4. Das Original bleibt auf Ihrem Rechner.",

  facts: [
    { k: "Was Sie brauchen", v: `MediaChef ${FACTS.version} — ein Download, FFmpeg ist schon drin` },
    { k: "Läuft offline", v: "Ja, vollständig — das Netz wird nie angefasst" },
    { k: "Qualitätsstufen", v: "23 (hoch) · 28 (Standard) · 33 (kleine Datei)" },
    { k: "Codec", v: `CRF: H.264-Video, AAC-Ton mit 128 kbit/s (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Ergebnis", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (MB)" },
    { k: "Geschwindigkeit", v: "CRF: 20 s 1080p30 in 1,3–2,0 s auf einem Apple-Silicon-Notebook" },
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
      h: "Qualität oder Zielgröße auswählen",
      p: "Für eine kleinere Datei wählen Sie „Video komprimieren (Qualitätsvorgabe)“ und beginnen mit 28. Bei einem Limit wählen Sie „Video auf eine Dateigröße komprimieren“ und geben es in MB ein. MediaChef berechnet die Bitrate aus der Dauer und kann die Auflösung senken.",
    },
    {
      h: "Klicken Sie auf „Zur Warteschlange“",
      p: "Prüfen Sie nach Abschluss die Dateigröße. Die Warteschlange zeigt den Speicherort. Standardmäßig liegt die Ausgabe neben dem Original. Die Qualitätsvorgabe erstellt clip.compressed.mp4. Die Zielgröße erstellt clip.small.mp4.",
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
        ["33", "Sichtbar weicher; bei schneller Bewegung und in dunklen Szenen zeigen sich Blöcke", "Wählen Sie 33, wenn Sie für eine kleinere Datei sichtbare Qualitätsverluste in Kauf nehmen. Für ein Limit in MB verwenden Sie die Zielgröße."],
      ],
      note:
        "Weil die Qualität das Ziel ist, ergibt dieselbe Stufe bei einer statischen Bildschirmaufnahme eine kleine und bei Handkamera mit bewegtem Laub eine große Datei. Zwei Clips auf Stufe 28 können sich um ein Mehrfaches unterscheiden.",
    },
    {
      id: "size",
      title: "Was dabei herauskommt",
      lead:
        "CRF-Messungen an zwei 20 Sekunden langen Clips in 1080p30, einer mit Farbverläufen und einer mit feinen Details. Größen und Bitraten gelten nur für diese Clips.",
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
      h: "Kein Upload in die Cloud.",
      p: "MediaChef komprimiert das Video auf Ihrem Rechner. Das Original und die komprimierte Datei bleiben auf Ihrem Gerät.",
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
      p: "Wenn Sie nur einen Ausschnitt benötigen, verwenden Sie zuerst „Video ohne Neukodierung zuschneiden“. Das Rezept kopiert die Spuren ohne Neukodierung. Komprimieren Sie den Ausschnitt bei Bedarf.",
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
      a: "Das hängt vom Original und seiner Dauer ab. Mit CRF 28 waren die beiden Clips aus der Tabelle 11,0 und 6,4 MB groß. Bei einem festen Limit verwenden Sie die Zielgröße.",
    },
    {
      q: "Was bedeuten die Zahlen 23, 28 und 33?",
      a: "Es ist der Constant Rate Factor von H.264: ein Qualitätsziel, bei dem niedriger besser heißt. Der Encoder gibt so viel Bitrate aus, wie nötig ist, um diese Qualität bei Ihrem Material zu erreichen. Deshalb ergibt dieselbe Stufe bei einer statischen Bildschirmaufnahme und bei Handkameraarbeit sehr verschiedene Größen.",
    },
    {
      q: "Welche Stufe soll ich wählen?",
      a: "Beginnen Sie mit 28. Versuchen Sie 23 für mehr Details oder 33 für eine kleinere Datei. Bei einem Limit in MB verwenden Sie „Video auf eine Dateigröße komprimieren“ und prüfen das Ergebnis.",
    },
    {
      q: "Warum ist meine Datei nach dem Komprimieren größer?",
      a: "Weil Sie eine höhere Qualität verlangt haben, als die Datei schon hatte. Wir haben das gemessen: eine Datei mit 1,66 Mbit/s kam auf Stufe 23 um das 2,7-Fache größer und auf Stufe 28 um das 1,5-Fache größer heraus. Hat eine Datei schon eine niedrige Bitrate, nimmt weiteres Komprimieren nur Qualität — sehen Sie nach, was Sie haben, bevor Sie das Rezept starten.",
    },
    {
      q: "Ändert sich die Auflösung?",
      a: "Die Qualitätsvorgabe behält die Auflösung bei. Bei einer Zielgröße kann MediaChef die Auflösung an die verfügbare Bitrate anpassen.",
    },
    {
      q: "Was passiert mit dem Ton?",
      a: "Die Qualitätsvorgabe kodiert den Ton als AAC mit 128 kbit/s. Bei enger Zielgröße kann die Audio-Bitrate niedriger ausfallen. Behalten Sie die Quelle, wenn der Originalton erhalten bleiben soll.",
    },
    {
      q: "Wird die Originaldatei überschrieben?",
      a: "Beide Modi schreiben eine neue MP4-Datei neben dem Original: clip.compressed.mp4 bei der Qualitätsvorgabe und clip.small.mp4 bei der Zielgröße. Das Original bleibt erhalten.",
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
      a: "Ein zweiter Durchlauf kann die Datei verkleinern oder vergrößern und das Bild weiter verschlechtern. Ist das Ergebnis zu groß, verwenden Sie das Rezept mit Zielgröße für das Original.",
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
