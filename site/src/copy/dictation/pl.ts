// Гайд «голосовой ввод», польский. Реальные запросы: «dyktowanie głosem mac»,
// «mowa na tekst offline», «pisanie głosem».
import { FACTS } from "../../facts";

export default {
  title: "Dyktowanie głosem na Macu — offline, darmowo, bez opłat za minutę",
  description:
    "Naciśnij skrót gdziekolwiek, powiedz — i słowa pojawiają się tam, gdzie stoi kursor. Rozpoznawanie idzie na twoim własnym komputerze przez Whisper: nic się nie wysyła, nic się nie tarafikuje. W środku: zmierzone opóźnienie, rozmiary modeli i jedno uprawnienie, które będzie potrzebne.",
  h1: "Pisanie głosem, które nie opuszcza komputera",
  crumb: "Dyktowanie głosem",

  answer:
    "Naciśnij prawy ⌥ gdziekolwiek na Macu, powiedz zdanie, naciśnij ponownie — a tekst wpisze się prosto w to pole, w którym stoi kursor: w terminalu, w czacie, w formularzu przeglądarki. Rozpoznaje ten sam Whisper, który MediaChef już ze sobą nosi, więc dźwięk nie opuszcza twojego dysku i nikt nie liczy minut. W naszym pomiarze pięciosekundowe zdanie wróciło w 780 milisekund.",

  facts: [
    { k: "Stan", v: "W wydaniu od wersji 0.8.0, na razie tylko macOS" },
    { k: "Gdzie działa", v: "Całkowicie na twoim komputerze, bez konta i bez wysyłki" },
    { k: "Szybkość", v: "780 ms od klawisza do tekstu na pięciosekundowym zdaniu (pomiar)" },
    { k: "Ile kosztuje", v: "Nic. Ani subskrypcji, ani opłat za minutę" },
    { k: "Platforma", v: "Najpierw macOS; Windows i Linux potem" },
    { k: "Jednorazowe pobranie", v: "Model mowy, 488 MB w domyślnym" },
  ],

  toc: [
    { id: "how", label: "Jak to działa" },
    { id: "speed", label: "Jak szybko działa" },
    { id: "models", label: "Który model wziąć" },
    { id: "dictionary", label: "Jak nauczyć go twoich słów" },
    { id: "delivery", label: "Dokąd trafia tekst" },
    { id: "why", label: "Dlaczego lokalnie" },
    { id: "notfor", label: "Kiedy nie pomoże" },
    { id: "faq", label: "Pytania" },
  ],

  stepsTitle: "Jak działa dyktowanie",
  steps: [
    {
      h: "Włączyć raz",
      p: "Na karcie Dyktowanie jest przełącznik i wyzwalacz do wyboru: prawy ⌥, prawy ⌘ albo jedna z dwu kombinacji. Dopóki nie włączysz, MediaChef nie rejestruje żadnego skrótu globalnego: program, który po cichu zabiera systemowe skróty, to program, który psuje inne programy.",
    },
    {
      h: "Nacisnąć skrót gdziekolwiek",
      p: "Działa, gdy MediaChef jest w tle albo jego okno jest zamknięte. Dwa sposoby: trzymać klawisz, kiedy mówisz, albo nacisnąć raz na start i drugi raz na stop — zależnie od długości myśli.",
    },
    {
      h: "Powiedzieć",
      p: "Mikrofon otwiera się tylko na czas dyktowania, więc pomarańczowa kropka na pasku menu gaśnie w chwili, gdy skończysz. Między naciśnięciami nikt nie słucha.",
    },
    {
      h: "Tekst pojawia się tam, gdzie kursor",
      p: "Wpisywany prosto w aktywne pole, bez ruszania schowka. Jeśli wolisz odwrotnie, żeby trafiał do schowka — to ustawienie obok.",
    },
  ],
  shotAlt:
    "MediaChef gotowy do konwersji: blat czeka na plik wideo, po prawej kolejka zadań.",
  shotCaption: "Karta Dyktowanie w MediaChef: wyzwalacz, modele, język, słownik i stan uprawnienia — wszystko w jednym miejscu.",

  tables: [
    {
      id: "speed",
      title: "Jak szybko działa naprawdę",
      lead:
        "Pomiar od końca do końca na laptopie z M5: od puszczenia klawisza do dostarczonego tekstu. Pierwszy wiersz to prawdziwe dyktowanie z żywej sesji, pozostałe — stałe piętnastosekundowe zdanie przepuszczone przez każdy model.",
      head: ["Co mierzono", "Model", "Czas"],
      rows: [
        ["Prawdziwe pięciosekundowe zdanie, od klawisza do wpisanego tekstu", "small", "780 ms"],
        ["Zdanie na piętnaście sekund", "tiny", "nie mierzone osobno"],
        ["Zdanie na piętnaście sekund", "small", "0,66–0,75 s"],
        ["Zdanie na piętnaście sekund", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Te liczby ukrywają dwie rzeczy i obie warto znać. Mikrofon oddaje pierwszą próbkę po 56 milisekundach, więc słowo zaczęte w tej samej chwili co naciśnięcie może zostać przycięte — w praktyce mówi się po klawiszu i nikt tego nie zauważa. A najpierwsze dyktowanie po wydaniu uprawnienia do mikrofonu przepada: system spędza wtedy około 1,8 sekundy na pokazywaniu swojego okienka. Naciśnij ponownie i działa.",
    },
    {
      id: "models",
      title: "Który model wziąć",
      lead:
        "Te same cztery modele, których używają przepisy transkrypcji — więc jeśli już przepisujesz pliki w MediaChefie, model leży na twoim dysku i dyktowanie nie kosztuje żadnego pobierania.",
      head: ["Model", "Pobranie", "Charakter"],
      rows: [
        ["tiny", "78 MB", "Najszybszy, zgrubny — na notatkę dla siebie wystarczy"],
        ["base", "148 MB", "Szybki, przyzwoity"],
        ["small — domyślny", "488 MB", "Równowaga, i to, czego już używają przepisy"],
        ["large-v3-turbo", "1,62 GB", "Najlepsza jakość, około dwa razy dłuższe czekanie"],
      ],
      note:
        "Zacznij od small. Jest domyślny z powodu praktycznego, a nie technicznego: to ten sam model, którego używają przepisy, więc u istniejącego użytkownika dyktowanie zadziała bez pobierania czegokolwiek. Przejdź na large-v3-turbo, jeśli twój dźwięk jest trudny — mocny akcent, hałaśliwa sala, dwa języki w jednym zdaniu — i przyjmij mniej więcej dwukrotne czekanie na zdanie.",
    },
    {
      id: "dictionary",
      title: "Jak nauczyć go twoich słów",
      lead:
        "Każdy fach ma słowa, które rozpoznawanie kaleczy: nazwy produktów, żargon, nazwisko kolegi. Taką listę można oddać modelowi i przestaje zgadywać. Poniżej to samo nagranie bez słownika i ze słownikiem czterdziestu terminów.",
      head: ["Bez słownika", "Ze słownikiem"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "Kosztowało 0,04 sekundy: 0,87 wobec 0,83 na tym samym fragmencie. Pułap to około 224 tokenów, czyli mniej więcej 400 znaków cyrylicy albo trzy razy tyle alfabetu łacińskiego; MediaChef liczy za ciebie i przycina, bo Whisper zbyt długą listę obcina po cichu. To właśnie tego nie umie wbudowane dyktowanie macOS: nie da się go nauczyć twojego słownictwa.",
    },
    {
      id: "delivery",
      title: "Dokąd trafia tekst",
      lead:
        "Dwie możliwości, a różnica waży więcej, niż brzmi, kiedy dyktuje się kilka razy na godzinę.",
      head: ["Ustawienie", "Co się dzieje", "Czego wymaga"],
      rows: [
        ["Wpisz", "Słowa pojawiają się w aktywnym polu. Twój schowek zostaje nietknięty", "Uprawnienie Dostępność, raz"],
        ["Do schowka", "Tekst zostaje skopiowany, a ty wklejasz go ⌘V", "Niczego poza mikrofonem"],
      ],
      note:
        "Wpisywanie zostawia schowek w spokoju i właśnie dlatego warto je wybrać: gdyby każde dyktowanie go nadpisywało, nie dałoby się trzymać tam odnośnika podczas pracy. macOS uznaje pisanie w cudzym programie za wejście syntetyczne i prosi o uprawnienie Dostępność — pierwsza próba sama otworzy właściwą sekcję Ustawień systemowych. Gdy uprawnienia brakuje, tekst i tak trafia do schowka: dyktowanie nigdy nie przepada.",
    },
  ],

  whyTitle: "Dlaczego robienie tego lokalnie to cała rzecz",
  whyBullets: [
    {
      h: "Twój głos nie jest wysyłany.",
      p: "Dyktuje się właśnie to, czego nie wklejałoby się w formularz w przeglądarce: myśli w połowie, nazwiska klientów, zdanie, które właśnie zamierzasz wysłać. Dyktowanie w chmurze to z definicji kopia wszystkiego tego na cudzym serwerze.",
    },
    {
      h: "Bez licznika minut.",
      p: "Usługi transkrypcji liczą po minutach, a to każe myśleć, zanim się powie. Tu model pobiera się raz, a setne dyktowanie w ciągu dnia kosztuje dokładnie tyle, ile pierwsze.",
    },
    {
      h: "Działa przy wyłączonej sieci.",
      p: "W samolocie, na zamkniętej maszynie, w sali, gdzie wi-fi jest najmniej niezawodną obecną rzeczą. Gdy model leży na dysku, dyktowanie nie rusza internetu.",
    },
    {
      h: "Uczy się twojego słownictwa.",
      p: "Słownik to prosta lista twoich słów i to jedyna rzecz, której wbudowane w macOS dyktowanie nie potrafi.",
    },
    {
      h: "Otwarty kod, bez subskrypcji.",
      p: "GPL-3.0, wszystko do przeczytania na GitHubie. Płatne narzędzia w tej niszy biorą miesięcznie za to, co pod spodem jest tym samym otwartym modelem.",
    },
  ],

  notForTitle: "Kiedy nie pomoże",
  notForLead:
    "Mówimy wprost, bo dowiedzieć się później jest gorzej niż przeczytać teraz.",
  notFor: [
    {
      h: "Nie masz Maca.",
      p: "macOS jest pierwszy, bo tam wszystko powstało i było sprawdzane. Windows i Linux idą dalej: silnik rozpoznawania jest już wieloplatformowy, roboty na platformę wymagają skrót i samo wpisywanie tekstu.",
    },
    {
      h: "Potrzebujesz pisania na bieżąco.",
      p: "Tekst trafia do pola, gdy skończysz, a nie słowo po słowie w trakcie mówienia: tak fraza jest rozpoznawana w całości i dokładniej. Gdy mówisz, szkic rozpoznania widać w panelu pod notchem — ale wpisywany jest jeden czysty wynik, nie ciąg poprawek.",
    },
    {
      h: "Potrzebujesz rozdzielenia mówiących.",
      p: "Zapisuje, co powiedziano, a nie kto powiedział. Do wywiadu na dwa głosy potrzebne jest narzędzie transkrypcji zrobione do tego, a nie skrót dyktowania.",
    },
  ],

  faqTitle: "Pytania",
  faq: [
    {
      q: "Czy mój głos jest gdzieś wysyłany?",
      a: "Nie. Dźwięk rozpoznaje plik modelu leżący na twoim własnym dysku i jest usuwany razem z katalogiem tymczasowym, w którym żył. Przez sieć przechodzi wyłącznie jednorazowe pobranie modelu; potem dyktowanie działa przy całkowicie wyłączonej sieci.",
    },
    {
      q: "Jak szybko to działa?",
      a: "780 milisekund od puszczenia klawisza do pojawienia się tekstu, zmierzone na prawdziwym pięciosekundowym zdaniu z modelem domyślnym na laptopie z M5. Piętnastosekundowe zdanie zajęło 0,66–0,75 sekundy. Ciężki large-v3-turbo trwa około dwa razy dłużej.",
    },
    {
      q: "Czy działa w dowolnym programie?",
      a: "Tak: skrót jest zarejestrowany dla całego systemu, więc odpala się w terminalu, w przeglądarce, w komunikatorze czy w edytorze — z MediaChefem w tle albo nawet z zamkniętym oknem.",
    },
    {
      q: "Jakiej kombinacji używa?",
      a: "Domyślnie prawy ⌥ — sam modyfikator: trzymaj i mów albo naciśnij raz, by zacząć, i jeszcze raz, by skończyć; z Shiftem tekst zostanie wysłany Enterem. Sam modyfikator nic nie wpisuje i z niczym nie koliduje. Kombinacje takie jak ⌥ Space w trybie trzymania wpisywały spację, gdy ⌥ puszczano wcześniej — dlatego zniknęły; ⌃⌥ Space i ⌃⌥ D zostają jako zapasowe.",
    },
    {
      q: "Po co mu uprawnienie Dostępność?",
      a: "Do dwóch rzeczy. Żeby słyszeć klawisz wyzwalający: samego modyfikatora nie da się zarejestrować jako zwykłego skrótu, więc MediaChef sam nasłuchuje klawiatury, a macOS pozwala na to tylko z uprawnieniem Dostępność. I żeby wpisywać tekst do okna innej aplikacji, co system traktuje jako syntetyczne wejście. Jedno uprawnienie obejmuje oba, nadaje się raz; potem uruchom aplikację ponownie.",
    },
    {
      q: "A jeśli nie dam?",
      a: "Tekst pójdzie do schowka, a powiadomienie powie dlaczego, z otwartą już właściwą sekcją Ustawień systemowych. Nic z podyktowanego nigdy nie ginie z powodu brakującego uprawnienia.",
    },
    {
      q: "Ile miejsca na dysku potrzebuje?",
      a: "Program plus jeden model mowy: 488 MB w domyślnym, 78 MB jeśli wybierzesz najmniejszy, 1,62 GB w największym. Jeśli już używasz MediaChefa do przepisywania plików, model masz na dysku i dyktowanie nie dodaje nic.",
    },
    {
      q: "Rozumie polski, albo dwa języki naraz?",
      a: "Whisper obsługuje 99 języków, a ty możesz albo wskazać swój, albo pozwolić mu go rozpoznać. Mieszanie języków w jednym zdaniu to właśnie ten przypadek, w którym ciężki model odpracowuje swój rozmiar i w którym słownik pomaga najbardziej.",
    },
    {
      q: "Jak długie może być jedno dyktowanie?",
      a: "Pięć minut, potem zatrzymuje się samo i przepisuje to, co usłyszało, zamiast wyrzucać. W praktyce dyktuje się zdaniami, nie monologami.",
    },
    {
      q: "Da się przerwać w połowie zdania?",
      a: "Escape podczas nagrywania wyrzuca ujęcie i nie dostarcza nic. Jest rejestrowany tylko na czas dyktowania, więc nie przeszkadza Escape'owi w żadnym innym miejscu.",
    },
    {
      q: "Czy zastępuje wbudowane dyktowanie macOS?",
      a: "Robi tę samą pracę z dwiema różnicami, które mają znaczenie: temu można wyłożyć twoje słownictwo, a dźwięk zostaje na twojej maszynie. Jeśli żadna z nich cię nie dotyczy, wbudowane już tam jest i też jest darmowe.",
    },
    {
      q: "Naprawdę darmowe?",
      a: `Tak. MediaChef jest otwartoźródłowy na licencji GPL-3.0, bez wersji płatnej i bez subskrypcji — dyktowanie także. Wydana wersja to ${FACTS.version}, dyktowanie w niej jest.`,
    },
    {
      q: "Dlaczego panel pokazuje inny tekst niż ten, który zostaje wpisany?",
      a: "To dwa osobne przebiegi. Gdy mówisz, panel pokazuje szkic tworzony przez lekki model co półtorej sekundy, żeby nadążyć za mową. Wpisywany jest wynik końcowy modelu głównego z całego nagrania, z twoim słownikiem terminów. Oba modele wybiera się na karcie Dyktowanie: ustaw w podglądzie ten sam model co główny i różnica zniknie — kosztem opóźnienia panelu.",
    },
    {
      q: "Dlaczego po aktualizacji znów prosi o uprawnienia?",
      a: "macOS wiąże uprawnienie z podpisem aplikacji, nie z jej nazwą. MediaChef nie ma certyfikatu Apple — nie będziemy za niego płacić — więc każda wersja jest podpisana inaczej i system traktuje zaktualizowaną aplikację jak nową. Aplikacja sama usuwa nieaktualny wpis i prosi o uprawnienie ponownie: jeden przełącznik i jedno „Zezwól” na aktualizację.",
    },
    {
      q: "Przełącznik w Ustawieniach systemowych jest włączony, a dyktowanie nie działa.",
      a: "To znaczy, że ten wpis należy do poprzedniej kopii aplikacji — tak właśnie bywa po aktualizacji. Wyłączenie i włączenie go z powrotem nic nie zmienia, sprawdziliśmy. MediaChef sam czyści ten wpis i wywołuje pytanie systemu: włącz go na liście i uruchom aplikację ponownie.",
    },
    {
      q: "Nagranie wyszło puste, choć mikrofon działa.",
      a: "Najczęściej winny jest zestaw słuchawkowy: AirPodsy w etui pozostają połączone i pozostają wejściem domyślnym, a macOS oddaje z nich równe zera — każdej aplikacji, nie tylko naszej. Powiadomienie podaje urządzenie, z którego przyszła cisza. Założ słuchawki albo wybierz mikrofon wprost na karcie Dyktowanie.",
    },
    {
      q: "Czy mogę wybrać konkretny mikrofon?",
      a: "Tak: karta Dyktowanie wypisuje urządzenia wejściowe. „Jak system” to ostatnio podłączony zestaw słuchawkowy, a nie mikrofon laptopa — i właśnie dlatego jawny wybór jest pewniejszy.",
    },
    {
      q: "Co się stanie, jeśli nacisnę wyzwalacz i nic nie powiem?",
      a: "Nic nie zostanie wpisane. Puste nagranie nawet nie dociera do rozpoznawania: Whisper nie milczy wobec ciszy, tylko wymyśla — model rosyjski wpisywał napisy końcowe. Takie podpisy autorów napisów są rozpoznawane i traktowane jak cisza, a ty dostajesz „nie słychać mowy”.",
    },
    {
      q: "Dlaczego pierwsze naciśnięcie po uruchomieniu jest wolniejsze?",
      a: "Budzi się podsystem audio macOS: do dwóch sekund przy pierwszym otwarciu mikrofonu w danym uruchomieniu. Panel pojawia się od razu, jeszcze przed startem nagrywania, więc trzymaj klawisz, aż napisze, że słucha. Potem otwarcie zajmuje dziesiątki milisekund.",
    },
    {
      q: "Jak wysłać wiadomość głosem bez naciskania Enter?",
      a: "Naciśnij wyzwalacz razem z Shiftem: tekst zostanie wpisany, a Enter naciśnie się sam. Puste dyktowanie nigdy nie naciska Entera — inaczej milczenie wysłałoby pustą wiadomość albo wykonało poprzednie polecenie w terminalu.",
    },
    {
      q: "Co się stanie, jeśli nacisnę inny klawisz, trzymając wyzwalacz?",
      a: "Nagranie zostanie anulowane i nic nie zostanie wpisane. Prawy ⌥ z literą to czyjś skrót klawiaturowy, a nie dyktowanie, i program tak to rozumie.",
    },
    {
      q: "Czy to, co dyktuję, zapisuje się na dysku?",
      a: "Nie. Nagranie żyje w folderze tymczasowym i znika razem z nim, a przechowywanie historii transkrypcji jest domyślnie wyłączone. Aplikacja obiecuje, że twoje treści nie opuszczają komputera; zapisywanie na nim wszystkiego, co dyktujesz, otwartym tekstem źle by z tym współgrało — ludzie dyktują hasła i fragmenty prywatnych rozmów.",
    },
    {
      q: "Czy działa nad aplikacjami na pełnym ekranie?",
      a: "Tak. Panel rysuje się nad okrami na pełnym ekranie i na wszystkich pulpitach — edytory i terminale na pełnym ekranie to dokładnie te miejsca, gdzie się dyktuje.",
    },
    {
      q: "Inna aplikacja już zajmuje wyzwalacz. Co teraz?",
      a: "Karta Dyktowanie oferuje też prawy ⌘ — drugi samotny modyfikator, któremu macOS nie przypisuje własnego działania — oraz dwie zwykłe kombinacje, ⌃⌥ Spacja i ⌃⌥ D, gdyby oba modyfikatory były już zajęte.",
    },
  ],

  ctaTitle: "MediaChef dzisiaj",
  ctaSub: `Wersja ${FACTS.version} — za darmo, otwarty kod, macOS · Windows · Linux. Dyktowanie już w środku.`,
  also: [
    { page: "transcribe", label: "Audio na tekst — ten sam silnik, do plików" },
    { page: "srt", label: "Wideo na napisy SRT — zmierzone i offline" },
    { page: "catalog", label: `Wszystkie ${FACTS.recipeCount} przepisów według kategorii` },
  ],
} as const;
