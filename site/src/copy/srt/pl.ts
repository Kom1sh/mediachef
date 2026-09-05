// Гайд «видео в субтитры», польский. Реальные запросы: «jak zrobić napisy do
// filmu», «automatyczne napisy», «wideo na srt».
import { FACTS } from "../../facts";

export default {
  title: "Napisy SRT z wideo — za darmo, offline, na własnym komputerze",
  description:
    "Jak wyciągnąć z filmu napisy SRT z czasami, niczego nigdzie nie wysyłając. Z prawdziwymi pomiarami: cztery modele Whispera zmierzone obok siebie, jak długie wychodzą linijki napisów i co naprawdę siedzi w każdym z czterech formatów.",
  h1: "Zrobić napisy SRT z wideo",
  crumb: "Wideo na SRT",

  answer:
    "Przeciągnij film do MediaChef, wybierz „Zrób napisy SRT do wideo”, zostaw model na small i język na automatycznym, i uruchom. Obok filmu pojawi się plik .srt, już z czasami. Wszystko liczy się na twoim komputerze: mowa nie opuszcza dysku, a gdy model jest już pobrany, przepis działa przy wyłączonej sieci. Na laptopie z M5 2 minuty 43 sekundy mowy zajęły 6,2 sekundy na modelu domyślnym — jakieś 26 razy szybciej niż w czasie rzeczywistym — i dały 73 linijki po średnio 39 znaków, czyli na tyle krótkie, że da się je spokojnie przeczytać.",

  facts: [
    { k: "Czego potrzebujesz", v: `MediaChef ${FACTS.version} plus jednorazowe pobranie modelu` },
    { k: "Model domyślny", v: "small — 488 MB, pobierany raz i zostaje" },
    { k: "Szybkość", v: "≈26× czasu rzeczywistego na modelu domyślnym (pomiar, M5)" },
    { k: "Działa offline", v: "Tak, gdy model leży już na dysku" },
    { k: "Formaty", v: "SRT, VTT, zwykły TXT i JSON — do każdego osobny przepis" },
    { k: "Co dostajesz", v: "clip.subs.srt obok filmu, sam film nietknięty" },
  ],

  toc: [
    { id: "how", label: "Jak to zrobić" },
    { id: "models", label: "Który model wybrać" },
    { id: "cues", label: "Jak długie wychodzą linijki" },
    { id: "formats", label: "SRT, VTT, TXT czy JSON" },
    { id: "recipes", label: "Który przepis do czego" },
    { id: "why", label: "Dlaczego u siebie" },
    { id: "notfor", label: "Kiedy to złe narzędzie" },
    { id: "faq", label: "Pytania" },
  ],

  stepsTitle: "Jak zrobić napisy do filmu",
  steps: [
    {
      h: "Pobierz MediaChef",
      p: "Jeden plik dla macOS, Windowsa albo Linuksa. I FFmpeg, i silnik Whispera jadą razem z pobraniem: nic nie trzeba instalować osobno ani dopisywać do PATH.",
    },
    {
      h: "Raz pobierz model",
      p: "Pierwsza transkrypcja poprosi o model mowy. Domyślny to small, 488 MB, i to na nim zrobione są wszystkie pomiary poniżej; tiny waży 78 MB, base 148 MB, a large-v3-turbo 1,62 GB. Pobiera się raz, zostaje na dysku i od tej pory przepis już nie rusza sieci.",
    },
    {
      h: "Wrzuć film i wybierz przepis",
      p: "„Zrób napisy SRT do wideo” bierze film wprost — nie trzeba wcześniej wyciągać dźwięku. MediaChef sam dekoduje ścieżkę do mono 16 kHz, którego wymaga Whisper, w katalogu tymczasowym, którego nigdy nie zobaczysz.",
    },
    {
      h: "Uruchom i otwórz .srt",
      p: "Plik ląduje obok filmu jako clip.subs.srt, z ponumerowanymi linijkami i czasami. Odtwarzacze, montażówki i platformy czytają go wprost, a że to zwykły tekst, nazwisko albo termin poprawisz w dowolnym edytorze.",
    },
  ],
  shotAlt:
    "MediaChef gotowy do konwersji: blat czeka na plik wideo, po prawej kolejka zadań.",
  shotCaption: "Blat, na który trafia film. Przepisy pojawiają się, gdy MediaChef przeczyta plik.",

  tables: [
    {
      id: "models",
      title: "Który model wybrać",
      lead:
        "Cztery modele, te same 2 minuty 43 sekundy mowy, ta sama maszyna: laptop z M5 i 16 GB, każdy model najpierw rozgrzany, liczy się lepszy z dwóch przebiegów.",
      head: ["Model", "Pobranie", "Czas", "Wobec czasu rzeczywistego", "Słów nietrafionych"],
      rows: [
        ["tiny", "78 MB", "2,1 s", "×78", "5 z 540"],
        ["base", "148 MB", "2,6 s", "×63", "3 z 540"],
        ["small — domyślny", "488 MB", "6,2 s", "×26", "0 z 540"],
        ["large-v3-turbo", "1,62 GB", "11,5 s", "×14", "1 z 540"],
      ],
      note:
        "Ostatnią kolumnę czytaj z poprawką, bo testowe nagranie to głos syntetyczny czytający przygotowany tekst: bez akcentu, bez szumu w tle, bez wchodzenia sobie w słowo. Dlatego nawet najmniejszy model jest tu prawie bezbłędny, a tak nie brzmi nagranie prawdziwej narady — przy trudnym dźwięku różnica między tymi modelami mocno się otwiera. Za to kolumna z czasem przekłada się na twój przypadek wprost. I jeszcze jedno, co gołe porównanie ukrywa: prawie wszystkie rozbieżności to liczby zapisane cyframi zamiast słowami — large-v3-turbo pisał „70”, „10”, „50”, „30” tam, gdzie w tekście były rozpisane. To formatowanie, a nie przesłyszenie.",
    },
    {
      id: "cues",
      title: "Jak długie wychodzą linijki napisów",
      lead:
        "Technicznie poprawny napis i tak jest bezużyteczny, jeśli wyrzuca na ekran dwadzieścia słów naraz. Modele tną tę samą wypowiedź bardzo różnie — pomiar z tego samego przebiegu.",
      head: ["Model", "Napisów", "Średni czas", "Znaków średnio", "Najdłuższy"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 znaków"],
        ["base", "35", "4,7 s", "83", "100 znaków"],
        ["small — domyślny", "73", "2,2 s", "39", "58 znaków"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 znaków"],
      ],
      note:
        "Przyjęta norma telewizyjna to około 42 znaki w wierszu na dwa wiersze, czyli mniej więcej 84 znaki naraz na ekranie. Według tej miary z czwórki mieści się spokojnie tylko small: 39 znaków średnio i 58 w najdłuższym napisie, podczas gdy large-v3-turbo wychodzi poza limit już przy zwykłym. Model domyślny jest więc nie tylko wyważonym wyborem pod względem trafności — tnie też mowę na najczytelniejsze kawałki.",
    },
    {
      id: "formats",
      title: "SRT, VTT, zwykły tekst czy JSON",
      lead:
        "Ta sama transkrypcja zapisana na cztery sposoby. Rozmiary pochodzą z tych samych 2 minut 43 sekund mowy, więc porównują się wprost.",
      head: ["Format", "Rozmiar", "Co jest w środku", "Kiedy brać"],
      rows: [
        ["SRT", "5,5 KB", "Ponumerowane napisy, czasy z przecinkiem: 00:00:00,000", "Prawie zawsze. Biorą go odtwarzacze, montażówki i platformy"],
        ["VTT", "5,3 KB", "Nagłówek WEBVTT, czasy z kropką: 00:00:00.000", "Napisy do odtwarzacza webowego, ścieżka w przeglądarce"],
        ["TXT", "3,0 KB", "Tekst ciągiem, bez żadnych czasów", "Chcesz słowa, a nie napisy"],
        ["JSON", "15,2 KB", "Każdy napis plus model i użyte parametry", "Czytać to będzie program, a nie człowiek"],
      ],
      note:
        "SRT i VTT różnią się głównie znakiem między sekundami a milisekundami, więc jeśli odtwarzacz odmówił jednego, drugi to zmiana przepisu, a nie ponowna transkrypcja. JSON waży jakieś trzy razy tyle co SRT, bo obok tekstu niesie dane samego przebiegu.",
    },
    {
      id: "recipes",
      title: "Który przepis do czego",
      lead:
        `Napisy to nie jeden przepis, tylko kilka, a wybranie właściwego oszczędza krok. Wszystkie leżą w katalogu ${FACTS.recipeCount} przepisów.`,
      head: ["Co masz", "Czego chcesz", "Przepis"],
      rows: [
        ["Film", "Napisy obok niego", "Zrób napisy SRT do wideo"],
        ["Plik dźwiękowy", "Napisy", "Przepisz audio na napisy SRT"],
        ["Mowa w obcym języku", "Angielskie napisy w jednym przebiegu", "Przetłumacz mowę na angielskie napisy"],
        ["Cokolwiek z mową", "Sam tekst", "Przepisz audio na tekst"],
        ["Cokolwiek z mową", "Ścieżka do odtwarzacza webowego", "Przepisz audio na WebVTT"],
      ],
      note:
        "Przepis tłumaczący idzie od obcej mowy prosto do angielskich napisów z czasami, w jednym przebiegu — nie trzeba najpierw przepisywać, a potem tłumaczyć. Ale idzie wyłącznie na angielski: to ograniczenie modelu, nie aplikacji.",
    },
  ],

  whyTitle: "Dlaczego robić napisy na własnym komputerze",
  whyBullets: [
    {
      h: "Mowa nie opuszcza twojego dysku.",
      p: "Nagrania narad, wywiadów i rozmów to najbardziej wrażliwy rodzaj plików, z jakim większość ludzi w ogóle ma do czynienia, a transkrypcja online to z definicji kopia tej rozmowy na cudzym serwerze. Tutaj nie ma wysyłki, nad którą trzeba by się zastanawiać.",
    },
    {
      h: "Zero opłat za minutę.",
      p: "Usługi transkrypcji liczą po minutach dźwięku, przez co długie archiwum zamienia się w prawdziwy rachunek. Model pobierasz raz, a potem dwugodzinne nagranie kosztuje tyle samo co dwuminutowe: nic.",
    },
    {
      h: "Działa przy wyłączonej sieci.",
      p: "Gdy plik modelu leży już na dysku, ten przepis nie rusza internetu w ogóle. Działa w samolocie, na zamkniętej maszynie i w sali, w której wi-fi jest najmniej niezawodną obecną rzeczą.",
    },
    {
      h: "Bez limitu długości.",
      p: "Darmowe transkrybatory w przeglądarce zwykle tną po kilku minutach na plik — dokładnie wtedy, gdy nagranie warto przepisać właśnie dlatego, że jest długie. Tutaj sufitu nie ma.",
    },
    {
      h: "Cały folder naraz.",
      p: "Wrzuć katalog nagrań, a kolejka przejdzie po nich po kolei i powie, gdzie zapisał się każdy plik napisów.",
    },
  ],

  notForTitle: "Kiedy to nie jest właściwe narzędzie",
  notForLead:
    "Przepis zapisuje plik napisów. To węższa robota niż „wgranie napisów w film”, i ta różnica ma znaczenie w takich sytuacjach.",
  notFor: [
    {
      h: "Chcesz napisy wypalone w obrazie.",
      p: "Tutaj powstaje osobny .srt, który odtwarzacz wczytuje obok filmu. Wpalenie tekstu na stałe w klatki to inna operacja: przekodowuje film, a potem tych słów już się nie wyłączy ani nie poprawi.",
    },
    {
      h: "Potrzebujesz dokładności emisyjnej.",
      p: "Nawet na czystym dźwięku z pomiarów wyżej modele potykały się na kilku słowach, a prawdziwe nagrania są trudniejsze. Wszystko, co publikuje się pod wymogiem dostępności, przed emisją czyta człowiek — niezależnie od tego, co zrobiło brudnopis.",
    },
    {
      h: "Dźwięk jest naprawdę kiepski.",
      p: "Gęste wchodzenie sobie w słowo, sala nagrana telefonem albo muzyka głośniejsza od głosu położą wszystkie cztery modele. Naprawienie najpierw dźwięku — choćby przez wyciągnięcie czystszej ścieżki — daje więcej niż przejście na większy model.",
    },
    {
      h: "Potrzebujesz tłumaczenia na coś innego niż angielski.",
      p: "Whisper tłumaczy na angielski i tylko na niego. Do dowolnego innego języka docelowego najpierw przepisz w oryginale, a powstały tekst przetłumacz narzędziem zrobionym do tego.",
    },
  ],

  faqTitle: "Pytania",
  faq: [
    {
      q: "Czy to jest za darmo?",
      a: `Tak, w całości. MediaChef jest otwartoźródłowy na licencji GPL-3.0: nie ma wersji płatnej, opłat za minutę ani limitu długości pliku. Modele też pobiera się za darmo. Aktualna wersja to ${FACTS.version}.`,
    },
    {
      q: "Czy mój film gdzieś się wysyła?",
      a: "Nie. Mowę przetwarza plik modelu leżący na twoim własnym dysku. Przez sieć przechodzi wyłącznie jednorazowe pobranie modelu, a potem przepis działa przy wyłączonym internecie.",
    },
    {
      q: "Ile to trwa?",
      a: "Jakieś 26 razy szybciej niż w czasie rzeczywistym na modelu domyślnym: zmierzyliśmy 6,2 sekundy na 2 minuty 43 sekundy mowy, laptop z M5. W tej proporcji godzinne nagranie schodzi w kilka minut. Na tym samym dźwięku tiny dał ×78, a large-v3-turbo ×14.",
    },
    {
      q: "Który model wybrać?",
      a: "Zacznij od small, który stoi domyślnie. W naszych pomiarach nie pomylił w testowym dźwięku ani jednego słowa i dał najczytelniejsze linijki — 39 znaków średnio wobec 97 u large-v3-turbo. Wyżej wchodź tylko wtedy, gdy dźwięk jest trudny; schodź do tiny albo base, jeśli chcesz brudnopis w kilka sekund.",
    },
    {
      q: "Ile waży model?",
      a: "78 MB tiny, 148 MB base, 488 MB small i 1,62 GB large-v3-turbo. Pobranie jest jednorazowe. Potem plik leży na dysku i każdy kolejny przebieg bierze go bez pytania.",
    },
    {
      q: "Czy muszę podawać język mowy?",
      a: "Nie. Język stoi na automatycznym i model sam go rozpoznaje po dźwięku. Można go jednak wskazać wprost i warto to zrobić, gdy nagranie otwiera się kilkoma zdaniami w innym języku.",
    },
    {
      q: "Czy potrafi przetłumaczyć napisy na angielski?",
      a: "Tak, przepisem „Przetłumacz mowę na angielskie napisy”: na wejściu obca mowa, na wyjściu angielski SRT z czasami, w jednym przebiegu zamiast „najpierw przepisz, potem przetłumacz”. Angielski to jedyny język docelowy, jaki obsługuje model.",
    },
    {
      q: "Czym różni się SRT od VTT?",
      a: "Głównie interpunkcją w czasach: SRT pisze 00:00:00,000 z przecinkiem i numeruje napisy, VTT pisze 00:00:00.000 z kropką i zaczyna się wierszem WEBVTT. SRT to czego oczekują odtwarzacze i montażówki; VTT to czego chce odtwarzacz webowy dla własnej ścieżki napisów. To osobne przepisy, więc zmiana formatu to ponowny przebieg, a nie przepisywanie pliku.",
    },
    {
      q: "Czy napisy da się potem poprawić?",
      a: "Da się — .srt to zwykły tekst. Otwórz w dowolnym edytorze i popraw nazwisko, żargon albo czas. Tak się właśnie normalnie pracuje: model robi dziewięćdziesiąt kilka procent, resztę dociągasz ręcznie.",
    },
    {
      q: "Dlaczego moje linijki są za długie?",
      a: "Bo to model decyduje, gdzie ciąć, a większe modele tną rzadziej. Zmierzyliśmy 39 znaków na napis przy small wobec 97 przy large-v3-turbo, na tym samym dźwięku. Jeśli linijki ci się rozłażą, powrót na small zwykle to naprawia — a przy czystej mowie nic nie kosztuje w trafności.",
    },
    {
      q: "Czy rozróżnia mówiących?",
      a: "Nie. Whisper zapisuje, co zostało powiedziane, a nie kto to powiedział. Jeśli potrzebujesz oznaczeń „Mówca 1 / Mówca 2”, wstawisz je ręcznie albo weźmiesz narzędzie zrobione właśnie do tego.",
    },
    {
      q: "Co się stanie, jeśli w pliku nie ma mowy?",
      a: "Przebieg zatrzyma się i powie, że nie usłyszał nic zrozumiałego, zamiast po cichu zapisać pusty plik. Cisza nie daje napisów — i tak ma być.",
    },
    {
      q: "Czy działa na Windowsie i Linuksie?",
      a: "Na wszystkich trzech systemach. Mowa liczy się wszędzie na procesorze, a na Apple Silicon dodatkowo na układzie graficznym — stąd te szybkie liczby wyżej. Ten sam przepis na skromnym laptopie z Windowsem będzie wolniejszy, ale wciąż szybszy niż odsłuchanie całego nagrania.",
    },
    {
      q: "Czy mogę zrobić napisy do kilku plików naraz?",
      a: "Tak. Wrzuć cały folder, dodaj przepis, a kolejka przejdzie po nich jeden po drugim. Każdy plik napisów zapisuje się obok własnego źródła.",
    },
    {
      q: "Czy plik wideo się zmienia?",
      a: "Nie. Obok zapisuje się osobny .srt — clip.subs.srt — a film nie jest zmieniany, przemianowywany ani przekodowywany. Ten przepis w ogóle nie rusza obrazu.",
    },
  ],

  ctaTitle: "Zrób napisy do tego filmu",
  ctaSub: `MediaChef ${FACTS.version} — za darmo, otwarty kod, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio na tekst — ten sam silnik, same słowa" },
    { page: "trim", label: "Przytnij wideo — zmierzone i bezstratne" },
    { page: "catalog", label: `Wszystkie ${FACTS.recipeCount} przepisów według kategorii` },
  ],
} as const;
