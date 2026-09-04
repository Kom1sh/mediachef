// Гайд «видео в GIF», польский. Поисковые формулировки: «jak zrobić gifa
// z filmu», «zamienić wideo na gif», «konwerter wideo na gif». Разделитель
// дробной части — запятая, единицы MB/KB, «kl./s» вместо FPS.
import { FACTS } from "../../facts";

export default {
  title: "Wideo na GIF — za darmo i bez sieci, na własnym komputerze",
  description:
    "Jak zrobić gifa z filmu na własnym komputerze: wybierz klatki na sekundę i szerokość, naciśnij start. Bez wysyłania, bez limitu rozmiaru, bez znaku wodnego. W środku zmierzone rozmiary pliku dla każdego ustawienia.",
  h1: "Wideo na GIF, na własnym komputerze",
  crumb: "Wideo na GIF",

  answer:
    "Upuść wideo w MediaChef, wybierz przepis „Wideo na GIF”, ustaw klatki na sekundę i szerokość, naciśnij start. GIF pojawi się obok pliku źródłowego. Nic nie jest wysyłane: FFmpeg liczy na twojej maszynie, więc nie ma ani limitu rozmiaru, ani kolejki. Na ustawieniach domyślnych — 15 klatek na sekundę i szerokość 480 pikseli — GIF kosztuje około 130 KB na sekundę wideo: dziesięć sekund wychodzi około 1,3 MB.",

  facts: [
    { k: "Co jest potrzebne", v: `MediaChef ${FACTS.version} — jedno pobranie, FFmpeg jest już w środku` },
    { k: "Działa bez sieci", v: "Tak, całkowicie — sieć nie jest w ogóle ruszana" },
    { k: "Co przyjmuje", v: "MP4, MKV, MOV, WebM, AVI, TS i wszystko inne, co czyta FFmpeg" },
    { k: "Ustawienia", v: "Klatki/s 10 / 15 / 24 · szerokość 320 / 480 / 640 pikseli" },
    { k: "Co dostajesz", v: "clip.gif, zapisany obok wideo źródłowego" },
    { k: "Cena", v: "Za darmo, otwarty kod (GPL-3.0), bez konta i bez znaku wodnego" },
  ],

  toc: [
    { id: "how", label: "Jak to zrobić" },
    { id: "fps", label: "Ile klatek" },
    { id: "width", label: "Jaka szerokość" },
    { id: "size", label: "Ile będzie ważyć" },
    { id: "duration", label: "Jak wpływa długość" },
    { id: "why", label: "Dlaczego u siebie" },
    { id: "notfor", label: "Kiedy GIF to zły pomysł" },
    { id: "faq", label: "Pytania" },
  ],

  stepsTitle: "Jak zamienić wideo na GIF",
  steps: [
    {
      h: "Pobierz MediaChef",
      p: "Jeden plik na macOS, Windows albo Linux. FFmpeg jedzie wewnątrz pobrania — nic nie trzeba instalować osobno ani dopisywać do PATH.",
    },
    {
      h: "Upuść wideo na pole",
      p: "MediaChef czyta plik przez ffprobe i zostawia tylko pasujące przepisy. Karta GIF pojawia się przy każdym wideo; format źródłowy nie ma znaczenia.",
    },
    {
      h: "Wybierz „Wideo na GIF”",
      p: "Dwa ustawienia: klatki na sekundę i szerokość w pikselach. Wysokość liczy się z szerokości, proporcje zostają — klip 16:9 przy szerokości 480 wyjdzie 480×270.",
    },
    {
      h: "Naciśnij start i odbierz plik",
      p: "GIF pojawia się obok wideo jako clip.gif. Kolejka pokazuje postęp i gotową ścieżkę; upuść kilka filmów naraz i wykonają się jeden po drugim.",
    },
  ],
  shotAlt:
    "MediaChef gotowy do konwersji: pole czeka na plik wideo, po prawej kolejka zadań.",
  shotCaption: "Pole, na które trafia wideo. Przepisy pojawiają się, gdy MediaChef przeczyta plik.",

  tables: [
    {
      id: "fps",
      title: "Ile klatek na sekundę wybrać",
      lead:
        "Klatki na sekundę decydują, jak płynnie wygląda ruch, i wprost proporcjonalnie — ile plik waży. GIF przechowuje każdą klatkę niemal osobno, więc dwa razy więcej klatek to około dwóch razy większy plik.",
      head: ["Klatki/s", "Jak wygląda", "Bierz, gdy"],
      rows: [
        ["10", "Przy szybkim ruchu widocznie skokowo, przy wolnym w porządku", "Nagrania ekranu, wędrujący kursor, pojawiający się tekst. Najmniejszy plik."],
        ["15", "Wystarczająco płynnie na prawie wszystko", "Wartość domyślna. Reakcje, krótkie scenki i wszystko, czego nie jesteś pewien."],
        ["24", "Jak w kinie, bez widocznych skoków", "Szybki ruch, sport, panoramy — i tylko jeśli rozmiar ci pasuje."],
      ],
      note:
        "Liczba klatek jest dokładna: klatki = klatki/s × sekundy. Dziesięć sekund przy 15 to 150 klatek, przy 24 już 240.",
    },
    {
      id: "width",
      title: "Jaką szerokość wybrać",
      lead:
        "Ty podajesz szerokość, wysokość liczy się sama, żeby proporcje zostały, a skalowanie idzie filtrem Lanczos. W tabeli, w co zamienia się wideo 16:9.",
      head: ["Szerokość", "16:9 staje się", "Bierz, gdy"],
      rows: [
        ["320 px", "320×180", "Czaty i komunikatory, gdzie GIF i tak pokazuje się mały. Około połowy tego, co 480."],
        ["480 px", "480×270", "Wartość domyślna. Czytelne w poście albo wiadomości, a przy tym lekkie."],
        ["640 px", "640×360", "Kiedy liczą się szczegóły: pokaz interfejsu, mały tekst na ekranie. Około 1,5 raza więcej niż 480."],
      ],
      note:
        "W górę nic nie jest rozciągane: źródło o szerokości 320 zostanie przy 320, nawet jeśli poprosisz o 640.",
    },
    {
      id: "size",
      title: "Ile plik będzie ważyć",
      lead:
        "Zmierzone, nie oszacowane: dziesięć sekund wideo 1280×720 z ruchem w całym kadrze, przepuszczone dokładnie tym przepisem. Spokojny materiał kompresuje się lepiej, ruchliwy gorzej — traktuj to jako górną połowę zakresu.",
      head: ["Klatki/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 MB", "0,88 MB", "1,36 MB"],
        ["15", "0,65 MB", "1,28 MB", "1,98 MB"],
        ["24", "0,98 MB", "1,96 MB", "3,05 MB"],
      ],
      note:
        "Najtańsze i najdroższe ustawienie różnią się prawie siedmiokrotnie, a między nimi są dwa kliknięcia. Jeśli GIF wyszedł za ciężki, obniż najpierw szerokość: dla oka kosztuje to mniej niż utrata klatek.",
    },
    {
      id: "duration",
      title: "Jak długość zmienia rozmiar",
      lead:
        "Wzrost jest liniowy, bo każda sekunda dodaje własne klatki. Na ustawieniach domyślnych — 15 klatek, szerokość 480 — sekunda kosztuje około 130 KB, a ta liczba prawie nie rusza się z długością.",
      head: ["Długość", "Rozmiar domyślnie", "Na sekundę"],
      rows: [
        ["3 s", "0,37 MB", "128 KB"],
        ["5 s", "0,64 MB", "131 KB"],
        ["10 s", "1,28 MB", "131 KB"],
        ["20 s", "2,56 MB", "131 KB"],
        ["30 s", "3,82 MB", "130 KB"],
      ],
      note:
        "Dlatego długość jest twoją najmocniejszą dźwignią: skrócenie klipu z trzydziestu sekund do ośmiu zmniejsza plik około czterokrotnie, a żadne ustawienie tego nie dorówna.",
    },
  ],

  whyTitle: "Dlaczego konwertować u siebie",
  whyBullets: [
    {
      h: "Nic nie jest wysyłane.",
      p: "Niewydany montaż, nagranie zamkniętej rozmowy, zrzut ekranu z danymi klienta — nic nie opuszcza dysku. Nie ma kopii na serwerze, którego polityce przechowywania trzeba by wierzyć.",
    },
    {
      h: "Bez limitu rozmiaru.",
      p: "Konwertery online kończą się między 100 MB a 2 GB i wstawiają cię do kolejki. Czterogigabajtowe nagranie ekranu konwertuje się tak samo jak czteromegabajtowe.",
    },
    {
      h: "Bez czekania na wysyłkę.",
      p: "Zrobienie GIF-a jest szybkie; w serwisie internetowym wolne jest wcześniejsze wysłanie wideo. Lokalnie tego kroku po prostu nie ma.",
    },
    {
      h: "Za darmo, bez konta i bez znaku wodnego.",
      p: "Otwarty kod na GPL-3.0: bez rejestracji, bez okresu próbnego i bez pieczątki w rogu twojego GIF-a.",
    },
    {
      h: "Kilka naraz.",
      p: "Upuść cały folder klipów: kolejka je przejdzie i powie, gdzie wylądował każdy GIF.",
    },
  ],

  notForTitle: "Kiedy GIF to zły pomysł",
  notForLead:
    "GIF to format obrazków z 1987 roku, który wykonuje pracę formatów wideo gorzej niż one same. Warto wybierać go świadomie, a oto przypadki, w których nie warto.",
  notFor: [
    {
      h: "Potrzebujesz dźwięku.",
      p: "GIF nie ma ścieżki dźwiękowej w ogóle: format nie ma gdzie jej umieścić. Jeśli klip potrzebuje dźwięku, zostaw go wideo.",
    },
    {
      h: "Potrzebujesz wiernych kolorów.",
      p: "Klatka GIF-a mieści najwyżej 256 kolorów. Gradienty, odcienie skóry i ciemne scenki układają się w widoczne pasy. Najbardziej cierpi materiał filmowany; płaski interfejs i animacje prawie tego nie zauważają.",
    },
    {
      h: "Klip jest długi.",
      p: "Przy 130 KB na sekundę dwuminutowy GIF to około 16 MB. Ten sam klip jako MP4 jest zwykle kilka razy mniejszy i wygląda lepiej.",
    },
    {
      h: "Trafia tam, gdzie i tak zostanie przekodowany.",
      p: "Część czatów i serwisów społecznościowych zamienia wysłanego GIF-a w wideo po swojej stronie. Tam zapłaciłeś rozmiarem GIF-a za nic.",
    },
  ],

  faqTitle: "Pytania",
  faq: [
    {
      q: "Jak długi może być GIF?",
      a: "MediaChef nie ustawia limitu: limitem jest twój dysk, a aplikacja sprawdza wolne miejsce przed startem. Praktycznym limitem jest rozmiar: na ustawieniach domyślnych każda sekunda kosztuje około 130 KB, więc minutowy GIF to około 8 MB, a pięciominutowy około 39 MB. Jeśli GIF idzie do wiadomości, najpierw przytnij klip.",
    },
    {
      q: "Dlaczego mój GIF waży więcej niż wideo, z którego powstał?",
      a: "Bo GIF przechowuje klatki niemal osobno, a MP4 różnicę między nimi. Na prawdziwym materiale to sprawia, że MP4 jest kilka razy mniejszy przy tym samym obrazie. MediaChef tego nie naprawi: tak zbudowany jest format.",
    },
    {
      q: "Czy GIF ma dźwięk?",
      a: "Nie. Format GIF nie ma ścieżki dźwiękowej, więc dźwięk jest odrzucany przy konwersji. Jeśli potrzebujesz dźwięku jako osobnego pliku, zastosuj do źródłowego wideo przepis „Wyciągnij audio do MP3”.",
    },
    {
      q: "Dlaczego kolory wyglądają gorzej niż w wideo?",
      a: "Klatka GIF-a dopuszcza najwyżej 256 kolorów, a wideo ma ich miliony. Łagodne gradienty — niebo, przejście do czerni, ciemna scena — zamieniają się w widoczne pasy. Nagrania ekranu i płaska grafika prawie nic nie tracą, bo kolorów i tak miały niewiele.",
    },
    {
      q: "Czy mogę zrobić GIF-a tylko z fragmentu wideo?",
      a: "Tak, w dwóch krokach: przepisem „Przytnij bez przekodowania” wyciągasz potrzebny fragment, a z niego robisz GIF-a. Przycięcie najpierw jest też najtańszym sposobem zmniejszenia pliku: długość wpływa mocniej niż jakiekolwiek ustawienie.",
    },
    {
      q: "Jakie klatki na sekundę i jaką szerokość wybrać?",
      a: "Zacznij od wartości domyślnych, 15 klatek i 480 pikseli: czytelne w poście, dziesięć sekund to około 1,3 MB. Zejdź do 320, jeśli plik musi być mały, i podnieś do 640, gdy mały tekst ma zostać czytelny. 24 bierz tylko na szybki ruch, a 10 na nagrania ekranu, gdzie skokowość jest prawie niewidoczna.",
    },
    {
      q: "Jak zmniejszyć GIF-a?",
      a: "W tej kolejności: skróć klip, potem zmniejsz szerokość, potem klatki na sekundę. Długość działa liniowo, więc trzydzieści sekund zamiast ośmiu oszczędza około czterech razy. Zejście z 640 na 320 pikseli oszczędza około trzech. Zejście z 24 na 15 klatek daje jedną trzecią, ale jest najbardziej widoczną zmianą.",
    },
    {
      q: "Czy jest znak wodny albo wersja płatna?",
      a: "Nie. MediaChef ma otwarty kod na GPL-3.0, wersji płatnej nie ma wcale, i nie dopisuje do obrazu niczego poza tą konwersją, o którą poprosiłeś.",
    },
    {
      q: "Czy działa bez internetu?",
      a: "Tak, całkowicie. FFmpeg jedzie wewnątrz pobrania, więc zrobienie GIF-a nigdy nie dotyka sieci. Tylko transkrypcja wymaga jednorazowego pobrania modelu, a to inny przepis.",
    },
    {
      q: "Z jakich formatów wideo mogę konwertować?",
      a: "Ze wszystkiego, co FFmpeg potrafi przeczytać: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV i pozostałych. MediaChef sprawdza plik przez ffprobe i proponuje przepis GIF każdemu wideo, które ma obraz.",
    },
    {
      q: "Czy mogę przekonwertować kilka filmów naraz?",
      a: "Tak. Upuść wszystkie na pole, dodaj przepis, a kolejka wykona je jeden po drugim, z postępem i pozostałym czasem dla każdego.",
    },
    {
      q: "Czy GIF będzie się zapętlać?",
      a: "Tak: GIF-y zapisane w ten sposób powtarzają się bez końca, i właśnie tak odtwarzają je wszystkie przeglądarki i podglądy.",
    },
    {
      q: "Czy GIF może mieć przezroczyste tło?",
      a: "Format dopuszcza jeden przezroczysty kolor, ale konwersja zwykłego wideo nie daje mu nic, co mogłoby być przezroczyste: klatki wideo są w pełni nieprzejrzyste. Przezroczystość ma sens tylko przy materiale, który już ją miał.",
    },
    {
      q: "Czy działa na Windows i Linux, czy tylko na macOS?",
      a: "Na wszystkich trzech. Na Windows jest instalator, na Linux AppImage i .deb, na macOS DMG pod Apple Silicon. Przepis i ustawienia są wszędzie takie same.",
    },
  ],

  ctaTitle: "Zrób GIF-a z tego klipu",
  ctaSub: `MediaChef ${FACTS.version} — za darmo, otwarty kod, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Konwersja MP4 na MP3 — za darmo i offline" },
    { page: "transcribe", label: "Transkrypcja audio na tekst przez Whisper, offline" },
    { page: "catalog", label: `Wszystkie ${FACTS.recipeCount} przepisy, kategoria po kategorii` },
  ],
} as const;
