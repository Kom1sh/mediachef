// Гайд «видео в GIF», французский. Поисковые формулировки: «convertir une
// vidéo en gif», «transformer une vidéo en gif», «faire un gif».
//
// Единицы — Mo и Ko, а не MB и KB: во французском мегабайт это «mégaoctet».
// Разделитель дробной части — запятая. Перед двоеточием, вопросительным и
// восклицательным знаками — узкий неразрывный пробел, как принято в типографике.
import { FACTS } from "../../facts";

export default {
  title: "Vidéo en GIF — gratuit et hors ligne, sur votre propre ordinateur",
  description:
    "Comment faire un GIF à partir d'une vidéo sur votre ordinateur : choisissez les images par seconde et la largeur, lancez. Rien n'est envoyé, aucune limite de taille, aucun filigrane. À l'intérieur, les tailles mesurées pour chaque réglage.",
  h1: "Vidéo en GIF, sur votre propre ordinateur",
  crumb: "Vidéo en GIF",

  answer:
    "Déposez la vidéo dans MediaChef, choisissez la recette « Vidéo en GIF », réglez les images par seconde et la largeur, puis lancez. Le GIF apparaît à côté du fichier d'origine. Rien n'est envoyé : FFmpeg travaille sur votre machine, il n'y a donc ni plafond de taille ni file d'attente. Avec les réglages par défaut — 15 images par seconde et 480 pixels de large — un GIF coûte environ 130 Ko par seconde de vidéo : dix secondes font à peu près 1,3 Mo.",

  facts: [
    { k: "Ce qu'il faut", v: `MediaChef ${FACTS.version} — un téléchargement, FFmpeg est déjà dedans` },
    { k: "Fonctionne hors ligne", v: "Oui, entièrement — le réseau n'est jamais sollicité" },
    { k: "Ce qu'il accepte", v: "MP4, MKV, MOV, WebM, AVI, TS et tout ce que FFmpeg sait lire" },
    { k: "Réglages", v: "Images/s 10 / 15 / 24 · largeur 320 / 480 / 640 pixels" },
    { k: "Ce que vous obtenez", v: "clip.gif, écrit à côté de la vidéo source" },
    { k: "Prix", v: "Gratuit, open source (GPL-3.0), sans compte et sans filigrane" },
  ],

  toc: [
    { id: "how", label: "Comment faire" },
    { id: "fps", label: "Combien d'images" },
    { id: "width", label: "Quelle largeur" },
    { id: "size", label: "Combien ça pèsera" },
    { id: "duration", label: "L'effet de la durée" },
    { id: "why", label: "Pourquoi chez soi" },
    { id: "notfor", label: "Quand le GIF est une mauvaise idée" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "Comment transformer une vidéo en GIF",
  steps: [
    {
      h: "Téléchargez MediaChef",
      p: "Un fichier pour macOS, Windows ou Linux. FFmpeg voyage dans le téléchargement : rien à installer à part, rien à ajouter au PATH.",
    },
    {
      h: "Déposez la vidéo sur le plan de travail",
      p: "MediaChef lit le fichier avec ffprobe et ne garde que les recettes qui conviennent. La fiche GIF apparaît pour n'importe quelle vidéo ; le format d'origine n'a pas d'importance.",
    },
    {
      h: "Choisissez « Vidéo en GIF »",
      p: "Deux réglages : les images par seconde et la largeur en pixels. La hauteur se calcule d'après la largeur et les proportions sont conservées — un clip 16:9 en 480 de large sort en 480×270.",
    },
    {
      h: "Lancez et récupérez le fichier",
      p: "Le GIF apparaît à côté de la vidéo sous le nom clip.gif. La file montre l'avancement et le chemin final ; déposez plusieurs vidéos d'un coup et elles passeront l'une après l'autre.",
    },
  ],
  shotAlt:
    "MediaChef prêt à convertir : le plan de travail attend un fichier vidéo, la file des tâches est à droite.",
  shotCaption: "Le plan de travail où la vidéo arrive. Les recettes apparaissent quand MediaChef a lu le fichier.",

  tables: [
    {
      id: "fps",
      title: "Combien d'images par seconde choisir",
      lead:
        "Les images par seconde décident de la fluidité du mouvement et, en proportion directe, du poids du fichier. Un GIF garde chaque image presque séparément : deux fois plus d'images, c'est à peu près deux fois plus lourd.",
      head: ["Images/s", "Rendu", "À choisir quand"],
      rows: [
        ["10", "Saccadé sur un mouvement rapide, correct sur un mouvement lent", "Captures d'écran, un curseur qui bouge, du texte qui apparaît. Le fichier le plus léger."],
        ["15", "Assez fluide pour presque tout", "La valeur par défaut. Réactions, scènes courtes, et tout ce dont vous n'êtes pas sûr."],
        ["24", "Comme au cinéma, sans saccade visible", "Mouvement rapide, sport, panoramiques — et seulement si la taille vous convient."],
      ],
      note:
        "Le compte est exact : images = images/s × secondes. Dix secondes à 15 font 150 images ; à 24, elles en font 240.",
    },
    {
      id: "width",
      title: "Quelle largeur choisir",
      lead:
        "Vous fixez la largeur, la hauteur est calculée pour garder les proportions, et le redimensionnement utilise le filtre Lanczos. Dans le tableau, ce que devient une vidéo 16:9.",
      head: ["Largeur", "Le 16:9 devient", "À choisir quand"],
      rows: [
        ["320 px", "320×180", "Messageries et discussions, où le GIF est affiché petit de toute façon. Environ la moitié de 480."],
        ["480 px", "480×270", "La valeur par défaut. Lisible dans un message ou une publication, et encore léger."],
        ["640 px", "640×360", "Quand le détail compte : une démo d'interface, du petit texte à l'écran. Environ 1,5 fois plus que 480."],
      ],
      note:
        "Rien n'est agrandi : si la source fait 320 pixels de large, elle reste à 320 même si vous demandez 640.",
    },
    {
      id: "size",
      title: "Combien le fichier pèsera",
      lead:
        "Mesuré, pas estimé : dix secondes de vidéo 1280×720 avec du mouvement dans toute l'image, passées par cette recette exacte. Une image calme se compresse mieux, une image chargée moins bien — prenez ces valeurs comme la moitié haute de la fourchette.",
      head: ["Images/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 Mo", "0,88 Mo", "1,36 Mo"],
        ["15", "0,65 Mo", "1,28 Mo", "1,98 Mo"],
        ["24", "0,98 Mo", "1,96 Mo", "3,05 Mo"],
      ],
      note:
        "Le réglage le moins cher et le plus cher diffèrent de presque sept fois, et deux clics les séparent. Si le GIF sort trop lourd, baissez d'abord la largeur : à l'œil, cela coûte moins que de perdre des images.",
    },
    {
      id: "duration",
      title: "Comment la durée change la taille",
      lead:
        "La croissance est linéaire, parce que chaque seconde ajoute ses propres images. Avec les réglages par défaut — 15 images, largeur 480 — une seconde coûte environ 130 Ko, et ce chiffre bouge à peine avec la durée.",
      head: ["Durée", "Taille par défaut", "Par seconde"],
      rows: [
        ["3 s", "0,37 Mo", "128 Ko"],
        ["5 s", "0,64 Mo", "131 Ko"],
        ["10 s", "1,28 Mo", "131 Ko"],
        ["20 s", "2,56 Mo", "131 Ko"],
        ["30 s", "3,82 Mo", "130 Ko"],
      ],
      note:
        "La durée est donc votre levier le plus fort : couper un clip de trente secondes à huit divise le fichier par environ quatre, et aucun réglage n'en fait autant.",
    },
  ],

  whyTitle: "Pourquoi convertir sur son propre ordinateur",
  whyBullets: [
    {
      h: "Rien n'est envoyé.",
      p: "Un montage non publié, l'enregistrement d'un appel privé, une capture d'écran avec les données d'un client : rien ne quitte le disque. Aucune copie sur un serveur dont il faudrait croire la politique de conservation.",
    },
    {
      h: "Aucune limite de taille.",
      p: "Les convertisseurs en ligne s'arrêtent entre 100 Mo et 2 Go et vous mettent dans une file. Un enregistrement d'écran de quatre gigaoctets se convertit comme un de quatre mégaoctets.",
    },
    {
      h: "Aucune attente d'envoi.",
      p: "Faire le GIF est rapide ; sur un service web, la partie lente est d'y envoyer la vidéo d'abord. En local, cette étape n'existe pas.",
    },
    {
      h: "Gratuit, sans compte, sans filigrane.",
      p: "Open source sous GPL-3.0 : pas d'inscription, pas de période d'essai, rien d'imprimé dans le coin de votre GIF.",
    },
    {
      h: "Plusieurs à la fois.",
      p: "Déposez un dossier entier de clips : la file les traite et vous dit où chaque GIF a été écrit.",
    },
  ],

  notForTitle: "Quand le GIF est une mauvaise idée",
  notForLead:
    "Le GIF est un format d'image de 1987 qui fait un travail que les formats vidéo font mieux. Il vaut la peine d'être choisi délibérément, et voici les cas où il ne le faut pas.",
  notFor: [
    {
      h: "Vous avez besoin du son.",
      p: "Un GIF n'a aucune piste audio : le format n'a pas où la mettre. Si le clip a besoin de son, laissez-le en vidéo.",
    },
    {
      h: "Vous avez besoin de couleurs fidèles.",
      p: "Une image de GIF contient au maximum 256 couleurs. Les dégradés, les teintes de peau et les scènes sombres se découpent en bandes visibles. C'est le tournage réel qui souffre le plus ; une interface plate ou un dessin animé ne s'en aperçoivent presque pas.",
    },
    {
      h: "Le clip est long.",
      p: "À 130 Ko par seconde, un GIF de deux minutes fait environ 16 Mo. Le même clip en MP4 est généralement plusieurs fois plus petit et plus beau.",
    },
    {
      h: "Il part là où il sera réencodé de toute façon.",
      p: "Plusieurs plateformes de discussion et réseaux transforment de leur côté le GIF envoyé en vidéo. Là, vous avez payé le surcoût de taille du GIF pour rien.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Quelle durée peut faire le GIF ?",
      a: "MediaChef ne fixe aucune limite : la limite, c'est votre disque, et l'application vérifie l'espace libre avant de démarrer. La limite pratique est la taille : avec les réglages par défaut chaque seconde coûte environ 130 Ko, donc un GIF d'une minute fait à peu près 8 Mo et un de cinq minutes environ 39 Mo. S'il part dans un message, coupez d'abord le clip.",
    },
    {
      q: "Pourquoi mon GIF est-il plus lourd que la vidéo d'origine ?",
      a: "Parce que le GIF garde les images presque séparément, alors que le MP4 garde la différence entre elles. Sur du vrai tournage, cela rend le MP4 plusieurs fois plus petit à image égale. Ce n'est pas quelque chose que MediaChef peut corriger : c'est ce qu'est le format.",
    },
    {
      q: "Un GIF a-t-il du son ?",
      a: "Non. Le format GIF n'a pas de piste audio, le son est donc abandonné à la conversion. Si vous voulez le son comme fichier séparé, appliquez la recette « Extraire l'audio en MP3 » à la vidéo d'origine.",
    },
    {
      q: "Pourquoi les couleurs sont-elles moins bonnes que dans la vidéo ?",
      a: "Une image de GIF accepte au maximum 256 couleurs, la vidéo en contient des millions. Les dégradés doux — un ciel, un fondu, une scène sombre — deviennent des bandes visibles. Les captures d'écran et les graphismes plats ne perdent presque rien, parce qu'ils avaient déjà peu de couleurs.",
    },
    {
      q: "Puis-je faire un GIF d'une seule partie de la vidéo ?",
      a: "Oui, en deux étapes : la recette « Découper sans réencoder » sort le fragment voulu, et le GIF se fait à partir de ce morceau. Couper d'abord est aussi le moyen le moins cher d'alléger le fichier : la durée pèse plus que n'importe quel réglage.",
    },
    {
      q: "Quelles images par seconde et quelle largeur choisir ?",
      a: "Commencez par les valeurs par défaut, 15 images et 480 pixels : lisible dans une publication, et dix secondes font environ 1,3 Mo. Descendez à 320 si le fichier doit être petit, montez à 640 quand du petit texte doit rester lisible. N'utilisez 24 que pour du mouvement rapide, et 10 pour les captures d'écran, où la saccade se voit à peine.",
    },
    {
      q: "Comment alléger le GIF ?",
      a: "Dans cet ordre : raccourcissez le clip, puis réduisez la largeur, puis les images par seconde. La durée est linéaire, donc passer de trente secondes à huit économise environ quatre fois. Passer de 640 à 320 pixels économise environ trois fois. Passer de 24 à 15 images économise un tiers, mais c'est le changement le plus visible.",
    },
    {
      q: "Y a-t-il un filigrane ou une version payante ?",
      a: "Non. MediaChef est open source sous GPL-3.0, sans aucune version payante, et n'écrit rien dans l'image au-delà de la conversion demandée.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui, entièrement. FFmpeg voyage dans le téléchargement, donc faire un GIF ne touche jamais au réseau. Seule la transcription a besoin d'un téléchargement de modèle unique, et c'est une autre recette.",
    },
    {
      q: "Depuis quels formats vidéo puis-je convertir ?",
      a: "Depuis tout ce que FFmpeg sait lire : MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV et les autres. MediaChef vérifie le fichier avec ffprobe et propose la recette GIF à toute vidéo qui a une image.",
    },
    {
      q: "Puis-je convertir plusieurs vidéos d'un coup ?",
      a: "Oui. Déposez-les toutes sur le plan de travail, ajoutez la recette, et la file les traitera l'une après l'autre avec l'avancement et le temps restant pour chacune.",
    },
    {
      q: "Le GIF tourne-t-il en boucle ?",
      a: "Oui : les GIF écrits ainsi se répètent indéfiniment, et c'est ainsi que toutes les visionneuses et tous les navigateurs les jouent.",
    },
    {
      q: "Un GIF peut-il avoir un fond transparent ?",
      a: "Le format accepte une couleur transparente, mais convertir une vidéo ordinaire ne lui donne rien à rendre transparent : les images d'une vidéo sont entièrement opaques. La transparence n'a de sens que pour un matériau qui en avait déjà.",
    },
    {
      q: "Est-ce que ça tourne sur Windows et Linux, ou seulement macOS ?",
      a: "Sur les trois. Il y a un installateur pour Windows, un AppImage et un .deb pour Linux, et un DMG pour macOS sur Apple Silicon. La recette et les réglages sont identiques partout.",
    },
  ],

  ctaTitle: "Faites un GIF de ce clip",
  ctaSub: `MediaChef ${FACTS.version} — gratuit, open source, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convertir MP4 en MP3 — gratuit et hors ligne" },
    { page: "transcribe", label: "Transcrire l'audio en texte avec Whisper, hors ligne" },
    { page: "catalog", label: `Les ${FACTS.recipeCount} recettes, par catégorie` },
  ],
} as const;
