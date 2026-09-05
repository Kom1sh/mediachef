// Гайд «обрезать видео», немецкий. Поисковые формулировки: «video schneiden
// ohne qualitätsverlust», «video zuschneiden kostenlos».
import { FACTS } from "../../facts";

export default {
  title: "Video schneiden ohne Qualitätsverlust — kostenlos, offline, sofort",
  description:
    "Wie Sie einen Ausschnitt aus einem Video auf dem eigenen Rechner herausschneiden, ohne die Qualität anzufassen: der Datenstrom wird kopiert, nicht neu berechnet, deshalb ist die Arbeit in Hundertstelsekunden fertig. Drin: gemessene Zeiten und die Keyframe-Grenze ehrlich erklärt.",
  h1: "Video schneiden ohne Qualitätsverlust",
  crumb: "Video schneiden",

  answer:
    "Ziehen Sie das Video in MediaChef, wählen Sie „Schneiden ohne Neukodierung“, tragen Sie Anfang und Ende als HH:MM:SS ein und starten Sie. Der Ausschnitt liegt danach neben dem Original. Nichts wird neu berechnet: der Datenstrom wird unverändert kopiert, das Bild ist also bitgenau dasselbe wie vorher, und die Arbeit ist in Hundertstelsekunden fertig — 0,03 Sekunden in unseren Messungen, egal ob der Ausschnitt fünf oder fünfzehn Sekunden lang ist. Der einzige Haken: Schnitte können nur auf einem Keyframe liegen, dazu unten mehr.",

  facts: [
    { k: "Was Sie brauchen", v: `MediaChef ${FACTS.version} — ein Download, FFmpeg ist schon drin` },
    { k: "Läuft offline", v: "Ja, vollständig — das Netz wird nie angefasst" },
    { k: "Qualitätskosten", v: "Keine. Es wird nichts neu kodiert, der Strom wird kopiert" },
    { k: "Zeitformat", v: "HH:MM:SS. Ende leer lassen heißt: bis zum Dateiende" },
    { k: "Tempo", v: "Rund 0,03 s, und das wächst nicht mit der Länge" },
    { k: "Was herauskommt", v: "clip.trim.mp4 neben dem Original, das erhalten bleibt" },
  ],

  toc: [
    { id: "how", label: "So geht es" },
    { id: "speed", label: "Wie schnell das ist" },
    { id: "keyframes", label: "Warum der Schnitt verrutscht" },
    { id: "changes", label: "Was sich ändert, was bleibt" },
    { id: "format", label: "Wie man die Zeiten schreibt" },
    { id: "why", label: "Warum lokal" },
    { id: "notfor", label: "Wann dieses Rezept falsch ist" },
    { id: "faq", label: "Fragen" },
  ],

  stepsTitle: "So schneiden Sie einen Ausschnitt heraus",
  steps: [
    {
      h: "MediaChef herunterladen",
      p: "Eine Datei für macOS, Windows oder Linux. FFmpeg reist im Download mit: nichts separat installieren, nichts in den PATH eintragen.",
    },
    {
      h: "Video auf die Arbeitsfläche ziehen",
      p: "MediaChef liest die Datei mit ffprobe und zeigt nur die Rezepte, die dazu passen. Jedes Video bekommt die Schnitt-Karte, unabhängig vom Ausgangsformat.",
    },
    {
      h: "„Schneiden ohne Neukodierung“ wählen und Zeiten eintragen",
      p: "Anfang und Ende als HH:MM:SS — 00:01:30 sind eineinhalb Minuten. Lassen Sie das Ende leer, läuft der Ausschnitt vom Startpunkt bis zum Dateiende.",
    },
    {
      h: "Starten und den Ausschnitt abholen",
      p: "Das Ergebnis erscheint neben dem Original als clip.trim.mp4, das Original bleibt unangetastet. Es ist schnell genug, dass es fertig ist, bevor Sie wegschauen konnten.",
    },
  ],
  shotAlt:
    "MediaChef bereit zum Konvertieren: die Arbeitsfläche wartet auf eine Videodatei, rechts die Warteschlange.",
  shotCaption: "Die Arbeitsfläche, auf der das Video landet. Die Rezepte erscheinen, sobald MediaChef die Datei gelesen hat.",

  tables: [
    {
      id: "speed",
      title: "Wie schnell das wirklich ist",
      lead:
        "Weil nichts neu berechnet wird, besteht die Arbeit darin, die benötigten Bytes zu kopieren. Die Zeit hängt nicht von der Länge des Ausschnitts ab — gemessen an einer zwanzig Sekunden langen 1080p-Quelle.",
      head: ["Herausgeschnitten", "Ergebnis", "Zeit"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "Zum Vergleich: dieselbe Quelle neu zu kodieren dauerte 1,3 bis 2,0 Sekunden — etwa das Fünfzigfache, und dazu noch mit Qualitätsverlust. Wenn Sie nur einen Ausschnitt brauchen, ist das hier das erste Rezept, das Sie probieren sollten.",
    },
    {
      id: "keyframes",
      title: "Warum der Schnitt manchmal verrutscht",
      lead:
        "Das ist die Grenze, offen gesagt — und wer sie kennt, hält ein verwirrendes Ergebnis für ein erwartetes. Ein Video speichert nicht jedes Bild vollständig: die meisten beschreiben nur den Unterschied zum vorherigen, und ein Schnitt kann nur bei einem vollständigen Bild beginnen, dem Keyframe. Fragen Sie nach einem Punkt dazwischen, beginnt der Schnitt beim vorherigen Keyframe.",
      head: ["Quelle", "Keyframes bei", "Gewünschter Start", "Tatsächlicher Start"],
      rows: [
        ["Weite Keyframes", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — fünf Sekunden früher"],
        ["Weite Keyframes", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s früher"],
        ["Enge Keyframes", "jede Sekunde", "5 s", "5 s — genau"],
        ["Enge Keyframes", "jede Sekunde", "9 s", "9 s — genau"],
      ],
      note:
        "Wie groß der Versatz ausfällt, ist eine Eigenschaft der Datei, nicht von MediaChef: Handyaufnahmen und Bildschirmmitschnitte setzen meist einen Keyframe pro Sekunde, während für die Auslieferung exportierte Dateien acht Sekunden und mehr dazwischen lassen. Wenn der Schnitt bildgenau sitzen muss, brauchen Sie einen Videoeditor — der kodiert dafür neu.",
    },
    {
      id: "changes",
      title: "Was sich ändert und was bleibt wie vorher",
      lead:
        "Fast nichts ändert sich, und genau das ist der Sinn dieses Rezepts. Die Liste ist kurz, weil Kopieren sehr wenig anfasst.",
      head: ["Eigenschaft", "Nach dem Schnitt", "Anmerkung"],
      rows: [
        ["Bildqualität", "Unverändert", "Dieselben kodierten Bilder werden neu geschrieben. Kein Generationsverlust, nie."],
        ["Video-Codec", "Unverändert", "H.264 rein, H.264 raus. Was die Quelle nutzte, bleibt erhalten."],
        ["Auflösung", "Unverändert", "Nehmen Sie das Skalier-Rezept, wenn Sie weniger Pixel brauchen."],
        ["Ton", "Kopiert, nicht neu kodiert", "Die Spur behält ihren ursprünglichen Codec und ihre Bitrate."],
        ["Container", "MP4", "Das Ergebnis wird als MP4 geschrieben, egal welcher Container die Quelle war."],
        ["Das Original", "Unangetastet", "Eine neue Datei entsteht daneben, es wird nichts überschrieben."],
      ],
    },
    {
      id: "format",
      title: "Wie man die Zeiten schreibt",
      lead:
        "Beide Felder nehmen Stunden, Minuten und Sekunden, durch Doppelpunkte getrennt. Die meisten Fragen betreffen das Endfeld.",
      head: ["Was Sie wollen", "Anfang", "Ende"],
      rows: [
        ["Die ersten dreißig Sekunden", "00:00:00", "00:00:30"],
        ["Ab 1:30 bis zum Dateiende", "00:01:30", "leer lassen"],
        ["Eine Minute mitten aus einer langen Aufnahme", "01:12:00", "01:13:00"],
        ["Der Schluss, ab 2:05", "00:02:05", "leer lassen"],
      ],
      note:
        "Das Ende ist eine Position auf der Zeitachse, keine Dauer: für zehn Sekunden ab der ersten Minute schreiben Sie 00:01:00 und 00:01:10, nicht 00:00:10.",
    },
  ],

  whyTitle: "Warum man auf dem eigenen Rechner schneidet",
  whyBullets: [
    {
      h: "Nichts wird hochgeladen.",
      p: "Schneiden ist meist das Erste, was man mit Rohmaterial macht — also genau mit dem Material, das noch niemand gesehen hat. Es bleibt auf Ihrer Platte.",
    },
    {
      h: "Kein Warten.",
      p: "Ein Webdienst muss die ganze Datei entgegennehmen, bevor er zehn Sekunden daraus holt. Hier ist die Arbeit in Hundertstelsekunden fertig, bei jeder Dateigröße.",
    },
    {
      h: "Keine Qualitätskosten.",
      p: "Die meisten Online-Schneider kodieren neu, jeder Schnitt kostet Sie also eine Generation. Den Strom zu kopieren kostet nichts, und Sie können dieselbe Datei beliebig oft schneiden.",
    },
    {
      h: "Keine Größenbeschränkung.",
      p: "Eine zweistündige Aufnahme ist hier kein Problem — und genau solche Dateien weisen Webdienste ab.",
    },
    {
      h: "Mehrere auf einmal.",
      p: "Ziehen Sie einen ganzen Ordner hinein: die Warteschlange arbeitet ihn ab und sagt Ihnen, wohin jeder Ausschnitt geschrieben wurde.",
    },
  ],

  notForTitle: "Wann dieses Rezept das falsche ist",
  notForLead:
    "Das Kopieren des Datenstroms macht dieses Rezept schnell und verlustfrei — und begrenzt es zugleich. Hier sind die Fälle, in denen etwas anderes besser passt.",
  notFor: [
    {
      h: "Der Schnitt muss auf einem bestimmten Bild sitzen.",
      p: "Wie oben gemessen, rutscht der Anfang auf den nächstgelegenen Keyframe zurück, bei manchen Dateien um mehrere Sekunden. Ein bildgenauer Schnitt verlangt Neukodierung, das ist die Aufgabe eines Videoeditors.",
    },
    {
      h: "Sie wollen ein Stück aus der Mitte entfernen.",
      p: "Dieses Rezept holt einen zusammenhängenden Ausschnitt heraus. Ein Stück aus der Mitte zu entfernen heißt, zwei Ausschnitte zu erzeugen und zusammenzufügen — das ist Schnittarbeit, nicht Zuschneiden.",
    },
    {
      h: "Sie werden es ohnehin komprimieren.",
      p: "Dann schneiden Sie zuerst und komprimieren danach: diese Reihenfolge kostet eine Neukodierung statt zwei, und der Schnitt selbst bleibt gratis.",
    },
    {
      h: "Sie brauchen am Ende ein anderes Format.",
      p: "Heraus kommt MP4 mit den ursprünglichen Strömen darin. Brauchen Sie WebM, ein GIF oder nur den Ton, nehmen Sie das jeweilige Rezept — die kodieren naturgemäß neu.",
    },
  ],

  faqTitle: "Fragen",
  faq: [
    {
      q: "Verliert das Video beim Schneiden an Qualität?",
      a: "Nein, überhaupt nicht. Die kodierten Bilder werden unangetastet kopiert, das Bild im Ausschnitt ist also bitgenau das des Originals. Das ist der Unterschied zu den meisten Online-Schneidern, die neu kodieren und Sie mit jedem Schnitt eine Qualitätsgeneration kosten.",
    },
    {
      q: "Warum begann mein Schnitt früher als angegeben?",
      a: "Weil ein Schnitt nur bei einem Keyframe beginnen kann — einem vollständig gespeicherten Bild — und Ihre Datei an der gewünschten Stelle keinen hatte. Wir haben es gemessen: bei einer Datei mit einem Keyframe alle 8,33 Sekunden ergab die Vorgabe „Start bei 5 Sekunden“ einen Ausschnitt, der bei 0 begann. Bei einer Datei mit einem Keyframe pro Sekunde traf dieselbe Vorgabe genau. Das ist eine Eigenschaft der Datei, nicht des Programms.",
    },
    {
      q: "Wie bekomme ich einen bildgenauen Schnitt?",
      a: "Ohne Neukodierung gar nicht: das Bild, das Sie treffen wollen, existiert in der Datei nicht als vollständiges Bild. Wenn Genauigkeit wichtiger ist als Tempo und Qualität, nehmen Sie einen Videoeditor — der dekodiert und kodiert neu und gibt Ihnen jedes beliebige Bild.",
    },
    {
      q: "Wie lange dauert das?",
      a: "Rund 0,03 Sekunden in unseren Messungen, und das wächst nicht mit der Länge des Ausschnitts: fünf Sekunden und fünfzehn Sekunden dauerten gleich lang. Dieselbe Quelle neu zu kodieren dauerte 1,3 bis 2,0 Sekunden, also etwa das Fünfzigfache.",
    },
    {
      q: "Wie schreibe ich Anfang und Ende?",
      a: "Als HH:MM:SS — Stunden, Minuten, Sekunden. 00:01:30 sind eineinhalb Minuten. Das Ende ist eine Position, keine Dauer: für zehn Sekunden ab der ersten Minute schreiben Sie 00:01:00 und 00:01:10.",
    },
    {
      q: "Was passiert, wenn ich das Ende leer lasse?",
      a: "Der Ausschnitt läuft von Ihrem Startpunkt bis zum Dateiende. Das ist der schnellste Weg, einen langen Nachlauf abzuschneiden — etwa eine Aufnahme, die nach dem Ende der Besprechung weiterlief.",
    },
    {
      q: "Kann ich ein Stück aus der Mitte entfernen und den Rest behalten?",
      a: "Nicht in einem Schritt. Dieses Rezept liefert einen zusammenhängenden Ausschnitt. Ein Stück aus der Mitte zu entfernen heißt, zwei Ausschnitte zu machen und sie zusammenzufügen — das ist Schnittarbeit, nicht Zuschneiden.",
    },
    {
      q: "Wird die Originaldatei verändert?",
      a: "Nein. Der Ausschnitt wird daneben als clip.trim.mp4 geschrieben, die Quelle wird nicht verändert, nicht umbenannt und nicht gelöscht. Sie können nacheinander mehrere verschiedene Ausschnitte aus derselben Datei holen.",
    },
    {
      q: "Was passiert mit dem Ton?",
      a: "Er wird zusammen mit dem Bild kopiert und behält seinen ursprünglichen Codec und seine Bitrate. Keine der beiden Spuren wird neu kodiert.",
    },
    {
      q: "Gibt es eine Längen- oder Größenbeschränkung?",
      a: "Nein. MediaChef setzt keine, und weil die Arbeit ein Kopiervorgang und keine Berechnung ist, schneidet sich eine zweistündige Datei nicht langsamer als eine zweiminütige. Die Grenze ist der freie Speicherplatz, den das Programm vor dem Start prüft.",
    },
    {
      q: "Welche Formate kann ich schneiden?",
      a: "Alles, was FFmpeg lesen kann: MP4, MKV, MOV, WebM, AVI, TS und weitere. Das Ergebnis wird als MP4 mit den ursprünglichen Video- und Tonströmen darin geschrieben.",
    },
    {
      q: "Kann ich mehrere Videos auf einmal schneiden?",
      a: "Ja, aber alle bekommen denselben Anfang und dasselbe Ende. Ziehen Sie sie alle auf die Arbeitsfläche, fügen Sie das Rezept hinzu, und die Warteschlange arbeitet sie nacheinander ab.",
    },
    {
      q: "Funktioniert das ohne Internet?",
      a: "Ja, vollständig. FFmpeg reist im Download mit, Schneiden fasst das Netz also nie an. Nur die Transkription braucht einen einmaligen Modell-Download, und das ist ein anderes Rezept.",
    },
    {
      q: "Gibt es ein Wasserzeichen oder eine Bezahlversion?",
      a: "Nein. MediaChef ist quelloffen unter GPL-3.0, es gibt keine Bezahlversion, und da nichts neu kodiert wird, wäre auch gar kein Ort da, an dem ein Wasserzeichen entstehen könnte.",
    },
    {
      q: "Läuft das unter Windows und Linux?",
      a: "Auf allen drei Plattformen. Für Windows gibt es einen Installer, für Linux ein AppImage und ein .deb, für macOS auf Apple Silicon ein DMG. Das Rezept verhält sich überall gleich.",
    },
  ],

  ctaTitle: "Holen Sie sich den Ausschnitt",
  ctaSub: `MediaChef ${FACTS.version} — kostenlos, quelloffen, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Video komprimieren — gemessene Größen und Bitraten" },
    { page: "gif", label: "Video zu GIF — gemessene Größen für jede Einstellung" },
    { page: "catalog", label: `Alle ${FACTS.recipeCount} Rezepte nach Kategorie` },
  ],
} as const;
