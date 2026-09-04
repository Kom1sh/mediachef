// Гайд «видео в GIF», немецкий. Поисковые формулировки: «video in gif
// umwandeln», «gif erstellen», «gif aus video machen». Разделитель дробной
// части — запятая, единицы MB/KB, «Bilder/s» вместо FPS.
import { FACTS } from "../../facts";

export default {
  title: "Video in GIF umwandeln — kostenlos und offline, auf dem eigenen Rechner",
  description:
    "Wie Sie aus einem Video ein GIF machen, auf dem eigenen Rechner: Bilder pro Sekunde und Breite wählen, starten. Kein Hochladen, keine Größengrenze, kein Wasserzeichen. Drinnen die gemessenen Dateigrößen für jede Einstellung.",
  h1: "Video in GIF umwandeln, auf dem eigenen Rechner",
  crumb: "Video in GIF",

  answer:
    "Ziehen Sie das Video in MediaChef, wählen Sie das Rezept „Video zu GIF“, stellen Sie Bilder pro Sekunde und Breite ein und starten Sie. Das GIF erscheint neben der Ausgangsdatei. Hochgeladen wird nichts: FFmpeg rechnet auf Ihrer Maschine, es gibt also keine Größengrenze und keine Warteschlange. Mit den Standardwerten — 15 Bilder pro Sekunde und 480 Pixel Breite — kostet ein GIF etwa 130 KB pro Sekunde Video: zehn Sekunden ergeben rund 1,3 MB.",

  facts: [
    { k: "Was Sie brauchen", v: `MediaChef ${FACTS.version} — ein Download, FFmpeg ist schon drin` },
    { k: "Läuft offline", v: "Ja, vollständig — das Netz wird nie angefasst" },
    { k: "Nimmt an", v: "MP4, MKV, MOV, WebM, AVI, TS und alles andere, was FFmpeg liest" },
    { k: "Einstellungen", v: "Bilder/s 10 / 15 / 24 · Breite 320 / 480 / 640 Pixel" },
    { k: "Ergebnis", v: "clip.gif, geschrieben neben das Ausgangsvideo" },
    { k: "Preis", v: "Kostenlos, quelloffen (GPL-3.0), ohne Konto und ohne Wasserzeichen" },
  ],

  toc: [
    { id: "how", label: "So geht es" },
    { id: "fps", label: "Wie viele Bilder" },
    { id: "width", label: "Welche Breite" },
    { id: "size", label: "Wie groß es wird" },
    { id: "duration", label: "Was die Länge ausmacht" },
    { id: "why", label: "Warum auf dem eigenen Rechner" },
    { id: "notfor", label: "Wann ein GIF falsch ist" },
    { id: "faq", label: "Fragen" },
  ],

  stepsTitle: "So wandeln Sie ein Video in ein GIF um",
  steps: [
    {
      h: "MediaChef herunterladen",
      p: "Eine Datei für macOS, Windows oder Linux. FFmpeg reist im Download mit — nichts separat installieren, nichts in den PATH eintragen.",
    },
    {
      h: "Video auf die Arbeitsfläche ziehen",
      p: "MediaChef liest die Datei mit ffprobe und lässt nur die passenden Rezepte übrig. Die GIF-Karte erscheint bei jedem Video; das Ausgangsformat spielt keine Rolle.",
    },
    {
      h: "„Video zu GIF“ wählen",
      p: "Zwei Einstellungen: Bilder pro Sekunde und Breite in Pixel. Die Höhe wird aus der Breite berechnet, die Proportionen bleiben erhalten — ein 16:9-Clip mit Breite 480 kommt als 480×270 heraus.",
    },
    {
      h: "Starten und die Datei nehmen",
      p: "Das GIF landet neben dem Video als clip.gif. Die Warteschlange zeigt Fortschritt und fertigen Pfad; ziehen Sie mehrere Videos gleichzeitig hinein, laufen sie nacheinander.",
    },
  ],
  shotAlt:
    "MediaChef bereit zum Umwandeln: die Arbeitsfläche wartet auf eine Videodatei, rechts die Warteschlange.",
  shotCaption: "Die Arbeitsfläche, auf die das Video kommt. Rezepte erscheinen, sobald MediaChef die Datei gelesen hat.",

  tables: [
    {
      id: "fps",
      title: "Wie viele Bilder pro Sekunde wählen",
      lead:
        "Die Bilder pro Sekunde entscheiden, wie flüssig die Bewegung aussieht — und in direktem Verhältnis, wie schwer die Datei wird. Ein GIF speichert jedes Bild fast eigenständig, doppelt so viele Bilder heißt also etwa doppelte Größe.",
      head: ["Bilder/s", "Wirkung", "Nehmen, wenn"],
      rows: [
        ["10", "Bei schneller Bewegung sichtbar ruckelig, bei langsamer in Ordnung", "Bildschirmaufnahmen, ein wandernder Mauszeiger, erscheinender Text. Die kleinste Datei."],
        ["15", "Flüssig genug für fast alles", "Der Standardwert. Reaktionen, kurze Szenen und alles, bei dem Sie unsicher sind."],
        ["24", "Wie im Film, kein sichtbares Ruckeln", "Schnelle Bewegung, Sport, Schwenks — und nur, wenn die Größe passt."],
      ],
      note:
        "Die Bildzahl ist exakt: Bilder = Bilder/s × Sekunden. Zehn Sekunden bei 15 sind 150 Bilder, bei 24 sind es 240.",
    },
    {
      id: "width",
      title: "Welche Breite wählen",
      lead:
        "Sie geben die Breite an, die Höhe wird für das Seitenverhältnis berechnet, und skaliert wird mit dem Lanczos-Filter. In der Tabelle steht, was aus einem 16:9-Video wird.",
      head: ["Breite", "Aus 16:9 wird", "Nehmen, wenn"],
      rows: [
        ["320 px", "320×180", "Chats und Messenger, wo das GIF ohnehin klein gezeigt wird. Etwa halb so groß wie 480."],
        ["480 px", "480×270", "Der Standardwert. In einem Beitrag oder einer Nachricht lesbar und trotzdem leicht."],
        ["640 px", "640×360", "Wenn Details zählen: eine Oberflächen-Demo, kleiner Text im Bild. Etwa 1,5-mal so groß wie 480."],
      ],
      note:
        "Hochgerechnet wird nichts: eine Quelle mit 320 Pixel Breite bleibt bei 320, auch wenn Sie 640 verlangen.",
    },
    {
      id: "size",
      title: "Wie groß die Datei wird",
      lead:
        "Gemessen, nicht geschätzt: zehn Sekunden Video in 1280×720 mit Bewegung im ganzen Bild, durch genau dieses Rezept geschickt. Ruhiges Material komprimiert besser, unruhiges schlechter — nehmen Sie das als obere Hälfte der Spanne.",
      head: ["Bilder/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 MB", "0,88 MB", "1,36 MB"],
        ["15", "0,65 MB", "1,28 MB", "1,98 MB"],
        ["24", "0,98 MB", "1,96 MB", "3,05 MB"],
      ],
      note:
        "Die günstigste und die teuerste Einstellung unterscheiden sich um fast das Siebenfache, und zwischen ihnen liegen zwei Klicks. Wird das GIF zu schwer, senken Sie zuerst die Breite: fürs Auge kostet das weniger als der Verlust von Bildern.",
    },
    {
      id: "duration",
      title: "Wie die Länge die Größe verändert",
      lead:
        "Das Wachstum ist linear, weil jede Sekunde ihre eigenen Bilder hinzufügt. Mit den Standardwerten — 15 Bilder, Breite 480 — kostet eine Sekunde etwa 130 KB, und diese Zahl bewegt sich mit der Länge kaum.",
      head: ["Länge", "Größe im Standard", "Pro Sekunde"],
      rows: [
        ["3 s", "0,37 MB", "128 KB"],
        ["5 s", "0,64 MB", "131 KB"],
        ["10 s", "1,28 MB", "131 KB"],
        ["20 s", "2,56 MB", "131 KB"],
        ["30 s", "3,82 MB", "130 KB"],
      ],
      note:
        "Die Länge ist damit Ihr stärkster Hebel: einen Clip von dreißig auf acht Sekunden zu kürzen viertelt die Datei etwa, und keine Einstellung kommt dem nahe.",
    },
  ],

  whyTitle: "Warum auf dem eigenen Rechner umwandeln",
  whyBullets: [
    {
      h: "Es wird nichts hochgeladen.",
      p: "Ein unveröffentlichter Schnitt, die Aufnahme eines internen Gesprächs, eine Bildschirmaufnahme mit Kundendaten — nichts verlässt die Festplatte. Es gibt keine Kopie auf einem Server, dessen Aufbewahrungsregeln Sie glauben müssten.",
    },
    {
      h: "Keine Größengrenze.",
      p: "Online-Konverter enden zwischen 100 MB und 2 GB und stellen Sie in eine Warteschlange. Eine Bildschirmaufnahme von vier Gigabyte wird genauso umgewandelt wie eine von vier Megabyte.",
    },
    {
      h: "Kein Warten auf den Upload.",
      p: "Das GIF zu erzeugen geht schnell; bei einem Webdienst ist das Langsame, das Video erst hinzuschicken. Lokal fällt dieser Schritt weg.",
    },
    {
      h: "Kostenlos, ohne Konto, ohne Wasserzeichen.",
      p: "Quelloffen unter GPL-3.0: keine Anmeldung, keine Testphase, nichts in die Ecke Ihres GIFs gestempelt.",
    },
    {
      h: "Mehrere auf einmal.",
      p: "Ziehen Sie einen ganzen Ordner Clips hinein: die Warteschlange arbeitet sie ab und nennt für jedes GIF den Pfad.",
    },
  ],

  notForTitle: "Wann ein GIF die falsche Antwort ist",
  notForLead:
    "GIF ist ein Bildformat von 1987, das eine Aufgabe erledigt, die Videoformate besser erledigen. Man sollte es bewusst wählen — und hier sind die Fälle, in denen man es nicht sollte.",
  notFor: [
    {
      h: "Sie brauchen Ton.",
      p: "Ein GIF hat überhaupt keine Tonspur: das Format hat keinen Platz dafür. Wenn der Clip Ton braucht, lassen Sie ihn ein Video.",
    },
    {
      h: "Sie brauchen echte Farben.",
      p: "Ein GIF-Bild enthält höchstens 256 Farben. Verläufe, Hauttöne und dunkle Szenen bilden sichtbare Streifen. Am stärksten leidet gefilmtes Material; flache Oberflächen und Zeichentrick merken es kaum.",
    },
    {
      h: "Der Clip ist lang.",
      p: "Bei 130 KB pro Sekunde sind zwei Minuten GIF rund 16 MB. Derselbe Clip als MP4 ist meist um ein Mehrfaches kleiner und sieht besser aus.",
    },
    {
      h: "Es geht dorthin, wo es sowieso neu kodiert wird.",
      p: "Mehrere Chat- und Sozialplattformen wandeln ein hochgeladenes GIF auf ihrer Seite in ein Video um. Dort haben Sie den Größenaufschlag des GIF umsonst bezahlt.",
    },
  ],

  faqTitle: "Fragen",
  faq: [
    {
      q: "Wie lang darf das GIF sein?",
      a: "MediaChef setzt keine Grenze: die Grenze ist Ihre Festplatte, und die Anwendung prüft den freien Platz vor dem Start. Die praktische Grenze ist die Größe: mit den Standardwerten kostet jede Sekunde etwa 130 KB, ein GIF von einer Minute sind also rund 8 MB und eines von fünf Minuten etwa 39 MB. Wenn es in eine Nachricht geht, kürzen Sie den Clip vorher.",
    },
    {
      q: "Warum ist mein GIF größer als das Video, aus dem es entstand?",
      a: "Weil das GIF die Bilder fast eigenständig speichert, während MP4 den Unterschied zwischen ihnen speichert. Bei echtem Material macht das MP4 bei gleichem Bild um ein Mehrfaches kleiner. Das kann MediaChef nicht beheben: so ist das Format gebaut.",
    },
    {
      q: "Hat ein GIF Ton?",
      a: "Nein. Das GIF-Format hat keine Tonspur, der Ton wird beim Umwandeln also verworfen. Wenn Sie den Ton als eigene Datei brauchen, wenden Sie das Rezept „Audio als MP3 extrahieren“ auf das Ausgangsvideo an.",
    },
    {
      q: "Warum sehen die Farben schlechter aus als im Video?",
      a: "Ein GIF-Bild lässt höchstens 256 Farben zu, ein Video enthält Millionen. Sanfte Verläufe — ein Himmel, eine Abblende, eine dunkle Szene — werden zu sichtbaren Streifen. Bildschirmaufnahmen und flache Grafik verlieren fast nichts, weil sie ohnehin wenige Farben hatten.",
    },
    {
      q: "Kann ich ein GIF nur aus einem Teil des Videos machen?",
      a: "Ja, in zwei Schritten: mit dem Rezept „Ohne Neukodierung zuschneiden“ holen Sie das gewünschte Stück heraus und machen daraus das GIF. Vorher zu schneiden ist außerdem der billigste Weg, die Datei zu verkleinern: die Länge wirkt stärker als jede Einstellung.",
    },
    {
      q: "Welche Bilder pro Sekunde und welche Breite soll ich wählen?",
      a: "Beginnen Sie mit den Standardwerten, 15 Bilder und 480 Pixel: in einem Beitrag lesbar, zehn Sekunden rund 1,3 MB. Gehen Sie auf 320, wenn die Datei klein sein muss, und auf 640, wenn kleiner Text lesbar bleiben soll. 24 nur bei schneller Bewegung, 10 bei Bildschirmaufnahmen, wo das Ruckeln kaum auffällt.",
    },
    {
      q: "Wie mache ich das GIF kleiner?",
      a: "In dieser Reihenfolge: Clip kürzen, dann Breite verringern, dann Bilder pro Sekunde. Die Länge wirkt linear, dreißig Sekunden auf acht zu kürzen spart also etwa das Vierfache. Von 640 auf 320 Pixel spart etwa das Dreifache. Von 24 auf 15 Bilder spart ein Drittel, ist aber die sichtbarste Änderung.",
    },
    {
      q: "Gibt es ein Wasserzeichen oder eine Bezahlversion?",
      a: "Nein. MediaChef ist quelloffen unter GPL-3.0, ohne jede Bezahlversion, und schreibt nichts ins Bild außer der Umwandlung, um die Sie gebeten haben.",
    },
    {
      q: "Funktioniert es ohne Internet?",
      a: "Ja, vollständig. FFmpeg reist im Download mit, ein GIF zu erzeugen berührt das Netz also nie. Nur die Transkription braucht einmalig einen Modell-Download, und das ist ein anderes Rezept.",
    },
    {
      q: "Aus welchen Videoformaten kann ich umwandeln?",
      a: "Aus allem, was FFmpeg lesen kann: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV und den übrigen. MediaChef prüft die Datei mit ffprobe und bietet das GIF-Rezept jedem Video mit Bildspur an.",
    },
    {
      q: "Kann ich mehrere Videos auf einmal umwandeln?",
      a: "Ja. Ziehen Sie alle auf die Arbeitsfläche, fügen Sie das Rezept hinzu, und die Warteschlange arbeitet sie nacheinander ab, mit Fortschritt und Restzeit für jedes.",
    },
    {
      q: "Läuft das GIF in einer Schleife?",
      a: "Ja: so geschriebene GIFs wiederholen sich endlos, und genau so spielen sie alle Betrachter und Browser ab.",
    },
    {
      q: "Kann ein GIF einen transparenten Hintergrund haben?",
      a: "Das Format erlaubt eine transparente Farbe, aber ein gewöhnliches Video umzuwandeln gibt ihm nichts, was transparent sein könnte: Videobilder sind vollständig deckend. Transparenz ergibt nur bei Material Sinn, das sie schon hatte.",
    },
    {
      q: "Läuft es auf Windows und Linux oder nur auf macOS?",
      a: "Auf allen drei. Für Windows gibt es einen Installer, für Linux ein AppImage und ein .deb, für macOS ein DMG für Apple Silicon. Rezept und Einstellungen sind überall gleich.",
    },
  ],

  ctaTitle: "Machen Sie aus diesem Clip ein GIF",
  ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "MP4 in MP3 umwandeln — kostenlos und offline" },
    { page: "transcribe", label: "Audio mit Whisper in Text umwandeln, offline" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte, nach Kategorien` },
  ],
} as const;
