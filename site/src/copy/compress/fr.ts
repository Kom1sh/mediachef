// Гайд «сжать видео», французский. Поисковые формулировки: «compresser une
// vidéo», «réduire la taille d'une vidéo». Единицы — Mo и Ko.
import { FACTS } from "../../facts";

export default {
  title: "Compresser une vidéo — gratuit, hors ligne, sans limite de taille",
  description:
    "Compressez un MP4 hors ligne dans MediaChef. Choisissez un niveau de qualité ou indiquez un poids cible en Mo pour respecter une limite.",
  h1: "Compresser une vidéo sur votre propre ordinateur",
  crumb: "Compresser une vidéo",

  answer:
    "Déposez une vidéo dans MediaChef. Pour alléger le fichier, choisissez « Compresser la vidéo (préréglage de qualité) » et commencez avec le CRF 28. Pour respecter une limite en Mo, choisissez « Compresser une vidéo à une taille donnée » et indiquez le maximum. Lancez le traitement et vérifiez le MP4 obtenu. L’original reste sur votre ordinateur.",

  facts: [
    { k: "Ce qu'il faut", v: `MediaChef ${FACTS.version} — un téléchargement, FFmpeg est déjà dedans` },
    { k: "Fonctionne hors ligne", v: "Oui, entièrement — le réseau n'est jamais sollicité" },
    { k: "Niveaux de qualité", v: "23 (haute) · 28 (par défaut) · 33 (petit fichier)" },
    { k: "Codec", v: `CRF: Vidéo H.264, audio AAC à 128 kbit/s (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Ce que vous obtenez", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (Mo)" },
    { k: "Vitesse", v: "CRF: 20 s de 1080p30 en 1,3–2,0 s sur un portable Apple Silicon" },
  ],

  toc: [
    { id: "how", label: "Comment faire" },
    { id: "level", label: "Quel niveau choisir" },
    { id: "size", label: "Ce que vous obtenez vraiment" },
    { id: "bigger", label: "Quand compresser agrandit" },
    { id: "changes", label: "Ce qui change et ce qui reste" },
    { id: "why", label: "Pourquoi chez soi" },
    { id: "notfor", label: "Quand ce n'est pas la bonne recette" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "Comment compresser une vidéo",
  steps: [
    {
      h: "Téléchargez MediaChef",
      p: "Un fichier pour macOS, Windows ou Linux. FFmpeg voyage dans le téléchargement : rien à installer à part, rien à ajouter au PATH.",
    },
    {
      h: "Déposez la vidéo sur le plan de travail",
      p: "MediaChef lit le fichier avec ffprobe et ne garde que les recettes qui conviennent. N'importe quelle vidéo reçoit la fiche de compression, quel que soit le format d'origine.",
    },
    {
      h: "Choisissez la qualité ou la taille cible",
      p: "Pour alléger le fichier, choisissez « Compresser la vidéo (préréglage de qualité) » et essayez 28. Pour une limite en Mo, choisissez « Compresser une vidéo à une taille donnée » et indiquez le maximum. L’application calcule le débit d’après la durée et peut réduire la résolution.",
    },
    {
      h: "Cliquez sur « Ajouter à la file »",
      p: "Vérifiez la taille une fois le traitement terminé. La file indique l’emplacement du fichier. Par défaut, il est enregistré à côté de l’original. Le mode qualité crée clip.compressed.mp4. Le mode taille cible crée clip.small.mp4.",
    },
  ],
  shotAlt:
    "MediaChef prêt à convertir : le plan de travail attend un fichier vidéo, la file des tâches est à droite.",
  shotCaption: "Le plan de travail où la vidéo arrive. Les recettes apparaissent quand MediaChef a lu le fichier.",

  tables: [
    {
      id: "level",
      title: "Quel niveau de qualité choisir",
      lead:
        "Le nombre fixe la qualité, pas la taille — c'est la chose la plus utile à comprendre. Vous dites à l'encodeur à quel point l'image doit être belle ; la taille du fichier est ce que cela coûte sur votre matériau précis.",
      head: ["Niveau", "Image", "À choisir quand"],
      rows: [
        ["23", "Difficile à distinguer de l'original à distance normale", "La vidéo compte pour elle-même : une pièce de portfolio, un rush que vous remonterez, tout ce qui passera sur grand écran."],
        ["28", "Bonne. Le détail fin s'adoucit si on le cherche", "La valeur par défaut. Partager, publier, envoyer — le bon niveau tant qu'il n'y a pas de raison d'en changer."],
        ["33", "Visiblement plus mou ; des blocs apparaissent sur le mouvement rapide et les scènes sombres", "Choisissez 33 si un fichier plus léger vaut une perte visible de détails. Pour une limite en Mo, utilisez le mode taille cible."],
      ],
      note:
        "Comme c'est la qualité qui est visée, le même niveau donne un petit fichier sur une capture d'écran statique et un gros sur une prise à main levée où bougent des feuilles. Deux clips au niveau 28 peuvent différer plusieurs fois.",
    },
    {
      id: "size",
      title: "Ce que vous obtenez vraiment",
      lead:
        "Mesures en CRF sur deux clips de 20 secondes en 1080p30, l’un avec des dégradés et l’autre riche en détails. Les tailles et les débits sont propres à ces deux clips.",
      head: ["Niveau", "Clip doux", "Clip détaillé", "Débit obtenu"],
      rows: [
        ["Source", "47,0 Mo", "23,9 Mo", "10–20 Mbit/s"],
        ["23", "24,1 Mo", "13,2 Mo", "5,5–10,1 Mbit/s"],
        ["28", "11,0 Mo", "6,4 Mo", "2,7–4,6 Mbit/s"],
        ["33", "4,0 Mo", "3,8 Mo", "1,6–1,7 Mbit/s"],
      ],
      note:
        "Le schéma tient sur les deux clips : chaque cran de l'échelle divise le fichier par environ deux. Passer de 23 à 33 a donné 6,1× sur le clip doux et 3,5× sur le clip détaillé — plus le matériau est difficile, moins il y a à gagner.",
    },
    {
      id: "bigger",
      title: "Quand compresser agrandit le fichier",
      lead:
        "Cela surprend, alors disons-le franchement : demander une qualité supérieure à celle que le fichier possède déjà oblige l'encodeur à dépenser plus de bits que le fichier n'en contient. Nous l'avons mesuré en réinjectant le résultat du niveau 33.",
      head: ["Appliqué à un fichier de 1,66 Mbit/s", "Résultat", "Effet"],
      rows: [
        ["Niveau 23", "10,6 Mo à partir de 4,0 Mo", "2,7 fois plus gros"],
        ["Niveau 28", "6,1 Mo à partir de 4,0 Mo", "1,5 fois plus gros"],
        ["Niveau 33", "3,4 Mo à partir de 4,0 Mo", "1,2 fois plus petit, et plus mou"],
      ],
      note:
        "Regardez donc ce que vous avez avant de compresser. Un enregistrement de téléphone à 40 Mbit/s a beaucoup à donner ; un fichier déjà téléchargé du web à 2 Mbit/s n'a presque rien, et le réencoder ne fait que perdre de la qualité.",
    },
    {
      id: "changes",
      title: "Ce qui change et ce qui reste comme avant",
      lead:
        "La recette réencode ; elle ne recadre pas. Savoir exactement à quoi elle touche évite une série de surprises.",
      head: ["Propriété", "Après compression", "Remarque"],
      rows: [
        ["Résolution", "Inchangée", "1080p en entrée, 1080p en sortie. Pour moins de pixels, il y a la recette de redimensionnement."],
        ["Images par seconde", "Inchangées", "Toutes les images sont conservées ; seule leur façon d'être stockées change."],
        ["Durée", "Inchangée", "Pour raccourcir le clip, il y a la recette de découpe."],
        ["Codec vidéo", "H.264", "Encodé avec le préréglage veryfast — d'où les vingt secondes en moins de deux."],
        ["Audio", "AAC à 128 kbit/s", "Toujours réencodé, quoi qu'il ait été. Suffisant pour la parole et la musique d'un clip qu'on partage."],
        ["L'original", "Intact", "Un nouveau fichier est écrit à côté ; rien n'est écrasé."],
      ],
    },
  ],

  whyTitle: "Pourquoi compresser sur son propre ordinateur",
  whyBullets: [
    {
      h: "Aucun envoi dans le cloud.",
      p: "MediaChef compresse la vidéo sur votre ordinateur. L’original et le fichier compressé restent sur votre appareil.",
    },
    {
      h: "Aucune limite de taille.",
      p: "Les compresseurs en ligne s'arrêtent entre 100 Mo et 2 Go, c'est-à-dire exactement dans la plage où compresser commence à compter. Un fichier de quatre gigaoctets est traité comme un de quatre mégaoctets.",
    },
    {
      h: "Plus rapide qu'un envoi.",
      p: "Vingt secondes de 1080p sont réencodées ici en moins de deux. Sur un service web, le même clip doit d'abord faire l'aller-retour.",
    },
    {
      h: "L'original est conservé.",
      p: "Le résultat est un nouveau fichier à côté de la source : un niveau mal choisi coûte une passe de plus, pas le rush.",
    },
    {
      h: "Un dossier entier d'un coup.",
      p: "Déposez tous les clips : la file les traite et vous dit où chaque résultat a été écrit.",
    },
  ],

  notForTitle: "Quand ce n'est pas la bonne recette",
  notForLead:
    "Compresser, c'est réencoder, et réencoder coûte toujours quelque chose. Voici les cas où une autre recette fait le travail mieux ou moins cher.",
  notFor: [
    {
      h: "Vous n'avez besoin que d'un extrait.",
      p: "Si vous n’avez besoin que d’un extrait, commencez par « Découper la vidéo sans réencodage ». La recette copie les pistes sans réencodage. Compressez l’extrait si nécessaire.",
    },
    {
      h: "Le fichier est déjà fortement compressé.",
      p: "Comme mesuré plus haut, un fichier à 1,66 Mbit/s a grossi de 2,7 fois au niveau 23. Regardez d'abord le débit ; s'il est déjà faible, il n'y a rien à gagner.",
    },
    {
      h: "Il vous faut moins de pixels, pas moins de bits.",
      p: "Cette recette conserve la résolution. Si un fichier 4K est lourd parce qu'il est en 4K, la recette « Réduire en 720p » s'attaque à la vraie cause.",
    },
    {
      h: "Vous archivez un master.",
      p: "H.264 à n'importe lequel de ces niveaux est destructif, et la perte s'accumule à chaque réencodage futur. Gardez le master tel quel et compressez des copies.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "De combien mon fichier va-t-il diminuer ?",
      a: "Cela dépend de la source et de sa durée. Avec le CRF 28, les deux clips du tableau font 11,0 et 6,4 Mo. Pour respecter un plafond, utilisez le mode taille cible.",
    },
    {
      q: "Que signifient les nombres 23, 28 et 33 ?",
      a: "C'est le facteur de débit constant de H.264 : une cible de qualité où plus bas veut dire mieux. L'encodeur dépense le débit nécessaire pour atteindre cette qualité sur votre matériau. C'est pourquoi le même niveau donne des tailles très différentes pour une capture d'écran statique et pour une prise à main levée.",
    },
    {
      q: "Quel niveau choisir ?",
      a: "Commencez par 28. Essayez 23 pour conserver davantage de détails ou 33 pour obtenir un fichier plus léger. Pour un plafond en Mo, utilisez « Compresser une vidéo à une taille donnée » et vérifiez le résultat.",
    },
    {
      q: "Pourquoi la compression a-t-elle agrandi mon fichier ?",
      a: "Parce que vous avez demandé une qualité supérieure à celle que le fichier avait déjà. Nous l'avons mesuré : un fichier à 1,66 Mbit/s est sorti 2,7 fois plus gros au niveau 23 et 1,5 fois plus gros au niveau 28. Si un fichier a déjà un faible débit, le compresser davantage ne fait que retirer de la qualité — regardez ce que vous avez avant de lancer la recette.",
    },
    {
      q: "Est-ce que la résolution change ?",
      a: "Le mode qualité conserve la résolution. Le mode taille cible peut la réduire en fonction du débit disponible.",
    },
    {
      q: "Qu'advient-il du son ?",
      a: "Le mode qualité réencode le son en AAC à 128 kbit/s. Le mode taille cible peut réduire le débit audio. Conservez l’original si vous avez besoin du son intact.",
    },
    {
      q: "Le fichier d'origine est-il écrasé ?",
      a: "Les deux modes créent un nouveau MP4 à côté de l’original : clip.compressed.mp4 pour la qualité et clip.small.mp4 pour la taille cible. L’original est conservé.",
    },
    {
      q: "Combien de temps cela prend-il ?",
      a: "Sur un portable Apple Silicon, vingt secondes de 1080p30 ont pris de 1,3 à 2,0 secondes — environ dix à quinze fois plus vite que de les regarder. Les clips plus longs évoluent presque linéairement et la file affiche le temps restant. C'est le préréglage veryfast qui achète cette vitesse.",
    },
    {
      q: "Y a-t-il une limite de taille ?",
      a: "Non. MediaChef n'en fixe aucune ; la limite est l'espace disque libre, et l'application le vérifie avant de démarrer. C'est la principale différence pratique avec les compresseurs web, qui s'arrêtent généralement entre 100 Mo et 2 Go.",
    },
    {
      q: "Compresser deux fois donnera-t-il encore plus petit ?",
      a: "Un deuxième passage peut réduire ou augmenter la taille et dégrader encore l’image. Si le premier résultat dépasse le plafond, utilisez la recette de taille cible sur l’original.",
    },
    {
      q: "Quels formats puis-je compresser ?",
      a: "Tout ce que FFmpeg sait lire : MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV et les autres. La sortie est toujours du MP4 en H.264, la combinaison qui se lit partout sans extension.",
    },
    {
      q: "Puis-je compresser plusieurs vidéos d'un coup ?",
      a: "Oui. Déposez-les toutes sur le plan de travail, ajoutez la recette, et la file les traitera l'une après l'autre avec l'avancement et le temps restant pour chacune.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui, entièrement. FFmpeg voyage dans le téléchargement, donc compresser ne touche jamais au réseau. Seule la transcription a besoin d'un téléchargement de modèle unique, et c'est une autre recette.",
    },
    {
      q: "Y a-t-il un filigrane ou une version payante ?",
      a: "Non. MediaChef est open source sous GPL-3.0, sans version payante, et n'écrit rien dans l'image au-delà du réencodage demandé.",
    },
    {
      q: "Est-ce que ça tourne sur Windows et Linux ?",
      a: "Sur les trois plateformes. Il y a un installateur pour Windows, un AppImage et un .deb pour Linux, et un DMG pour macOS sur Apple Silicon. La recette et ses niveaux sont identiques partout.",
    },
  ],

  ctaTitle: "Allégez ce fichier",
  ctaSub: `MediaChef ${FACTS.version} — gratuit, open source, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Vidéo en GIF — tailles mesurées pour chaque réglage" },
    { page: "mp3", label: "Convertir MP4 en MP3 — gratuit et hors ligne" },
    { page: "catalog", label: `Les ${FACTS.recipeCount} recettes, par catégorie` },
  ],
} as const;
