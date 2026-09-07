// Гайд «голосовой ввод», французский. Реальные запросы: «dictée vocale mac»,
// «voix en texte hors ligne», «écrire à la voix».
import { FACTS } from "../../facts";

export default {
  title: "Dictée vocale sur Mac — hors ligne, gratuite, sans facturation à la minute",
  description:
    "Appuyez sur un raccourci n'importe où, parlez, et les mots apparaissent là où se trouve le curseur. La reconnaissance tourne sur votre propre machine avec Whisper : rien n'est envoyé, rien n'est facturé. Dedans : latence mesurée, taille des modèles et la seule autorisation nécessaire.",
  h1: "Écrire à la voix sans que rien ne quitte l'ordinateur",
  crumb: "Dictée vocale",

  answer:
    "Appuyez sur la touche ⌥ droite n'importe où sur le Mac, dites une phrase, appuyez encore : le texte s'écrit directement dans le champ où se trouve le curseur — un terminal, une conversation, un formulaire de navigateur. C'est le même Whisper que MediaChef transporte déjà qui reconnaît, donc l'audio ne quitte pas votre disque et personne ne compte les minutes. Dans notre mesure, une phrase de cinq secondes est revenue en 780 millisecondes.",

  facts: [
    { k: "État", v: "Publiée depuis la version 0.8.0, macOS seulement pour l'instant" },
    { k: "Où ça tourne", v: "Entièrement sur votre machine, sans compte ni envoi" },
    { k: "Vitesse", v: "780 ms de la touche au texte sur une phrase de cinq secondes (mesuré)" },
    { k: "Combien ça coûte", v: "Rien. Ni abonnement ni facturation à la minute" },
    { k: "Plateforme", v: "macOS d'abord ; Windows et Linux ensuite" },
    { k: "Téléchargement unique", v: "Un modèle de parole, 488 Mo pour celui par défaut" },
  ],

  toc: [
    { id: "how", label: "Comment ça marche" },
    { id: "speed", label: "À quel point c'est rapide" },
    { id: "models", label: "Quel modèle prendre" },
    { id: "dictionary", label: "Lui apprendre vos mots" },
    { id: "delivery", label: "Où va le texte" },
    { id: "why", label: "Pourquoi en local" },
    { id: "notfor", label: "Quand ça n'aidera pas" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "Comment fonctionne la dictée",
  steps: [
    {
      h: "L'activer une fois",
      p: "L'onglet Dictée propose un interrupteur et un déclencheur au choix : la touche ⌥ droite, la touche ⌘ droite ou l'une de deux combinaisons. Tant que vous ne l'avez pas activée, MediaChef n'enregistre aucun raccourci global : une application qui s'approprie discrètement une combinaison système est une application qui casse les autres.",
    },
    {
      h: "Appuyer sur le raccourci n'importe où",
      p: "Ça fonctionne avec MediaChef en arrière-plan ou sa fenêtre fermée. Deux façons : maintenir la touche pendant que vous parlez, ou appuyer une fois pour démarrer et une fois pour arrêter — selon la longueur de la pensée.",
    },
    {
      h: "Parler",
      p: "Le micro ne s'ouvre que le temps de la dictée, donc le point orange de la barre des menus s'éteint dès que vous avez fini. Entre deux appuis, personne n'écoute.",
    },
    {
      h: "Le texte apparaît là où est le curseur",
      p: "Écrit directement dans le champ actif, sans toucher au presse-papiers. Si vous préférez l'inverse, qu'il aille au presse-papiers, c'est le réglage voisin.",
    },
  ],
  shotAlt:
    "MediaChef prêt à convertir : le plan de travail attend un fichier vidéo, la file des tâches est à droite.",
  shotCaption: "L'onglet Dictée de MediaChef : déclencheur, modèles, langue, dictionnaire et état de l'autorisation, tout au même endroit.",

  tables: [
    {
      id: "speed",
      title: "À quel point c'est rapide en réalité",
      lead:
        "Mesure de bout en bout sur un portable M5 : du relâchement de la touche à la livraison du texte. La première ligne est une vraie dictée issue de la version vivante, les autres une phrase fixe de quinze secondes passée dans chaque modèle.",
      head: ["Ce qui a été mesuré", "Modèle", "Temps"],
      rows: [
        ["Vraie phrase de cinq secondes, de la touche au texte écrit", "small", "780 ms"],
        ["Phrase de quinze secondes", "tiny", "pas mesuré séparément"],
        ["Phrase de quinze secondes", "small", "0,66–0,75 s"],
        ["Phrase de quinze secondes", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Ces chiffres cachent deux choses, et les deux valent la peine d'être connues. Le micro met 56 millisecondes à livrer son premier échantillon : un mot commencé au même instant que l'appui peut donc être rogné — en pratique on parle après la touche, et personne ne le remarque. Et la toute première dictée après avoir accordé l'autorisation du micro est perdue : le système passe environ 1,8 seconde à afficher sa boîte de dialogue. Appuyez de nouveau, et ça marche.",
    },
    {
      id: "models",
      title: "Quel modèle prendre",
      lead:
        "Les mêmes quatre modèles que ceux des recettes de transcription : si vous transcrivez déjà des fichiers avec MediaChef, le modèle est sur votre disque et la dictée ne coûte aucun téléchargement.",
      head: ["Modèle", "Téléchargement", "Caractère"],
      rows: [
        ["tiny", "78 Mo", "Le plus rapide, grossier — suffit pour une note à soi-même"],
        ["base", "148 Mo", "Rapide, correct"],
        ["small — celui par défaut", "488 Mo", "L'équilibre, et celui qu'utilisent déjà les recettes"],
        ["large-v3-turbo", "1,62 Go", "La meilleure qualité, environ deux fois plus d'attente"],
      ],
      note:
        "Commencez par small. Il est par défaut pour une raison pratique plutôt que technique : c'est le même modèle que celui des recettes, donc pour un utilisateur existant la dictée fonctionne sans rien télécharger. Passez à large-v3-turbo si votre audio est difficile — fort accent, salle bruyante, deux langues dans une même phrase — et acceptez à peu près le double d'attente par phrase.",
    },
    {
      id: "dictionary",
      title: "Lui apprendre vos mots",
      lead:
        "Chaque métier a des mots que la reconnaissance massacre : noms de produits, jargon, le patronyme d'un collègue. Vous pouvez donner cette liste au modèle, et il cesse de deviner. Ci-dessous, le même enregistrement avec et sans un dictionnaire de quarante termes.",
      head: ["Sans dictionnaire", "Avec"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "Cela a coûté 0,04 seconde : 0,87 contre 0,83 sur le même extrait. Le plafond est d'environ 224 jetons, soit à peu près 400 caractères en cyrillique ou le triple en alphabet latin ; MediaChef les compte pour vous et coupe, parce que Whisper tronque silencieusement une liste trop longue. C'est précisément ce que la dictée intégrée de macOS ne sait pas faire : on ne peut pas lui apprendre votre vocabulaire.",
    },
    {
      id: "delivery",
      title: "Où va le texte",
      lead:
        "Deux choix, et l'écart pèse plus qu'il n'y paraît quand on dicte plusieurs fois par heure.",
      head: ["Réglage", "Ce qui se passe", "Ce qu'il faut"],
      rows: [
        ["L'écrire", "Les mots apparaissent dans le champ actif. Votre presse-papiers reste intact", "L'autorisation d'Accessibilité, une fois"],
        ["Presse-papiers", "Le texte est copié et vous le collez avec ⌘V", "Rien de plus que le micro"],
      ],
      note:
        "Écrire laisse le presse-papiers tranquille, et c'est bien pour cela qu'il vaut mieux le préférer : si chaque dictée l'écrasait, vous ne pourriez pas y garder un lien pendant que vous travaillez. macOS considère l'écriture dans une autre application comme une saisie synthétique et demande l'autorisation d'Accessibilité — la première tentative ouvre d'elle-même le bon volet des Réglages Système. Quand l'autorisation manque, le texte arrive tout de même dans le presse-papiers : une dictée n'est jamais perdue.",
    },
  ],

  whyTitle: "Pourquoi le faire en local, c'est tout l'enjeu",
  whyBullets: [
    {
      h: "Votre voix n'est pas envoyée.",
      p: "On dicte précisément ce qu'on ne collerait pas dans un formulaire web : des idées à moitié faites, des noms de clients, la phrase qu'on est sur le point d'envoyer. La dictée dans le nuage est par définition une copie de tout cela sur le serveur de quelqu'un d'autre.",
    },
    {
      h: "Pas de compteur à la minute.",
      p: "Les services de transcription facturent à la minute, ce qui fait réfléchir avant de parler. Ici le téléchargement du modèle est unique, et la centième dictée de la journée coûte exactement ce qu'a coûté la première.",
    },
    {
      h: "Ça marche réseau coupé.",
      p: "En avion, sur une machine verrouillée, dans une salle où le wifi est ce qu'il y a de moins fiable. Une fois le modèle sur le disque, la dictée ne touche plus internet.",
    },
    {
      h: "Elle apprend votre vocabulaire.",
      p: "Le dictionnaire est une simple liste de vos mots, et c'est la seule chose que la dictée intégrée à macOS ne sait pas faire.",
    },
    {
      h: "Open source, sans abonnement.",
      p: "GPL-3.0, tout est lisible sur GitHub. Les outils payants de ce créneau facturent au mois ce qui, dessous, est le même modèle ouvert.",
    },
  ],

  notForTitle: "Quand cela n'aidera pas",
  notForLead:
    "Dit franchement, parce que l'apprendre plus tard est pire que de le lire maintenant.",
  notFor: [
    {
      h: "Vous n'êtes pas sur Mac.",
      p: "macOS passe en premier parce que c'est là que tout a été construit et éprouvé. Windows et Linux suivent : le moteur de reconnaissance est déjà multiplateforme, ce qui demande du travail par plateforme, c'est le raccourci et l'écriture du texte.",
    },
    {
      h: "Il vous faut une écriture au fil de la parole.",
      p: "Le texte arrive dans le champ quand vous avez fini, pas mot à mot pendant que vous parlez : c'est ainsi qu'une phrase est reconnue entière et plus précisément. Pendant que vous parlez, un brouillon de la reconnaissance est visible dans le panneau sous l'encoche — mais ce qui est tapé est un seul résultat propre, pas une suite de corrections.",
    },
    {
      h: "Il vous faut distinguer les locuteurs.",
      p: "Elle écrit ce qui a été dit, pas qui l'a dit. Pour un entretien à deux voix, il faut un outil de transcription conçu pour cela, pas un raccourci de dictée.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Ma voix est-elle envoyée quelque part ?",
      a: "Non. L'audio est reconnu par un fichier de modèle posé sur votre propre disque, et il est supprimé avec le dossier temporaire où il a vécu. La seule chose qui traverse le réseau est le téléchargement unique du modèle ; ensuite la dictée fonctionne réseau totalement coupé.",
    },
    {
      q: "À quel point est-ce rapide ?",
      a: "780 millisecondes entre le relâchement de la touche et l'apparition du texte, mesuré sur une vraie phrase de cinq secondes avec le modèle par défaut sur un portable M5. Une phrase de quinze secondes a pris 0,66–0,75 seconde. Le modèle lourd large-v3-turbo prend environ le double.",
    },
    {
      q: "Est-ce que ça marche dans n'importe quelle application ?",
      a: "Oui : le raccourci est enregistré pour tout le système, donc il se déclenche dans un terminal, un navigateur, une messagerie ou un éditeur, avec MediaChef en arrière-plan ou même sa fenêtre fermée.",
    },
    {
      q: "Quelle combinaison utilise-t-elle ?",
      a: "Par défaut, la touche ⌥ droite — un modificateur seul : maintenez-la et parlez, ou appuyez une fois pour démarrer et une autre pour arrêter ; avec Shift, le texte est envoyé par Entrée. Un modificateur seul ne tape rien et n'entre en conflit avec rien. Des combinaisons comme ⌥ Space tapaient une espace en mode maintien si ⌥ était relâché en premier — elles ont donc été retirées ; ⌃⌥ Space et ⌃⌥ D restent en solutions de repli.",
    },
    {
      q: "Pourquoi a-t-elle besoin de l'autorisation d'Accessibilité ?",
      a: "Pour deux choses. Entendre la touche de déclenchement : un modificateur seul ne peut pas être enregistré comme raccourci ordinaire, MediaChef écoute donc le clavier lui-même, et macOS ne l'autorise qu'avec l'Accessibilité. Et taper du texte dans la fenêtre d'une autre application, ce que le système considère comme une saisie synthétique. Une seule autorisation couvre les deux et s'accorde une fois ; redémarrez ensuite l'application.",
    },
    {
      q: "Et si je ne l'accorde pas ?",
      a: "Le texte part dans le presse-papiers et une notification dit pourquoi, avec le bon volet des Réglages Système déjà ouvert. Rien de ce qui a été dicté n'est jamais perdu à cause d'une autorisation manquante.",
    },
    {
      q: "Combien de disque faut-il ?",
      a: "L'application plus un modèle de parole : 488 Mo pour celui par défaut, 78 Mo si vous prenez le plus petit, 1,62 Go pour le plus gros. Si vous utilisez déjà MediaChef pour transcrire des fichiers, le modèle est déjà sur votre disque et la dictée n'ajoute rien.",
    },
    {
      q: "Comprend-elle le français, ou deux langues à la fois ?",
      a: "Whisper prend en charge 99 langues, et vous pouvez soit nommer la vôtre, soit le laisser la détecter. Mélanger les langues dans une même phrase est justement le cas où le modèle lourd justifie sa taille et où le dictionnaire aide le plus.",
    },
    {
      q: "Quelle durée peut faire une dictée ?",
      a: "Cinq minutes, après quoi elle s'arrête d'elle-même et transcrit ce qu'elle a entendu au lieu de le jeter. En pratique, on dicte par phrases, pas par monologues.",
    },
    {
      q: "Peut-on annuler en milieu de phrase ?",
      a: "Échap pendant l'enregistrement jette la prise et ne livre rien. Il n'est enregistré que le temps de la dictée, donc il n'interfère avec Échap nulle part ailleurs.",
    },
    {
      q: "Remplace-t-elle la dictée intégrée de macOS ?",
      a: "Elle fait le même travail avec deux différences qui comptent : on peut lui apprendre votre vocabulaire, et l'audio reste sur votre machine. Si aucune des deux ne vous importe, l'intégrée est déjà là et gratuite aussi.",
    },
    {
      q: "C'est vraiment gratuit ?",
      a: `Oui. MediaChef est open source sous GPL-3.0, sans version payante ni abonnement — dictée comprise. La version publiée est la ${FACTS.version}, dictée comprise.`,
    },
    {
      q: "Pourquoi le panneau affiche-t-il un texte différent de ce qui est tapé ?",
      a: "Ce sont deux passes distinctes. Pendant que vous parlez, le panneau affiche un brouillon produit par un modèle léger toutes les secondes et demie, afin de suivre la parole. Ce qui est tapé, c'est le résultat final du modèle principal sur l'enregistrement entier, avec votre dictionnaire de termes. Les deux modèles se choisissent dans l'onglet Dictée : mettez pour l'aperçu le même modèle que le principal et l'écart disparaît — au prix d'un panneau en retard.",
    },
    {
      q: "Pourquoi redemande-t-il les autorisations après une mise à jour ?",
      a: "macOS rattache l'autorisation à la signature de l'application, pas à son nom. MediaChef n'a pas de certificat Apple — nous ne le paierons pas —, donc chaque version est signée différemment et le système considère l'application mise à jour comme nouvelle. L'application retire elle-même l'entrée périmée et redemande l'autorisation : un interrupteur et un « Autoriser » par mise à jour.",
    },
    {
      q: "L'interrupteur dans les Réglages Système est activé, mais la dictée ne marche pas.",
      a: "C'est que cette entrée appartient à la copie précédente de l'application, ce qui arrive après une mise à jour. La désactiver puis la réactiver ne la relie pas — nous avons essayé. MediaChef efface cette entrée de lui-même et déclenche la demande du système : activez-la dans la liste et redémarrez l'application.",
    },
    {
      q: "L'enregistrement est vide alors que le micro fonctionne.",
      a: "C'est le plus souvent le casque : des AirPods dans leur boîtier restent connectés et restent l'entrée par défaut, et macOS en renvoie des zéros parfaits — à toute application, pas seulement à la nôtre. La notification nomme l'appareil d'où vient le silence. Mettez le casque, ou choisissez le micro explicitement dans l'onglet Dictée.",
    },
    {
      q: "Puis-je choisir un micro précis ?",
      a: "Oui : l'onglet Dictée liste les périphériques d'entrée. « Comme le système » désigne le dernier casque connecté et non le micro du portable, et c'est précisément pourquoi un choix explicite est plus fiable.",
    },
    {
      q: "Que se passe-t-il si j'appuie sur le déclencheur sans rien dire ?",
      a: "Rien n'est tapé. Un enregistrement vide n'atteint même pas la reconnaissance : Whisper ne se taît pas devant le silence, il invente — le modèle russe tapait des crédits de sous-titres. Ces signatures de sous-titreurs sont reconnues et traitées comme du silence, et vous obtenez « aucune parole ».",
    },
    {
      q: "Pourquoi le premier appui après le lancement est-il plus lent ?",
      a: "Le sous-système audio de macOS se réveille : jusqu'à deux secondes pour la première ouverture du micro à chaque lancement. Le panneau apparaît immédiatement, avant que l'enregistrement ne démarre, donc gardez la touche jusqu'à ce qu'il annonce qu'il écoute. Ensuite, l'ouverture prend quelques dizaines de millisecondes.",
    },
    {
      q: "Comment envoyer un message à la voix sans appuyer sur Entrée ?",
      a: "Appuyez sur le déclencheur avec Shift : le texte est tapé et Entrée suit tout seul. Une dictée vide n'appuie jamais sur Entrée — sinon se taire enverrait un message vide, ou relancerait la commande précédente dans un terminal.",
    },
    {
      q: "Que se passe-t-il si j'appuie sur une autre touche en maintenant le déclencheur ?",
      a: "L'enregistrement est annulé et rien n'est tapé. La touche ⌥ droite plus une lettre, c'est le raccourci de quelqu'un d'autre, pas une dictée, et l'application le traite comme tel.",
    },
    {
      q: "Ce que je dicte est-il enregistré sur le disque ?",
      a: "Non. L'enregistrement vit dans un dossier temporaire et disparaît avec lui, et conserver un historique des transcriptions est désactivé par défaut. L'application promet que votre contenu ne quitte pas la machine ; y écrire en clair tout ce que vous dictez cadrerait mal avec cette promesse — on dicte des mots de passe et des morceaux de conversations privées.",
    },
    {
      q: "Est-ce que ça fonctionne par-dessus les applications en plein écran ?",
      a: "Oui. Le panneau est dessiné au-dessus des fenêtres en plein écran et sur tous les bureaux — les éditeurs et les terminaux en plein écran sont justement là où l'on dicte.",
    },
    {
      q: "Une autre application utilise déjà le déclencheur. Que faire ?",
      a: "L'onglet Dictée propose aussi la touche ⌘ droite — l'autre modificateur seul auquel macOS n'attribue aucune action propre — plus deux combinaisons ordinaires, ⌃⌥ Espace et ⌃⌥ D, si les deux modificateurs sont déjà pris.",
    },
  ],

  ctaTitle: "MediaChef aujourd'hui",
  ctaSub: `Version ${FACTS.version} — gratuit, open source, macOS · Windows · Linux. La dictée est incluse.`,
  also: [
    { page: "transcribe", label: "Audio en texte — le même moteur, pour des fichiers" },
    { page: "srt", label: "Vidéo en sous-titres SRT — mesuré et hors ligne" },
    { page: "catalog", label: `Les ${FACTS.recipeCount} recettes par catégorie` },
  ],
} as const;
