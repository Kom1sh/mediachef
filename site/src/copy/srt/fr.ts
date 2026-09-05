// Гайд «видео в субтитры», французский. Реальные запросы: «generer des
// sous-titres automatiquement», «video en srt», «sous-titrer une video».
import { FACTS } from "../../facts";

export default {
  title: "Sous-titres SRT depuis une vidéo — gratuit, hors ligne, sur votre machine",
  description:
    "Comment tirer d'une vidéo des sous-titres SRT minutés sans rien envoyer nulle part. Avec des mesures réelles : les quatre modèles Whisper chronométrés côte à côte, la longueur des sous-titres produits et ce que contient vraiment chacun des quatre formats.",
  h1: "Générer des sous-titres SRT depuis une vidéo",
  crumb: "Vidéo en SRT",

  answer:
    "Déposez la vidéo dans MediaChef, choisissez « Créer des sous-titres SRT pour une vidéo », laissez le modèle sur small et la langue sur automatique, puis lancez. Un fichier .srt apparaît à côté de la vidéo, minutage compris. Tout se calcule sur votre machine : la parole ne quitte pas le disque, et une fois le modèle téléchargé la recette fonctionne réseau coupé. Sur un portable M5, 2 minutes 43 secondes de parole ont pris 6,2 secondes avec le modèle par défaut — environ 26 fois plus vite que le temps réel — et ont donné 73 sous-titres de 39 caractères en moyenne, assez courts pour être lus tranquillement.",

  facts: [
    { k: "Ce qu'il faut", v: `MediaChef ${FACTS.version} plus un téléchargement unique du modèle` },
    { k: "Modèle par défaut", v: "small — 488 Mo, téléchargé une fois et conservé" },
    { k: "Vitesse", v: "≈26× le temps réel avec le modèle par défaut (mesuré, M5)" },
    { k: "Fonctionne hors ligne", v: "Oui, dès que le modèle est sur le disque" },
    { k: "Formats", v: "SRT, VTT, TXT simple et JSON — une recette pour chacun" },
    { k: "Ce que vous obtenez", v: "clip.subs.srt à côté de la vidéo, l'original intact" },
  ],

  toc: [
    { id: "how", label: "Comment faire" },
    { id: "models", label: "Quel modèle choisir" },
    { id: "cues", label: "Quelle longueur font les sous-titres" },
    { id: "formats", label: "SRT, VTT, TXT ou JSON" },
    { id: "recipes", label: "Quelle recette pour quel cas" },
    { id: "why", label: "Pourquoi le faire chez soi" },
    { id: "notfor", label: "Quand ce n'est pas le bon outil" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "Comment sous-titrer une vidéo",
  steps: [
    {
      h: "Téléchargez MediaChef",
      p: "Un fichier pour macOS, Windows ou Linux. FFmpeg et le moteur Whisper voyagent tous les deux dans le téléchargement : rien à installer à part, rien à ajouter au PATH.",
    },
    {
      h: "Téléchargez un modèle, une seule fois",
      p: "La première transcription réclame un modèle de parole. Par défaut c'est small, 488 Mo, et c'est avec lui que ces mesures ont été faites ; tiny pèse 78 Mo, base 148 Mo et large-v3-turbo 1,62 Go. Il est récupéré une fois, reste sur le disque, et ensuite la recette ne touche plus au réseau.",
    },
    {
      h: "Déposez la vidéo et choisissez la recette",
      p: "« Créer des sous-titres SRT pour une vidéo » prend la vidéo directement : pas besoin d'en extraire le son au préalable. MediaChef décode la piste dans le mono 16 kHz qu'exige Whisper, dans un dossier temporaire que vous ne verrez jamais.",
    },
    {
      h: "Lancez, puis ouvrez le .srt",
      p: "Le fichier arrive à côté de la vidéo sous le nom clip.subs.srt, sous-titres numérotés et minutage compris. Les lecteurs, les logiciels de montage et les plateformes le lisent tel quel et, comme c'est du texte brut, un nom ou un terme se corrige dans n'importe quel éditeur.",
    },
  ],
  shotAlt:
    "MediaChef prêt à convertir : le plan de travail attend un fichier vidéo, la file des tâches est à droite.",
  shotCaption: "Le plan de travail où la vidéo arrive. Les recettes apparaissent quand MediaChef a lu le fichier.",

  tables: [
    {
      id: "models",
      title: "Quel modèle choisir",
      lead:
        "Quatre modèles, les mêmes 2 minutes 43 secondes de parole, la même machine : un portable M5 avec 16 Go, chaque modèle préchauffé et le meilleur de deux passages retenu.",
      head: ["Modèle", "Téléchargement", "Temps", "Face au temps réel", "Mots ratés"],
      rows: [
        ["tiny", "78 Mo", "2,1 s", "×78", "5 sur 540"],
        ["base", "148 Mo", "2,6 s", "×63", "3 sur 540"],
        ["small — celui par défaut", "488 Mo", "6,2 s", "×26", "0 sur 540"],
        ["large-v3-turbo", "1,62 Go", "11,5 s", "×14", "1 sur 540"],
      ],
      note:
        "Lisez la dernière colonne avec précaution, car l'audio de test est une voix de synthèse lisant un texte préparé : sans accent, sans bruit de fond, sans personne qui parle par-dessus. C'est pourquoi même le plus petit modèle est presque parfait ici, et cela ne ressemble pas à l'enregistrement d'une vraie réunion — sur un son difficile l'écart entre ces modèles se creuse nettement. La colonne du temps, elle, se transpose directement à votre cas. Et voici ce que la comparaison brute masquait : presque tous les écarts étaient des nombres écrits en chiffres au lieu de lettres — large-v3-turbo a écrit « 70 », « 10 », « 50 », « 30 » là où le texte les disait en toutes lettres — ce qui relève de la mise en forme, pas d'une erreur d'écoute.",
    },
    {
      id: "cues",
      title: "Quelle longueur font les sous-titres",
      lead:
        "Un sous-titre techniquement juste reste inutilisable s'il jette vingt mots à l'écran d'un coup. Les modèles découpent la même parole de façons très différentes, et c'est mesuré sur le même passage que plus haut.",
      head: ["Modèle", "Sous-titres", "Durée moyenne", "Caractères en moyenne", "Le plus long"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 caractères"],
        ["base", "35", "4,7 s", "83", "100 caractères"],
        ["small — celui par défaut", "73", "2,2 s", "39", "58 caractères"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 caractères"],
      ],
      note:
        "La règle courante en télévision tourne autour de 42 caractères par ligne sur deux lignes, soit environ 84 caractères à l'écran en même temps. À cette aune, des quatre, seul small tient largement : 39 caractères en moyenne et 58 pour le plus long, tandis que large-v3-turbo dépasse la limite dès un sous-titre ordinaire. Le modèle par défaut n'est donc pas seulement le choix équilibré côté justesse — c'est aussi celui qui découpe la parole en morceaux les plus lisibles.",
    },
    {
      id: "formats",
      title: "SRT, VTT, texte brut ou JSON",
      lead:
        "La même transcription écrite de quatre manières. Les tailles viennent des mêmes 2 minutes 43 secondes de parole, elles se comparent donc directement.",
      head: ["Format", "Taille", "Ce qu'il contient", "Quand le prendre"],
      rows: [
        ["SRT", "5,5 Ko", "Sous-titres numérotés, minutage avec une virgule : 00:00:00,000", "Presque toujours. Lecteurs, montage et plateformes l'acceptent"],
        ["VTT", "5,3 Ko", "En-tête WEBVTT, minutage avec un point : 00:00:00.000", "Sous-titres pour un lecteur web, la piste du navigateur"],
        ["TXT", "3,0 Ko", "Texte au fil de l'eau, aucun minutage", "Vous voulez les mots, pas les sous-titres"],
        ["JSON", "15,2 Ko", "Chaque sous-titre plus le modèle et les paramètres utilisés", "Ce sera lu par un programme, pas par une personne"],
      ],
      note:
        "SRT et VTT diffèrent surtout par le caractère entre les secondes et les millisecondes : si un lecteur refuse l'un, l'autre est un changement de recette et non une nouvelle transcription. Le JSON pèse environ trois fois le SRT parce qu'il transporte les données du passage à côté du texte.",
    },
    {
      id: "recipes",
      title: "Quelle recette pour quel cas",
      lead:
        `Les sous-titres, ce n'est pas une recette mais plusieurs, et choisir la bonne épargne une étape. Elles sont toutes dans le catalogue de ${FACTS.recipeCount} recettes.`,
      head: ["Ce que vous avez", "Ce que vous voulez", "Recette"],
      rows: [
        ["Une vidéo", "Des sous-titres à côté", "Créer des sous-titres SRT pour une vidéo"],
        ["Un fichier audio", "Des sous-titres", "Transcrire l'audio en sous-titres SRT"],
        ["De la parole en langue étrangère", "Des sous-titres anglais en un passage", "Traduire la parole en sous-titres anglais"],
        ["N'importe quoi avec de la parole", "Seulement le texte", "Transcrire l'audio en texte"],
        ["N'importe quoi avec de la parole", "Une piste pour lecteur web", "Transcrire l'audio en WebVTT"],
      ],
      note:
        "La recette de traduction va de la parole étrangère directement à des sous-titres anglais minutés, en un seul passage — pas de « transcrire d'abord, traduire ensuite ». Elle ne va toutefois que vers l'anglais : c'est une limite du modèle, pas de l'application.",
    },
  ],

  whyTitle: "Pourquoi sous-titrer sur sa propre machine",
  whyBullets: [
    {
      h: "La parole ne quitte pas votre disque.",
      p: "Les enregistrements de réunions, d'entretiens et d'appels sont le type de fichier le plus sensible que la plupart des gens manipulent, et une transcription en ligne est par définition une copie de cette conversation sur le serveur de quelqu'un d'autre. Ici, il n'y a pas d'envoi sur lequel réfléchir.",
    },
    {
      h: "Aucun tarif à la minute.",
      p: "Les services de transcription facturent à la minute d'audio, ce qui transforme des archives longues en vraie facture. Le téléchargement du modèle est unique et, ensuite, un enregistrement de deux heures coûte autant qu'un de deux minutes : rien.",
    },
    {
      h: "Ça tourne réseau coupé.",
      p: "Dès que le fichier du modèle est sur le disque, cette recette ne touche plus à internet. Elle fonctionne en avion, sur une machine verrouillée et dans une salle où le wifi est ce qu'il y a de moins fiable.",
    },
    {
      h: "Aucune limite de durée.",
      p: "Les transcripteurs web gratuits vous arrêtent souvent à quelques minutes par fichier, précisément quand un enregistrement mérite d'être transcrit parce qu'il est long. Ici, il n'y a pas de plafond.",
    },
    {
      h: "Un dossier entier d'un coup.",
      p: "Déposez un répertoire d'enregistrements : la file les traite un par un et vous dit où chaque fichier de sous-titres a été écrit.",
    },
  ],

  notForTitle: "Quand ce n'est pas le bon outil",
  notForLead:
    "La recette écrit un fichier de sous-titres. C'est plus étroit que « mettre des sous-titres sur une vidéo », et la différence compte dans ces cas-là.",
  notFor: [
    {
      h: "Vous voulez les sous-titres incrustés dans l'image.",
      p: "Ici on obtient un .srt séparé que le lecteur charge à côté de la vidéo. Graver le texte dans les images est une autre opération : elle réencode la vidéo, et ces mots ne peuvent ensuite plus être coupés ni corrigés.",
    },
    {
      h: "Il vous faut une précision de diffusion.",
      p: "Même sur l'audio propre mesuré plus haut, les modèles ont trébuché sur quelques mots, et les vrais enregistrements sont plus durs. Tout ce qui est publié sous une obligation légale d'accessibilité est relu par un humain avant diffusion, quel que soit l'outil qui a produit le brouillon.",
    },
    {
      h: "L'audio est vraiment mauvais.",
      p: "Des gens qui se coupent la parole, une salle enregistrée au téléphone ou une musique plus forte que la voix mettront les quatre modèles en échec. Réparer le son d'abord — ne serait-ce qu'en extrayant une piste plus propre — rapporte davantage que de monter d'une taille de modèle.",
    },
    {
      h: "Il vous faut une traduction vers autre chose que l'anglais.",
      p: "Whisper traduit vers l'anglais et uniquement vers l'anglais. Pour toute autre langue cible, transcrivez d'abord dans la langue d'origine et traduisez le texte obtenu avec un outil fait pour ça.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Est-ce gratuit ?",
      a: `Oui, entièrement. MediaChef est open source sous GPL-3.0 : pas de version payante, pas de facturation à la minute, pas de plafond de durée. Les modèles se téléchargent gratuitement aussi. La version actuelle est la ${FACTS.version}.`,
    },
    {
      q: "Ma vidéo est-elle envoyée quelque part ?",
      a: "Non. La parole est traitée par un fichier de modèle posé sur votre propre disque. La seule chose qui traverse le réseau est le téléchargement unique du modèle, et ensuite la recette fonctionne internet coupé.",
    },
    {
      q: "Combien de temps cela prend-il ?",
      a: "Environ 26 fois plus vite que le temps réel avec le modèle par défaut : nous avons mesuré 6,2 secondes pour 2 minutes 43 secondes de parole sur un portable M5. À ce rythme, un enregistrement d'une heure passe en deux ou trois minutes. Sur le même audio, tiny a donné ×78 et large-v3-turbo ×14.",
    },
    {
      q: "Quel modèle choisir ?",
      a: "Commencez par small, celui par défaut. Dans nos mesures il n'a manqué aucun mot de l'audio de test et a produit les sous-titres les plus lisibles — 39 caractères en moyenne contre 97 pour large-v3-turbo. Ne montez que si votre audio est difficile ; descendez à tiny ou base si vous voulez un brouillon en deux secondes.",
    },
    {
      q: "Quelle est la taille du modèle ?",
      a: "78 Mo pour tiny, 148 Mo pour base, 488 Mo pour small et 1,62 Go pour large-v3-turbo. Le téléchargement est unique. Ensuite le fichier reste sur le disque et chaque passage suivant l'utilise sans rien demander.",
    },
    {
      q: "Dois-je indiquer la langue parlée ?",
      a: "Non. La langue est sur automatique et le modèle la déduit du son. Vous pouvez tout de même la nommer explicitement, ce qui vaut le coup quand un enregistrement s'ouvre sur quelques phrases dans une autre langue.",
    },
    {
      q: "Peut-il traduire les sous-titres en anglais ?",
      a: "Oui, avec la recette « Traduire la parole en sous-titres anglais » : parole étrangère en entrée, SRT anglais minuté en sortie, en un seul passage plutôt que transcrire puis traduire. L'anglais est la seule langue cible que le modèle prend en charge.",
    },
    {
      q: "Quelle différence entre SRT et VTT ?",
      a: "Surtout la ponctuation du minutage : le SRT écrit 00:00:00,000 avec une virgule et numérote ses sous-titres, le VTT écrit 00:00:00.000 avec un point et commence par une ligne WEBVTT. Le SRT est ce qu'attendent les lecteurs et les logiciels de montage ; le VTT est ce que veut un lecteur web pour sa propre piste de sous-titres. Ce sont deux recettes distinctes, donc changer de format c'est relancer, pas réécrire le fichier.",
    },
    {
      q: "Puis-je modifier les sous-titres ensuite ?",
      a: "Oui — un .srt est du texte brut. Ouvrez-le dans n'importe quel éditeur pour corriger un nom propre, un terme technique ou un minutage. C'est la façon normale de travailler : le modèle fait les quatre-vingt-dix et quelques pour cent, vous reprenez le reste à la main.",
    },
    {
      q: "Pourquoi certains de mes sous-titres sont-ils trop longs ?",
      a: "Parce que c'est le modèle qui décide où couper, et les gros modèles coupent moins souvent. Nous avons mesuré 39 caractères par sous-titre avec small contre 97 avec large-v3-turbo, sur le même audio. Si vos sous-titres s'allongent, redescendre à small règle généralement la question — et sur une parole propre cela ne coûte rien en justesse.",
    },
    {
      q: "Distingue-t-il les locuteurs ?",
      a: "Non. Whisper écrit ce qui a été dit, pas qui l'a dit. S'il vous faut des mentions « Locuteur 1 / Locuteur 2 », vous les ajouterez à la main ou utiliserez un outil fait spécialement pour ça.",
    },
    {
      q: "Que se passe-t-il s'il n'y a pas de parole dans le fichier ?",
      a: "Le passage s'arrête et vous dit qu'il n'a rien entendu d'intelligible, au lieu d'écrire discrètement un fichier vide. Le silence ne produit pas de sous-titres, et c'est voulu.",
    },
    {
      q: "Est-ce que ça marche sur Windows et Linux ?",
      a: "Sur les trois plateformes. La parole est traitée par le processeur partout, et en plus par le GPU sur Apple Silicon, d'où les chiffres rapides ci-dessus. La même recette sur un portable Windows modeste sera plus lente, tout en restant plus rapide que d'écouter l'enregistrement.",
    },
    {
      q: "Puis-je sous-titrer plusieurs fichiers à la fois ?",
      a: "Oui. Déposez un dossier entier, ajoutez la recette, et la file les traite l'un après l'autre. Chaque fichier de sous-titres est écrit à côté de sa propre source.",
    },
    {
      q: "Le fichier vidéo est-il modifié ?",
      a: "Non. Un .srt distinct est écrit à côté — clip.subs.srt — et la vidéo n'est ni modifiée, ni renommée, ni réencodée. Cette recette ne touche pas du tout à l'image.",
    },
  ],

  ctaTitle: "Sous-titrez cette vidéo",
  ctaSub: `MediaChef ${FACTS.version} — gratuit, open source, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio en texte — le même moteur, les mots seuls" },
    { page: "trim", label: "Découper une vidéo — mesuré, et sans perte" },
    { page: "catalog", label: `Les ${FACTS.recipeCount} recettes, par catégorie` },
  ],
} as const;
