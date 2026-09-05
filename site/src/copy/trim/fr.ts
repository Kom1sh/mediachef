// Гайд «обрезать видео», французский. Поисковые формулировки: «couper une
// vidéo», «découper une vidéo sans perte». Единицы — Mo и Ko.
import { FACTS } from "../../facts";

export default {
  title: "Découper une vidéo sans réencoder — gratuit, hors ligne, instantané",
  description:
    "Comment extraire un passage d'une vidéo sur votre ordinateur sans toucher à la qualité : le flux est copié, pas recalculé, l'opération se termine donc en centièmes de seconde quelle que soit la durée. À l'intérieur : temps mesurés et la limite des images-clés expliquée honnêtement.",
  h1: "Découper une vidéo sans perte de qualité",
  crumb: "Découper une vidéo",

  answer:
    "Déposez la vidéo dans MediaChef, choisissez « Découper sans réencoder », saisissez le début et la fin au format HH:MM:SS, puis lancez. Le passage apparaît à côté de l'original. Rien n'est recalculé : le flux est copié tel quel, l'image est donc bit pour bit celle d'avant et le travail se termine en centièmes de seconde — 0,03 seconde dans nos mesures, que le passage fasse cinq secondes ou quinze. Le seul bémol est que les coupes ne peuvent tomber que sur une image-clé, ce qui est expliqué plus bas.",

  facts: [
    { k: "Ce qu'il faut", v: `MediaChef ${FACTS.version} — un téléchargement, FFmpeg est déjà dedans` },
    { k: "Fonctionne hors ligne", v: "Oui, entièrement — le réseau n'est jamais sollicité" },
    { k: "Coût en qualité", v: "Aucun. Rien n'est réencodé ; le flux est copié" },
    { k: "Format d'heure", v: "HH:MM:SS. Laissez la fin vide pour couper jusqu'au bout" },
    { k: "Vitesse", v: "Environ 0,03 s, et cela n'augmente pas avec la longueur" },
    { k: "Ce que vous obtenez", v: "clip.trim.mp4 à côté de l'original, qui est conservé" },
  ],

  toc: [
    { id: "how", label: "Comment faire" },
    { id: "speed", label: "À quel point c'est rapide" },
    { id: "keyframes", label: "Pourquoi la coupe se déplace" },
    { id: "changes", label: "Ce qui change et ce qui reste" },
    { id: "format", label: "Comment écrire les heures" },
    { id: "why", label: "Pourquoi chez soi" },
    { id: "notfor", label: "Quand ce n'est pas la bonne recette" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "Comment extraire un passage d'une vidéo",
  steps: [
    {
      h: "Téléchargez MediaChef",
      p: "Un fichier pour macOS, Windows ou Linux. FFmpeg voyage dans le téléchargement : rien à installer à part, rien à ajouter au PATH.",
    },
    {
      h: "Déposez la vidéo sur le plan de travail",
      p: "MediaChef lit le fichier avec ffprobe et ne garde que les recettes qui conviennent. N'importe quelle vidéo reçoit la fiche de découpe, quel que soit le format d'origine.",
    },
    {
      h: "Choisissez « Découper sans réencoder » et saisissez les heures",
      p: "Début et fin au format HH:MM:SS — 00:01:30 fait une minute trente. Si vous laissez la fin vide, le passage va du point de départ jusqu'à la fin du fichier.",
    },
    {
      h: "Lancez et récupérez le passage",
      p: "Le résultat arrive à côté de l'original sous le nom clip.trim.mp4, et l'original reste intact. C'est assez rapide pour que ce soit fini avant que vous ayez détourné le regard.",
    },
  ],
  shotAlt:
    "MediaChef prêt à convertir : le plan de travail attend un fichier vidéo, la file des tâches est à droite.",
  shotCaption: "Le plan de travail où la vidéo arrive. Les recettes apparaissent quand MediaChef a lu le fichier.",

  tables: [
    {
      id: "speed",
      title: "À quel point c'est rapide en réalité",
      lead:
        "Comme rien n'est recalculé, le travail consiste à copier les octets utiles. Le temps ne dépend pas de la longueur du passage — mesuré sur une source 1080p de vingt secondes.",
      head: ["Passage extrait", "Résultat", "Temps"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "À comparer au réencodage de la même source, qui a pris de 1,3 à 2,0 secondes : environ cinquante fois plus, avec une perte de qualité en prime. S'il ne vous faut qu'un extrait, c'est la première recette à essayer.",
    },
    {
      id: "keyframes",
      title: "Pourquoi la coupe se déplace parfois",
      lead:
        "Voici la limite, dite franchement — et la connaître transforme un résultat déroutant en résultat attendu. Une vidéo ne stocke pas chaque image en entier : la plupart ne décrivent que la différence avec la précédente, et la coupe ne peut commencer que sur une image complète, dite image-clé. Demandez un point entre deux, et la coupe démarre à l'image-clé précédente.",
      head: ["Source", "Images-clés à", "Début demandé", "Début réel"],
      rows: [
        ["Images-clés espacées", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — cinq secondes plus tôt"],
        ["Images-clés espacées", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s plus tôt"],
        ["Images-clés serrées", "chaque seconde", "5 s", "5 s — exactement"],
        ["Images-clés serrées", "chaque seconde", "9 s", "9 s — exactement"],
      ],
      note:
        "L'ampleur du décalage est une propriété du fichier, pas de MediaChef : les enregistrements de téléphone et les captures d'écran placent en général une image-clé par seconde, alors que les fichiers exportés pour la diffusion peuvent les espacer de huit secondes ou plus. Si la coupe doit être exacte à l'image, il faut un logiciel de montage, qui réencode pour y arriver.",
    },
    {
      id: "changes",
      title: "Ce qui change et ce qui reste comme avant",
      lead:
        "Presque rien ne change, et c'est tout l'intérêt de cette recette. La liste est courte parce que copier touche à très peu de choses.",
      head: ["Propriété", "Après la découpe", "Remarque"],
      rows: [
        ["Qualité d'image", "Identique", "Les mêmes images encodées sont réécrites. Aucune perte de génération, jamais."],
        ["Codec vidéo", "Inchangé", "H.264 en entrée, H.264 en sortie. Ce qu'utilisait la source est conservé."],
        ["Résolution", "Inchangée", "Utilisez la recette de redimensionnement s'il vous faut moins de pixels."],
        ["Audio", "Copié, non réencodé", "La piste conserve son codec et son débit d'origine."],
        ["Conteneur", "MP4", "Le résultat est écrit en MP4 quel que soit le conteneur d'origine."],
        ["L'original", "Intact", "Un nouveau fichier est écrit à côté ; rien n'est écrasé."],
      ],
    },
    {
      id: "format",
      title: "Comment écrire les heures",
      lead:
        "Les deux champs acceptent heures, minutes et secondes séparées par des deux-points. C'est le champ de fin qui suscite le plus de questions.",
      head: ["Ce que vous voulez", "Début", "Fin"],
      rows: [
        ["Les trente premières secondes", "00:00:00", "00:00:30"],
        ["De 1:30 jusqu'à la fin du fichier", "00:01:30", "laisser vide"],
        ["Une minute au milieu d'un long enregistrement", "01:12:00", "01:13:00"],
        ["La dernière partie, à partir de 2:05", "00:02:05", "laisser vide"],
      ],
      note:
        "La fin est une position sur la ligne de temps, pas une durée : pour dix secondes à partir de la première minute, écrivez 00:01:00 et 00:01:10, pas 00:00:10.",
    },
  ],

  whyTitle: "Pourquoi découper sur son propre ordinateur",
  whyBullets: [
    {
      h: "Rien n'est envoyé.",
      p: "Découper est en général la première chose qu'on fait à des rushes, c'est-à-dire précisément aux images qu'on n'a montrées à personne. Elles restent sur votre disque.",
    },
    {
      h: "Aucune attente.",
      p: "Un outil web doit recevoir le fichier entier avant d'en extraire dix secondes. Ici le travail est fini en centièmes de seconde, sur un fichier de n'importe quelle taille.",
    },
    {
      h: "Aucun coût en qualité.",
      p: "La plupart des découpeurs en ligne réencodent, chaque coupe vous coûte donc une génération. Copier le flux ne coûte rien, et vous pouvez découper le même fichier autant de fois que vous voulez.",
    },
    {
      h: "Aucune limite de taille.",
      p: "Un enregistrement de deux heures ne pose pas de problème ici, et c'est exactement la taille que les outils web refusent.",
    },
    {
      h: "Plusieurs à la fois.",
      p: "Déposez un dossier entier : la file les traite et vous dit où chaque passage a été écrit.",
    },
  ],

  notForTitle: "Quand ce n'est pas la bonne recette",
  notForLead:
    "Copier le flux est ce qui rend cette recette rapide et sans perte, et c'est aussi ce qui la limite. Voici les cas où autre chose convient mieux.",
  notFor: [
    {
      h: "La coupe doit tomber sur une image précise.",
      p: "Comme mesuré plus haut, le début recule jusqu'à l'image-clé la plus proche, ce qui représente plusieurs secondes sur certains fichiers. Une coupe exacte à l'image exige un réencodage, c'est le travail d'un logiciel de montage.",
    },
    {
      h: "Vous voulez retirer un morceau au milieu.",
      p: "Cette recette extrait un passage continu. Retirer une section centrale revient à produire deux passages et à les joindre, ce qui relève du montage et non de la découpe.",
    },
    {
      h: "Vous allez le compresser de toute façon.",
      p: "Alors découpez d'abord et compressez ensuite : cet ordre coûte un réencodage au lieu de deux, et la découpe elle-même reste gratuite.",
    },
    {
      h: "Il vous faut un autre format au bout.",
      p: "La sortie est du MP4 avec les flux d'origine dedans. S'il vous faut du WebM, un GIF ou seulement l'audio, prenez la recette correspondante : celles-là réencodent par nature.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "La découpe fait-elle perdre de la qualité ?",
      a: "Non, aucune. Les images encodées sont recopiées sans être touchées, l'image du passage est donc bit pour bit celle de l'original. C'est la différence avec la plupart des découpeurs en ligne, qui réencodent et coûtent une génération de qualité à chaque coupe.",
    },
    {
      q: "Pourquoi ma coupe a-t-elle commencé plus tôt que demandé ?",
      a: "Parce qu'une coupe ne peut commencer que sur une image-clé — une image stockée entière — et votre fichier n'en avait pas au point demandé. Nous l'avons mesuré : sur un fichier avec une image-clé toutes les 8,33 secondes, demander à commencer à 5 secondes a produit un passage commençant à 0. Sur un fichier avec une image-clé par seconde, la même demande est tombée juste. C'est une propriété du fichier, pas de l'application.",
    },
    {
      q: "Comment obtenir une coupe exacte à l'image ?",
      a: "C'est impossible sans réencoder : l'image que vous visez n'existe pas comme image complète dans le fichier. Si l'exactitude compte plus que la vitesse et la qualité, utilisez un logiciel de montage, qui décode et réencode pour vous donner n'importe quelle image.",
    },
    {
      q: "Combien de temps cela prend-il ?",
      a: "Environ 0,03 seconde dans nos mesures, et cela n'augmente pas avec la longueur du passage : cinq secondes et quinze secondes ont pris le même temps. Réencoder la même source a pris de 1,3 à 2,0 secondes, soit environ cinquante fois plus.",
    },
    {
      q: "Comment écrire le début et la fin ?",
      a: "Au format HH:MM:SS — heures, minutes, secondes. 00:01:30 fait une minute trente. La fin est une position, pas une durée : pour dix secondes à partir de la première minute, écrivez 00:01:00 et 00:01:10.",
    },
    {
      q: "Que se passe-t-il si je laisse la fin vide ?",
      a: "Le passage va de votre point de départ jusqu'à la fin du fichier. C'est le moyen le plus rapide de couper une longue queue — un enregistrement qui a continué après la fin de la réunion, par exemple.",
    },
    {
      q: "Puis-je retirer un morceau au milieu et garder le reste ?",
      a: "Pas en une étape. Cette recette produit un passage continu. Retirer une section centrale revient à faire deux passages et à les joindre, ce qui est un travail de montage et non de découpe.",
    },
    {
      q: "Le fichier d'origine est-il modifié ?",
      a: "Non. Le passage est écrit à côté sous le nom clip.trim.mp4, et la source n'est ni modifiée, ni renommée, ni supprimée. Vous pouvez extraire plusieurs passages différents du même fichier à la suite.",
    },
    {
      q: "Qu'advient-il du son ?",
      a: "Il est copié avec l'image, en conservant son codec et son débit d'origine. Aucune des deux pistes n'est réencodée.",
    },
    {
      q: "Y a-t-il une limite de durée ou de taille ?",
      a: "Non. MediaChef n'en fixe aucune, et comme le travail est une copie et non un calcul, un fichier de deux heures ne se découpe pas plus lentement qu'un de deux minutes. La limite est l'espace disque libre, que l'application vérifie avant de démarrer.",
    },
    {
      q: "Quels formats puis-je découper ?",
      a: "Tout ce que FFmpeg sait lire : MP4, MKV, MOV, WebM, AVI, TS et les autres. Le résultat est écrit en MP4 avec les flux vidéo et audio d'origine à l'intérieur.",
    },
    {
      q: "Puis-je découper plusieurs vidéos d'un coup ?",
      a: "Oui, mais toutes reçoivent le même début et la même fin. Déposez-les toutes sur le plan de travail, ajoutez la recette, et la file les traitera l'une après l'autre.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui, entièrement. FFmpeg voyage dans le téléchargement, donc découper ne touche jamais au réseau. Seule la transcription a besoin d'un téléchargement de modèle unique, et c'est une autre recette.",
    },
    {
      q: "Y a-t-il un filigrane ou une version payante ?",
      a: "Non. MediaChef est open source sous GPL-3.0, sans version payante, et comme rien n'est réencodé, il n'y aurait même pas où ajouter un filigrane.",
    },
    {
      q: "Est-ce que ça tourne sur Windows et Linux ?",
      a: "Sur les trois plateformes. Il y a un installateur pour Windows, un AppImage et un .deb pour Linux, et un DMG pour macOS sur Apple Silicon. La recette se comporte identiquement partout.",
    },
  ],

  ctaTitle: "Extrayez ce passage",
  ctaSub: `MediaChef ${FACTS.version} — gratuit, open source, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Compresser une vidéo — tailles et débits mesurés" },
    { page: "gif", label: "Vidéo en GIF — tailles mesurées pour chaque réglage" },
    { page: "catalog", label: `Les ${FACTS.recipeCount} recettes, par catégorie` },
  ],
} as const;
