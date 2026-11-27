// Гайд «сжать видео», польский. Поисковые формулировки: «kompresja wideo»,
// «zmniejszyć rozmiar wideo», «jak skompresować film».
import { FACTS } from "../../facts";

export default {
  title: "Kompresja wideo — za darmo, bez sieci, bez limitu rozmiaru",
  description:
    "Skompresuj MP4 w MediaChef bez internetu. Wybierz poziom jakości lub ustaw docelowy rozmiar w MB.",
  h1: "Kompresja wideo na własnym komputerze",
  crumb: "Kompresja wideo",

  answer:
    "Przeciągnij wideo do MediaChef. Aby zmniejszyć plik, wybierz „Skompresuj wideo (ustawienie jakości)” i zacznij od CRF 28. Przy limicie w MB wybierz „Skompresuj wideo do rozmiaru” i wpisz maksymalny rozmiar. Uruchom zadanie i sprawdź wynikowy MP4. Oryginał pozostaje na komputerze.",

  facts: [
    { k: "Co jest potrzebne", v: `MediaChef ${FACTS.version} — jedno pobranie, FFmpeg jest już w środku` },
    { k: "Działa bez sieci", v: "Tak, całkowicie — sieć nie jest w ogóle ruszana" },
    { k: "Poziomy jakości", v: "23 (wysoka) · 28 (domyślnie) · 33 (mały plik)" },
    { k: "Kodek", v: `CRF: Obraz H.264, dźwięk AAC 128 kb/s (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Co dostajesz", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (MB)" },
    { k: "Szybkość", v: "CRF: 20 s 1080p30 w 1,3–2,0 s na laptopie z Apple Silicon" },
  ],

  toc: [
    { id: "how", label: "Jak to zrobić" },
    { id: "level", label: "Jaki poziom wybrać" },
    { id: "size", label: "Co naprawdę dostajesz" },
    { id: "bigger", label: "Kiedy kompresja powiększa" },
    { id: "changes", label: "Co się zmienia, a co nie" },
    { id: "why", label: "Dlaczego u siebie" },
    { id: "notfor", label: "Kiedy to zły przepis" },
    { id: "faq", label: "Pytania" },
  ],

  stepsTitle: "Jak skompresować wideo",
  steps: [
    {
      h: "Pobierz MediaChef",
      p: "Jeden plik na macOS, Windows albo Linux. FFmpeg jedzie wewnątrz pobrania — nic nie trzeba instalować osobno ani dopisywać do PATH.",
    },
    {
      h: "Upuść wideo na pole",
      p: "MediaChef czyta plik przez ffprobe i zostawia tylko pasujące przepisy. Karta kompresji pojawia się przy każdym wideo, niezależnie od formatu źródłowego.",
    },
    {
      h: "Wybierz jakość lub docelowy rozmiar",
      p: "Aby zmniejszyć plik, wybierz „Skompresuj wideo (ustawienie jakości)” i zacznij od 28. Przy limicie w MB wybierz „Skompresuj wideo do rozmiaru” i wpisz maksimum. Program obliczy bitrate z długości nagrania i może obniżyć rozdzielczość.",
    },
    {
      h: "Kliknij „Dodaj do kolejki”",
      p: "Po zakończeniu sprawdź rozmiar pliku. Kolejka pokazuje ścieżkę wyniku. Domyślnie plik trafia obok oryginału. Tryb jakości zapisuje clip.compressed.mp4. Tryb rozmiaru zapisuje clip.small.mp4.",
    },
  ],
  shotAlt:
    "MediaChef gotowy do konwersji: pole czeka na plik wideo, po prawej kolejka zadań.",
  shotCaption: "Pole, na które trafia wideo. Przepisy pojawiają się, gdy MediaChef przeczyta plik.",

  tables: [
    {
      id: "level",
      title: "Jaki poziom jakości wybrać",
      lead:
        "Liczba wyznacza jakość, nie rozmiar — i to najpożyteczniejsza rzecz, jaką o niej warto wiedzieć. Mówisz koderowi, jak dobrze ma wyglądać obraz; rozmiar pliku wychodzi taki, ile to kosztuje na twoim konkretnym materiale.",
      head: ["Poziom", "Obraz", "Bierz, gdy"],
      rows: [
        ["23", "Z normalnej odległości trudno odróżnić od oryginału", "Wideo liczy się samo: praca do portfolio, materiał do dalszego montażu, wszystko, co pójdzie na duży ekran."],
        ["28", "Dobrze. Drobna faktura mięknie, jeśli się jej szuka", "Wartość domyślna. Podzielić się, wysłać, wgrać — poziom trafny, póki nie ma powodu na inny."],
        ["33", "Widocznie miękciej; przy szybkim ruchu i w ciemnych scenach widać bloki", "Wybierz 33, jeśli akceptujesz widoczną utratę jakości w zamian za mniejszy plik. Przy limicie w MB wybierz tryb rozmiaru."],
      ],
      note:
        "Skoro celem jest jakość, ten sam poziom daje mały plik na statycznym nagraniu ekranu i duży na zdjęciach z ręki, gdzie rusza się listowie. Dwa klipy na poziomie 28 mogą różnić się kilkukrotnie.",
    },
    {
      id: "size",
      title: "Co naprawdę dostajesz",
      lead:
        "Pomiary CRF na dwóch 20-sekundowych klipach 1080p30. Jeden ma łagodne przejścia, a drugi drobne detale. Rozmiary i bitrate dotyczą tylko tych klipów.",
      head: ["Poziom", "Klip łagodny", "Klip szczegółowy", "Uzyskana przepływność"],
      rows: [
        ["Źródło", "47,0 MB", "23,9 MB", "10–20 Mbit/s"],
        ["23", "24,1 MB", "13,2 MB", "5,5–10,1 Mbit/s"],
        ["28", "11,0 MB", "6,4 MB", "2,7–4,6 Mbit/s"],
        ["33", "4,0 MB", "3,8 MB", "1,6–1,7 Mbit/s"],
      ],
      note:
        "Wzór trzyma się na obu klipach: każdy krok skali zmniejsza plik około dwukrotnie. Przejście z 23 na 33 dało 6,1× na klipie łagodnym i 3,5× na szczegółowym — im trudniejszy materiał, tym mniej da się wygrać.",
    },
    {
      id: "bigger",
      title: "Kiedy kompresja powiększa plik",
      lead:
        "To zaskakuje, więc powiedzmy wprost: poprosić o jakość wyższą niż ta, którą plik już ma, znaczy kazać koderowi wydać więcej bitów, niż plik zawiera. Zmierzyliśmy to, podając wynik poziomu 33 ponownie na wejście.",
      head: ["Zastosowane do pliku 1,66 Mbit/s", "Wynik", "Efekt"],
      rows: [
        ["Poziom 23", "10,6 MB z 4,0 MB", "2,7 razy większy"],
        ["Poziom 28", "6,1 MB z 4,0 MB", "1,5 raza większy"],
        ["Poziom 33", "3,4 MB z 4,0 MB", "1,2 raza mniejszy i bardziej miękki"],
      ],
      note:
        "Zobacz więc, co masz na wejściu, przed kompresją. Nagranie z telefonu na 40 Mbit/s ma dużo do oddania; coś ściągniętego z sieci na 2 Mbit/s prawie nic, a przekodowanie tylko odbierze jakość.",
    },
    {
      id: "changes",
      title: "Co się zmienia, a co zostaje jak było",
      lead:
        "Przepis przekodowuje, ale nie przekadrowuje. Wiedza o tym, czego dotyka, oszczędza rundę zdziwień.",
      head: ["Właściwość", "Po kompresji", "Uwaga"],
      rows: [
        ["Rozdzielczość", "Bez zmian", "1080p na wejściu, 1080p na wyjściu. Na mniej pikseli jest przepis zmiany rozmiaru."],
        ["Klatki na sekundę", "Bez zmian", "Wszystkie klatki zostają; zmienia się tylko sposób ich zapisu."],
        ["Długość", "Bez zmian", "Żeby klip był krótszy, jest przepis przycinania."],
        ["Kodek obrazu", "H.264", "Kodowane z ustawieniem veryfast — stąd dwadzieścia sekund w mniej niż dwie."],
        ["Dźwięk", "AAC 128 kb/s", "Przekodowywany zawsze, czymkolwiek był. Do mowy i muzyki w klipie, którym się dzielisz, wystarcza."],
        ["Oryginał", "Nietknięty", "Obok zapisywany jest nowy plik; nic nie jest nadpisywane."],
      ],
    },
  ],

  whyTitle: "Dlaczego kompresować u siebie",
  whyBullets: [
    {
      h: "Bez wysyłania do chmury.",
      p: "MediaChef kompresuje wideo na Twoim komputerze. Oryginał i skompresowany plik zostają na urządzeniu.",
    },
    {
      h: "Oryginał zostaje.",
      p: "Wynik to nowy plik obok źródła, więc źle wybrany poziom kosztuje jeden przebieg więcej, a nie materiał.",
    },
    {
      h: "Cały folder naraz.",
      p: "Upuść wszystkie klipy: kolejka je przejdzie i powie, gdzie wylądował każdy wynik.",
    },
  ],

  notForTitle: "Kiedy to zły przepis",
  notForLead:
    "Kompresja to przekodowanie, a przekodowanie zawsze coś kosztuje. Oto przypadki, w których inny przepis wykona pracę lepiej albo taniej.",
  notFor: [
    {
      h: "Potrzebujesz tylko fragmentu.",
      p: "Gdy potrzebujesz jedynie fragmentu, najpierw użyj „Przytnij wideo bez ponownego kodowania”. Przepis kopiuje ścieżki bez ponownego kodowania. Skompresuj fragment, jeśli nadal jest za duży.",
    },
    {
      h: "Plik jest już mocno skompresowany.",
      p: "Jak zmierzono wyżej, plik na 1,66 Mbit/s wzrósł 2,7 raza na poziomie 23. Zobacz najpierw przepływność; jeśli już jest niska, nie ma czego wygrywać.",
    },
    {
      h: "Potrzebujesz mniej pikseli, nie mniej bitów.",
      p: "Ten przepis zachowuje rozdzielczość. Jeśli plik 4K jest ciężki właśnie dlatego, że jest 4K, przepis „Zmniejsz do 720p” zajmuje się prawdziwą przyczyną.",
    },
    {
      h: "Archiwizujesz materiał źródłowy.",
      p: "H.264 na każdym z tych poziomów jest stratny, a strata kumuluje się przy każdym kolejnym przekodowaniu. Zostaw źródło jak jest i kompresuj kopie.",
    },
  ],

  faqTitle: "Pytania",
  faq: [
    {
      q: "O ile zmniejszy się mój plik?",
      a: "To zależy od nagrania i jego długości. Przy CRF 28 klipy z tabeli miały 11,0 i 6,4 MB. Przy konkretnym limicie wybierz tryb rozmiaru docelowego.",
    },
    {
      q: "Co znaczą liczby 23, 28 i 33?",
      a: "To współczynnik stałej jakości H.264: cel jakościowy, w którym mniej znaczy lepiej. Koder wydaje tyle przepływności, ile potrzeba, żeby trafić w tę jakość na twoim materiale. Dlatego ten sam poziom daje bardzo różne rozmiary przy statycznym nagraniu ekranu i przy zdjęciach z ręki.",
    },
    {
      q: "Jaki poziom wybrać?",
      a: "Zacznij od 28. Spróbuj 23 dla większej ilości szczegółów lub 33 dla mniejszego pliku. Przy limicie w MB użyj „Skompresuj wideo do rozmiaru” i sprawdź wynik.",
    },
    {
      q: "Dlaczego po kompresji plik jest większy?",
      a: "Bo poprosiłeś o jakość wyższą niż ta, którą plik już miał. Zmierzyliśmy to: plik na 1,66 Mbit/s wyszedł 2,7 raza większy na poziomie 23 i 1,5 raza większy na poziomie 28. Jeśli plik ma już niską przepływność, dalsza kompresja tylko odbiera jakość — zobacz, co masz, przed uruchomieniem przepisu.",
    },
    {
      q: "Czy zmienia się rozdzielczość?",
      a: "Tryb jakości zachowuje rozdzielczość. Tryb rozmiaru może ją zmniejszyć, aby dopasować obraz do dostępnego bitrate’u.",
    },
    {
      q: "Co dzieje się z dźwiękiem?",
      a: "Tryb jakości zapisuje dźwięk jako AAC 128 kb/s. Tryb rozmiaru może obniżyć bitrate dźwięku. Zachowaj oryginał, jeśli potrzebujesz jego dźwięku bez zmian.",
    },
    {
      q: "Czy plik źródłowy jest nadpisywany?",
      a: "Oba tryby zapisują nowy MP4 obok źródła: clip.compressed.mp4 dla jakości i clip.small.mp4 dla rozmiaru. Źródło zostaje zachowane.",
    },
    {
      q: "Ile to zajmuje?",
      a: "Na laptopie z Apple Silicon dwadzieścia sekund 1080p30 zajęło od 1,3 do 2,0 sekundy — około dziesięć do piętnastu razy szybciej niż to obejrzeć. Dłuższe klipy rosną prawie liniowo, a kolejka pokazuje pozostały czas. Szybkość daje ustawienie veryfast.",
    },
    {
      q: "Czy jest limit rozmiaru?",
      a: "Plik wejściowy nie ma stałego limitu rozmiaru. Zostaw na dysku miejsce na wynik. W trybie rozmiaru docelowego można wpisać od 1 do 4000 MB.",
    },
    {
      q: "Czy skompresowanie dwa razy da jeszcze mniej?",
      a: "Drugi przebieg może zmniejszyć lub zwiększyć plik, a obraz może stracić na jakości. Jeśli pierwszy wynik przekracza limit, zastosuj tryb rozmiaru do oryginału.",
    },
    {
      q: "Jakie formaty mogę kompresować?",
      a: "Wszystko, co czyta FFmpeg: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV i pozostałe. Na wyjściu zawsze MP4 z H.264 — kombinacja, która odtwarza się wszędzie bez wtyczek.",
    },
    {
      q: "Czy mogę skompresować kilka filmów naraz?",
      a: "Tak. Upuść wszystkie na pole, dodaj przepis, a kolejka wykona je jeden po drugim, z postępem i pozostałym czasem dla każdego.",
    },
    {
      q: "Czy działa bez internetu?",
      a: "Tak, całkowicie. FFmpeg jedzie wewnątrz pobrania, więc kompresja nigdy nie dotyka sieci. Tylko transkrypcja wymaga jednorazowego pobrania modelu, a to inny przepis.",
    },
    {
      q: "Czy jest znak wodny albo wersja płatna?",
      a: "Nie. MediaChef ma otwarty kod na GPL-3.0, wersji płatnej nie ma, i nie dopisuje do obrazu niczego poza tym przekodowaniem, o które poprosiłeś.",
    },
    {
      q: "Czy działa na Windows i Linux?",
      a: "Na wszystkich trzech. Na Windows jest instalator, na Linux AppImage i .deb, na macOS DMG pod Apple Silicon. Przepis i jego poziomy są wszędzie takie same.",
    },
  ],

  ctaTitle: "Zmniejsz ten plik",
  ctaSub: `MediaChef ${FACTS.version} — za darmo, otwarty kod, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Wideo na GIF — zmierzone rozmiary dla każdego ustawienia" },
    { page: "mp3", label: "Konwersja MP4 na MP3 — za darmo i offline" },
    { page: "catalog", label: `Wszystkie ${FACTS.recipeCount} przepisy, kategoria po kategorii` },
  ],
} as const;
