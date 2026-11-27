// Гайд «обрезать видео», польский. Поисковые формулировки: «jak przyciąć
// wideo», «przycinanie wideo bez utraty jakości».
import { FACTS } from "../../facts";

export default {
  title: "Jak przyciąć wideo bez ponownego kodowania i bez internetu",
  description:
    "Przytnij MP4 w MediaChef bez ponownego kodowania. Ustaw początek i koniec i sprawdź, dlaczego klip może zacząć się wcześniej.",
  h1: "Przycinanie wideo bez utraty jakości",
  crumb: "Przytnij wideo",

  answer:
    "Przeciągnij plik MP4 do MediaChef, wybierz „Przytnij wideo bez ponownego kodowania” i podaj początek i koniec w formacie GG:MM:SS. Dla odcinka od 1:00 do 1:10 wpisz 00:01:00 i 00:01:10. MediaChef zapisze nowy MP4 obok oryginału i skopiuje obraz oraz dźwięk bez ponownego kodowania. Między klatkami kluczowymi początek może wypaść wcześniej.",

  facts: [
    { k: "Czego potrzebujesz", v: `MediaChef ${FACTS.version} — jedno pobranie, FFmpeg jest już w środku` },
    { k: "Działa offline", v: "Tak, w pełni — sieć nigdy nie jest ruszana" },
    { k: "Koszt jakości", v: "Zerowy. Nic nie jest kodowane od nowa, strumień jest kopiowany" },
    { k: "Format czasu", v: "HH:MM:SS. Puste pole końca oznacza: do końca pliku" },
    { k: "Szybkość", v: "0,03–0,04 s dla krótkich przykładów 1080p poniżej" },
    { k: "Co dostajesz", v: "clip.trim.mp4 obok oryginału, który zostaje na miejscu" },
  ],

  toc: [
    { id: "how", label: "Jak to zrobić" },
    { id: "speed", label: "Jak szybko to działa" },
    { id: "keyframes", label: "Dlaczego cięcie się przesuwa" },
    { id: "changes", label: "Co się zmienia, a co zostaje" },
    { id: "format", label: "Jak wpisywać czasy" },
    { id: "why", label: "Dlaczego u siebie" },
    { id: "notfor", label: "Kiedy to zły przepis" },
    { id: "faq", label: "Pytania" },
  ],

  stepsTitle: "Jak wyciąć fragment z filmu",
  steps: [
    {
      h: "Pobierz MediaChef",
      p: "Jeden plik dla macOS, Windowsa albo Linuksa. FFmpeg jedzie razem z pobraniem: nic nie trzeba instalować osobno ani dopisywać do PATH.",
    },
    {
      h: "Przeciągnij film na blat",
      p: "MediaChef czyta plik przez ffprobe i pokazuje tylko te przepisy, które do niego pasują. Kartę przycinania dostaje każdy film, niezależnie od formatu źródła.",
    },
    {
      h: "Wybierz „Przytnij wideo bez ponownego kodowania” i podaj czasy",
      p: "Pole końca znajduje się w sekcji „Zaawansowane”. Dla odcinka od 1:00 do 1:10 wpisz 00:01:00 i 00:01:10. Zostaw pole końca puste, aby zachować wszystko od wskazanego początku do końca pliku.",
    },
    {
      h: "Kliknij „Dodaj do kolejki”",
      p: "Po zakończeniu otwórz clip.trim.mp4. Kolejka pokazuje ścieżkę wyniku. Domyślnie plik trafia obok oryginału. Jeśli zależy Ci na dokładnym początku, sprawdź pierwsze sekundy.",
    },
  ],
  shotAlt:
    "MediaChef gotowy do konwersji: blat czeka na plik wideo, po prawej kolejka zadań.",
  shotCaption: "Blat, na który trafia film. Przepisy pojawiają się, gdy MediaChef przeczyta plik.",

  tables: [
    {
      id: "speed",
      title: "Jak szybko to naprawdę działa",
      lead:
        "Czasy zmierzyliśmy na jednym 20-sekundowym nagraniu 1080p. Przepis kopiuje wybrane dane, więc czas zależy od wielkości fragmentu i szybkości dysku.",
      head: ["Wycięty fragment", "Wynik", "Czas"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "Dla porównania: ponowne zakodowanie tego samego źródła zajęło od 1,3 do 2,0 sekundy — jakieś pięćdziesiąt razy dłużej, i to z utratą jakości w pakiecie. Jeśli potrzebujesz tylko fragmentu, to jest pierwszy przepis do wypróbowania.",
    },
    {
      id: "keyframes",
      title: "Dlaczego cięcie czasem się przesuwa",
      lead:
        "To jest ograniczenie powiedziane wprost — a kto je zna, ten dziwny wynik przyjmuje jako spodziewany. Film nie przechowuje każdej klatki w całości: większość opisuje tylko różnicę wobec poprzedniej, a cięcie może zacząć się wyłącznie na klatce pełnej, czyli kluczowej. Poproś o punkt pomiędzy nimi, a cięcie ruszy od poprzedniej klatki kluczowej.",
      head: ["Źródło", "Klatki kluczowe co", "Żądany start", "Faktyczny start"],
      rows: [
        ["Rzadkie klatki kluczowe", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — pięć sekund wcześniej"],
        ["Rzadkie klatki kluczowe", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s wcześniej"],
        ["Gęste klatki kluczowe", "co sekundę", "5 s", "5 s — dokładnie"],
        ["Gęste klatki kluczowe", "co sekundę", "9 s", "9 s — dokładnie"],
      ],
      note:
        "To, jak duże wyjdzie przesunięcie, jest cechą pliku, a nie MediaChefa: nagrania z telefonu i zrzuty ekranu zwykle stawiają klatkę kluczową co sekundę, a pliki wyeksportowane do publikacji potrafią zostawiać między nimi osiem sekund i więcej. Jeśli cięcie ma trafić co do klatki, potrzebujesz montażówki — ona po to koduje od nowa.",
    },
    {
      id: "changes",
      title: "Co się zmienia, a co zostaje jak było",
      lead:
        "Prawie nic się nie zmienia i o to w tym przepisie chodzi. Lista jest krótka, bo kopiowanie rusza bardzo niewiele.",
      head: ["Właściwość", "Po przycięciu", "Uwaga"],
      rows: [
        ["Jakość obrazu", "Bez zmian", "Te same zakodowane klatki są zapisywane od nowa. Żadnej straty pokoleniowej, nigdy."],
        ["Kodek wideo", "Bez zmian", "H.264 na wejściu, H.264 na wyjściu. Zostaje to, czego używało źródło."],
        ["Rozdzielczość", "Bez zmian", "Jeśli potrzebujesz mniej pikseli, weź przepis na skalowanie."],
        ["Dźwięk", "Kopiowany, nie kodowany od nowa", "Kodek dźwięku pozostaje bez zmian."],
        ["Kontener", "MP4", "Wynik zapisuje się jako MP4, niezależnie od kontenera źródła."],
        ["Oryginał", "Nietknięty", "Obok powstaje nowy plik, nic nie jest nadpisywane."],
      ],
    },
    {
      id: "format",
      title: "Jak wpisywać czasy",
      lead:
        "Oba pola przyjmują godziny, minuty i sekundy rozdzielone dwukropkami. Najwięcej pytań budzi pole końca.",
      head: ["Czego chcesz", "Początek", "Koniec"],
      rows: [
        ["Pierwsze trzydzieści sekund", "00:00:00", "00:00:30"],
        ["Od 1:30 do końca pliku", "00:01:30", "zostaw puste"],
        ["Minuta ze środka długiego nagrania", "01:12:00", "01:13:00"],
        ["Końcówka, od 2:05", "00:02:05", "zostaw puste"],
      ],
      note:
        "Koniec to pozycja na osi czasu, a nie długość: żeby wziąć dziesięć sekund od pierwszej minuty, wpisz 00:01:00 i 00:01:10, a nie 00:00:10.",
    },
  ],

  whyTitle: "Dlaczego przycinać na własnym komputerze",
  whyBullets: [
    {
      h: "Bez wysyłania do chmury.",
      p: "MediaChef przycina wideo na Twoim komputerze. Oryginał i gotowy fragment zostają na urządzeniu.",
    },
    {
      h: "Zero kosztu jakości.",
      p: "Większość przycinarek online koduje od nowa, więc każde cięcie kosztuje cię jedno pokolenie. Kopiowanie strumienia nie kosztuje nic i możesz ciąć ten sam plik tyle razy, ile chcesz.",
    },
    {
      h: "Bez limitu rozmiaru.",
      p: "Dwugodzinne nagranie to tutaj żaden problem — a to właśnie takie pliki narzędzia webowe odrzucają.",
    },
    {
      h: "Kilka naraz.",
      p: "Przeciągnij cały folder: kolejka przemieli go i powie, gdzie zapisał się każdy fragment.",
    },
  ],

  notForTitle: "Kiedy to nie jest właściwy przepis",
  notForLead:
    "Kopiowanie strumienia sprawia, że ten przepis jest szybki i bezstratny — i ono samo go ogranicza. Oto przypadki, w których lepiej sięgnąć po coś innego.",
  notFor: [
    {
      h: "Cięcie ma trafić w konkretną klatkę.",
      p: "Jak zmierzyliśmy wyżej, początek cofa się do najbliższej klatki kluczowej, a przy niektórych plikach to kilka sekund. Cięcie co do klatki wymaga ponownego kodowania i jest robotą dla montażówki.",
    },
    {
      h: "Chcesz wyciąć kawałek ze środka.",
      p: "Ten przepis wyjmuje jeden ciągły fragment. Usunięcie kawałka ze środka to zrobienie dwóch fragmentów i sklejenie ich — a to już montaż, nie przycinanie.",
    },
    {
      h: "I tak będziesz to kompresować.",
      p: "Wtedy najpierw przytnij, a potem kompresuj: taka kolejność kosztuje jedno kodowanie zamiast dwóch, a samo przycięcie i tak jest darmowe.",
    },
    {
      h: "Na końcu potrzebujesz innego formatu.",
      p: "Na wyjściu jest MP4 z oryginalnymi strumieniami w środku. Jeśli potrzebujesz WebM, GIF-a albo samego dźwięku, weź odpowiedni przepis — te z natury kodują od nowa.",
    },
  ],

  faqTitle: "Pytania",
  faq: [
    {
      q: "Czy przycinanie pogarsza jakość?",
      a: "Nie, ani trochę. Zakodowane klatki są kopiowane bez ruszania, więc obraz we fragmencie jest bit w bit taki jak w oryginale. Tym różni się to od większości przycinarek online, które kodują od nowa i każde cięcie kosztuje cię jedno pokolenie jakości.",
    },
    {
      q: "Dlaczego moje cięcie zaczęło się wcześniej, niż prosiłem?",
      a: "Bo cięcie może zacząć się wyłącznie na klatce kluczowej — takiej zapisanej w całości — a twój plik nie miał jej w żądanym punkcie. Zmierzyliśmy to: przy pliku z klatką kluczową co 8,33 sekundy prośba o start w 5. sekundzie dała fragment zaczynający się od 0. Przy pliku z klatką kluczową co sekundę ta sama prośba trafiła dokładnie. To cecha pliku, a nie programu.",
    },
    {
      q: "Jak zrobić cięcie co do klatki?",
      a: "Bez ponownego kodowania się nie da: klatka, w którą celujesz, nie istnieje w pliku jako pełna klatka. Jeśli dokładność jest ważniejsza niż szybkość i jakość, użyj montażówki — ona dekoduje i koduje od nowa, żeby dać ci dowolną klatkę.",
    },
    {
      q: "Ile to trwa?",
      a: "Krótkie cięcia z tabeli zajęły 0,03–0,04 s na naszym 20-sekundowym filmie 1080p. U Ciebie czas zależy od ilości kopiowanych danych i szybkości dysku.",
    },
    {
      q: "Jak wpisać początek i koniec?",
      a: "W formacie HH:MM:SS — godziny, minuty, sekundy. 00:01:30 to półtorej minuty. Koniec to pozycja, a nie długość: żeby wziąć dziesięć sekund od pierwszej minuty, wpisz 00:01:00 i 00:01:10.",
    },
    {
      q: "Co się stanie, jeśli zostawię koniec pusty?",
      a: "Puste pole końca zachowuje wszystko od wybranego początku do końca pliku. Aby odciąć końcówkę, podaj moment, w którym klip ma się skończyć.",
    },
    {
      q: "Czy mogę wyciąć kawałek ze środka i zostawić resztę?",
      a: "Nie w jednym kroku. Ten przepis daje jeden ciągły fragment. Usunięcie kawałka ze środka to zrobienie dwóch fragmentów i sklejenie ich — a to robota montażowa, nie przycinanie.",
    },
    {
      q: "Czy oryginalny plik zostaje zmieniony?",
      a: "Nie. Fragment zapisuje się obok jako clip.trim.mp4, a źródło nie jest zmieniane, przemianowywane ani kasowane. Możesz po kolei wyjąć z tego samego pliku kilka różnych fragmentów.",
    },
    {
      q: "Co dzieje się z dźwiękiem?",
      a: "Wybrana ścieżka dźwiękowa jest kopiowana bez ponownego kodowania. Kodek pozostaje ten sam. Średni bitrate fragmentu może różnić się od źródła.",
    },
    {
      q: "Czy jest limit długości albo rozmiaru?",
      a: "MediaChef nie narzuca limitu rozmiaru pliku wejściowego dla tego przepisu. Na dysku musi być miejsce na nowy klip.",
    },
    {
      q: "Jakie formaty mogę przycinać?",
      a: "Typowy przypadek to MP4 z obrazem H.264 i dźwiękiem AAC. Inne kontenery też mogą działać, jeśli wybrane ścieżki da się zapisać w MP4. Gdy kodek uniemożliwia eksport, najpierw przekonwertuj źródło do MP4.",
    },
    {
      q: "Czy mogę przyciąć kilka filmów naraz?",
      a: "Tak, ale wszystkie dostaną ten sam początek i koniec. Przeciągnij je wszystkie na blat, dodaj przepis, a kolejka przemieli je jeden po drugim.",
    },
    {
      q: "Czy działa bez internetu?",
      a: "Tak, w pełni. FFmpeg jedzie razem z pobraniem, więc przycinanie nigdy nie rusza sieci. Tylko transkrypcja wymaga jednorazowego pobrania modelu, a to inny przepis.",
    },
    {
      q: "Czy jest znak wodny albo wersja płatna?",
      a: "Nie. MediaChef jest otwartoźródłowy na licencji GPL-3.0, wersji płatnej nie ma, a skoro nic nie jest kodowane od nowa, to nie byłoby nawet gdzie wstawić znaku wodnego.",
    },
    {
      q: "Czy działa na Windowsie i Linuksie?",
      a: "Na wszystkich trzech systemach. Dla Windowsa jest instalator, dla Linuksa AppImage i .deb, dla macOS na Apple Silicon — DMG. Przepis zachowuje się wszędzie tak samo.",
    },
  ],

  ctaTitle: "Wytnij ten fragment",
  ctaSub: `MediaChef ${FACTS.version} — za darmo, otwarty kod, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Kompresja wideo — zmierzone rozmiary i bitrate'y" },
    { page: "gif", label: "Wideo na GIF — zmierzone rozmiary dla każdego ustawienia" },
    { page: "catalog", label: `Wszystkie ${FACTS.recipeCount} przepisów według kategorii` },
  ],
} as const;
