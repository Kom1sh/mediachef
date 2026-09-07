// Гайд «голосовой ввод», португальский (BR). Реальные запросы: «ditado por voz
// mac», «voz para texto offline», «escrever falando».
import { FACTS } from "../../facts";

export default {
  title: "Ditado por voz no Mac — offline, grátis, sem cobrança por minuto",
  description:
    "Aperte um atalho em qualquer lugar, fale e as palavras aparecem onde está o cursor. O reconhecimento roda na sua própria máquina com o Whisper: nada é enviado, nada é tarifado. Dentro: latência medida, tamanhos dos modelos e a única permissão necessária.",
  h1: "Escrever falando sem que nada saia do computador",
  crumb: "Ditado por voz",

  answer:
    "Aperte a tecla ⌥ direita em qualquer lugar do Mac, fale uma frase e aperte de novo: o texto é digitado direto no campo onde está o cursor, seja um terminal, um chat ou um formulário do navegador. Quem reconhece é o mesmo Whisper que o MediaChef já carrega, então o áudio não sai do seu disco e ninguém conta os minutos. Na nossa medição uma frase de cinco segundos voltou em 780 milissegundos.",

  facts: [
    { k: "Situação", v: "Publicado desde a versão 0.8.0, por enquanto só macOS" },
    { k: "Onde roda", v: "Inteiramente na sua máquina, sem conta e sem upload" },
    { k: "Velocidade", v: "780 ms da tecla ao texto numa frase de cinco segundos (medido)" },
    { k: "Quanto custa", v: "Nada. Nem assinatura nem cobrança por minuto" },
    { k: "Plataforma", v: "macOS primeiro; Windows e Linux depois" },
    { k: "Download único", v: "Um modelo de fala, 488 MB no padrão" },
  ],

  toc: [
    { id: "how", label: "Como funciona" },
    { id: "speed", label: "Quão rápido é" },
    { id: "models", label: "Qual modelo usar" },
    { id: "dictionary", label: "Ensinando suas palavras" },
    { id: "delivery", label: "Para onde vai o texto" },
    { id: "why", label: "Por que localmente" },
    { id: "notfor", label: "Quando não vai ajudar" },
    { id: "faq", label: "Perguntas" },
  ],

  stepsTitle: "Como o ditado funciona",
  steps: [
    {
      h: "Ligar uma vez",
      p: "Na aba Ditado há um interruptor e um acionador para escolher: a ⌥ direita, a ⌘ direita ou uma de duas combinações. Até você ligar, o MediaChef não registra atalho global nenhum: um aplicativo que toma uma combinação do sistema em silêncio é um aplicativo que quebra os outros.",
    },
    {
      h: "Apertar o atalho em qualquer lugar",
      p: "Funciona com o MediaChef em segundo plano ou com a janela fechada. Dois jeitos: segurar a tecla enquanto fala, ou apertar uma vez para começar e outra para parar, dependendo do tamanho do pensamento.",
    },
    {
      h: "Falar",
      p: "O microfone abre só enquanto você dita, então o ponto laranja na barra de menus apaga no instante em que você termina. Entre um toque e outro ninguém escuta.",
    },
    {
      h: "O texto aparece onde está o cursor",
      p: "Digitado direto no campo em foco, sem mexer na área de transferência. Se você preferir o contrário, que vá para a área de transferência, é a configuração ao lado.",
    },
  ],
  shotAlt:
    "MediaChef pronto para converter: a bancada espera um arquivo de vídeo, a fila de tarefas fica à direita.",
  shotCaption: "A aba Ditado do MediaChef: acionador, modelos, idioma, dicionário e estado da permissão, tudo num só lugar.",

  tables: [
    {
      id: "speed",
      title: "Quão rápido é de verdade",
      lead:
        "Medição de ponta a ponta num notebook com M5: de soltar a tecla até o texto ser entregue. A primeira linha é um ditado real da compilação viva; as outras, uma frase fixa de quinze segundos passada por cada modelo.",
      head: ["O que foi medido", "Modelo", "Tempo"],
      rows: [
        ["Frase real de cinco segundos, da tecla ao texto digitado", "small", "780 ms"],
        ["Frase de quinze segundos", "tiny", "não medido em separado"],
        ["Frase de quinze segundos", "small", "0,66–0,75 s"],
        ["Frase de quinze segundos", "large-v3-turbo", "1,64–1,97 s"],
      ],
      note:
        "Esses números esconderam duas coisas, e as duas vale saber. O microfone leva 56 milissegundos para entregar a primeira amostra, então uma palavra começada no mesmo instante do toque pode ser cortada — na prática a gente fala depois da tecla e ninguém percebe. E o primeirinho ditado depois de conceder a permissão do microfone se perde: o sistema passa cerca de 1,8 segundo mostrando o diálogo dele. Aperte de novo e funciona.",
    },
    {
      id: "models",
      title: "Qual modelo usar",
      lead:
        "Os mesmos quatro modelos que as receitas de transcrição usam, então se você já transcreve arquivos no MediaChef o modelo está no seu disco e o ditado não custa download nenhum.",
      head: ["Modelo", "Download", "Perfil"],
      rows: [
        ["tiny", "78 MB", "O mais rápido, tosco — serve para um recado para si mesmo"],
        ["base", "148 MB", "Rápido, razoável"],
        ["small — o padrão", "488 MB", "O equilíbrio, e o que as receitas já usam"],
        ["large-v3-turbo", "1,62 GB", "Melhor qualidade, cerca de duas vezes mais espera"],
      ],
      note:
        "Comece pelo small. Ele é o padrão por um motivo prático, não técnico: é o mesmo modelo das receitas, então para quem já usa o app o ditado funciona sem baixar nada. Suba para o large-v3-turbo se o seu áudio for difícil — sotaque forte, sala barulhenta, dois idiomas numa frase — e aceite aproximadamente o dobro de espera por frase.",
    },
    {
      id: "dictionary",
      title: "Ensinando suas palavras",
      lead:
        "Todo ofício tem palavras que o reconhecimento destrói: nomes de produtos, jargão, o sobrenome de um colega. Você pode entregar essa lista ao modelo, e ele para de adivinhar. Abaixo, a mesma gravação com e sem um dicionário de quarenta termos.",
      head: ["Sem dicionário", "Com ele"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "Custou 0,04 segundo: 0,87 contra 0,83 no mesmo trecho. O teto são cerca de 224 tokens, ou seja mais ou menos 400 caracteres em cirílico e o triplo em alfabeto latino; o MediaChef conta por você e corta, porque o Whisper trunca uma lista longa demais em silêncio. É exatamente isto que o ditado embutido do macOS não faz: não se ensina o seu vocabulário a ele.",
    },
    {
      id: "delivery",
      title: "Para onde vai o texto",
      lead:
        "Duas escolhas, e a diferença pesa mais do que parece quando você dita várias vezes por hora.",
      head: ["Configuração", "O que acontece", "Do que precisa"],
      rows: [
        ["Digitar", "As palavras aparecem no campo em foco. Sua área de transferência fica intacta", "A permissão de Acessibilidade, uma vez"],
        ["Área de transferência", "O texto é copiado e você cola com ⌘V", "Nada além do microfone"],
      ],
      note:
        "Digitar deixa a área de transferência em paz, e é por isso que vale preferir: se cada ditado a sobrescrevesse, você não conseguiria guardar um link ali enquanto trabalha. O macOS considera digitar em outro aplicativo como entrada sintética e pede a permissão de Acessibilidade — a primeira tentativa abre sozinha o painel certo dos Ajustes do Sistema. Quando a permissão falta, o texto ainda assim vai para a área de transferência: um ditado nunca se perde.",
    },
  ],

  whyTitle: "Por que fazer isso localmente é o ponto",
  whyBullets: [
    {
      h: "Sua voz não é enviada.",
      p: "A gente dita justamente aquilo que não colaria num formulário web: ideias pela metade, nomes de clientes, a frase que está a ponto de enviar. Ditado na nuvem é, por definição, uma cópia de tudo isso no servidor de outra pessoa.",
    },
    {
      h: "Sem contador por minuto.",
      p: "Serviços que transcrevem cobram por minuto, e isso faz a gente pensar antes de falar. Aqui o download do modelo é único e o centésimo ditado do dia custa exatamente o que custou o primeiro.",
    },
    {
      h: "Funciona com a rede desligada.",
      p: "No avião, numa máquina fechada, numa sala onde o wi-fi é a coisa menos confiável presente. Com o modelo no disco, o ditado nunca encosta na internet.",
    },
    {
      h: "Aprende o seu vocabulário.",
      p: "O dicionário é uma lista simples das suas palavras, e é a única coisa que o ditado embutido no macOS não sabe fazer.",
    },
    {
      h: "Código aberto, sem assinatura.",
      p: "GPL-3.0, tudo legível no GitHub. As ferramentas pagas deste nicho cobram por mês pelo que, por baixo, é o mesmo modelo aberto.",
    },
  ],

  notForTitle: "Quando não vai ajudar",
  notForLead:
    "Dito na lata, porque descobrir depois é pior do que ler agora.",
  notFor: [
    {
      h: "Você não usa Mac.",
      p: "macOS vem primeiro porque foi ali que se construiu e testou. Windows e Linux vêm depois: o motor de reconhecimento já é multiplataforma, quem precisa de trabalho por plataforma é o atalho e a digitação do texto.",
    },
    {
      h: "Você precisa que digite enquanto fala.",
      p: "O texto chega ao campo quando você termina, não palavra por palavra enquanto fala: assim a frase é reconhecida inteira e com mais precisão. Enquanto você fala, um rascunho do reconhecimento aparece no painel sob o notch, mas o que é digitado é um único resultado limpo, não uma sequência de correções.",
    },
    {
      h: "Você precisa separar quem fala.",
      p: "Ele escreve o que foi dito, não quem disse. Para uma entrevista a duas vozes você quer uma ferramenta de transcrição feita para isso, não um atalho de ditado.",
    },
  ],

  faqTitle: "Perguntas",
  faq: [
    {
      q: "Minha voz é enviada para algum lugar?",
      a: "Não. O áudio é reconhecido por um arquivo de modelo que está no seu próprio disco, e é apagado junto com a pasta temporária em que viveu. A única coisa que atravessa a rede é o download único do modelo; depois o ditado funciona com a rede totalmente desligada.",
    },
    {
      q: "Quão rápido é?",
      a: "780 milissegundos de soltar a tecla até o texto aparecer, medido numa frase real de cinco segundos com o modelo padrão num notebook com M5. Uma frase de quinze segundos levou 0,66–0,75 segundo. O modelo pesado large-v3-turbo leva cerca do dobro.",
    },
    {
      q: "Funciona em qualquer aplicativo?",
      a: "Sim: o atalho é registrado para todo o sistema, então dispara num terminal, num navegador, num mensageiro ou num editor, com o MediaChef em segundo plano ou até com a janela fechada.",
    },
    {
      q: "Qual combinação ele usa?",
      a: "Por padrão, a tecla ⌥ direita — um modificador sozinho: segure e fale, ou toque uma vez para começar e outra para terminar; com Shift o texto é enviado com Enter. Um modificador sozinho não digita nada e não conflita com nada. Combinações como ⌥ Space digitavam um espaço no modo de segurar se ⌥ fosse solto primeiro, por isso foram retiradas; ⌃⌥ Space e ⌃⌥ D ficam como alternativas.",
    },
    {
      q: "Por que precisa da permissão de Acessibilidade?",
      a: "Para duas coisas. Ouvir a tecla de acionamento: um modificador sozinho não pode ser registrado como atalho comum, então o MediaChef escuta o teclado por conta própria, e o macOS só permite isso com Acessibilidade. E digitar texto na janela de outro aplicativo, que o sistema trata como entrada sintética. Uma permissão cobre as duas e é concedida uma vez; depois reinicie o aplicativo.",
    },
    {
      q: "E se eu não conceder?",
      a: "O texto vai para a área de transferência e uma notificação diz por quê, com o painel certo dos Ajustes do Sistema já aberto. Nada ditado se perde por causa de uma permissão que falta.",
    },
    {
      q: "Quanto disco ele precisa?",
      a: "O aplicativo mais um modelo de fala: 488 MB no padrão, 78 MB se você escolher o menor, 1,62 GB o maior. Se você já usa o MediaChef para transcrever arquivos, o modelo já está no seu disco e o ditado não acrescenta nada.",
    },
    {
      q: "Ele entende português, ou dois idiomas ao mesmo tempo?",
      a: "O Whisper suporta 99 idiomas, e você pode nomear o seu ou deixar que detecte. Misturar idiomas numa mesma frase é justamente o caso em que o modelo pesado justifica o tamanho e em que o dicionário ajuda mais.",
    },
    {
      q: "Quanto pode durar um ditado?",
      a: "Cinco minutos, e depois ele para sozinho e transcreve o que ouviu em vez de descartar. Na prática a gente dita em frases, não em monólogos.",
    },
    {
      q: "Dá para cancelar no meio da frase?",
      a: "Escape durante a gravação joga a tomada fora e não entrega nada. Ele é registrado só enquanto você dita, então não interfere no Escape em nenhum outro lugar.",
    },
    {
      q: "Ele substitui o ditado embutido do macOS?",
      a: "Faz o mesmo trabalho com duas diferenças que importam: a este se pode ensinar o seu vocabulário, e o áudio fica na sua máquina. Se nenhuma das duas importa para você, o embutido já está aí e também é de graça.",
    },
    {
      q: "É mesmo grátis?",
      a: `Sim. O MediaChef é de código aberto sob GPL-3.0, sem versão paga e sem assinatura — o ditado incluído. A versão publicada é a ${FACTS.version}, com o ditado incluído.`,
    },
    {
      q: "Por que o painel mostra um texto diferente do que é digitado?",
      a: "São duas passagens distintas. Enquanto você fala, o painel mostra um rascunho produzido por um modelo leve a cada segundo e meio, para conseguir acompanhar a fala. O que é digitado é o resultado final do modelo principal sobre a gravação inteira, com o seu dicionário de termos. Os dois modelos são escolhidos na aba Ditado: coloque na prévia o mesmo modelo do principal e a diferença desaparece — ao custo de o painel ficar atrasado.",
    },
    {
      q: "Por que ele pede as permissões de novo depois de uma atualização?",
      a: "O macOS vincula a permissão à assinatura do aplicativo, não ao nome dele. O MediaChef não tem certificado da Apple — não vamos pagar por um —, então cada versão é assinada de forma diferente e o sistema trata o aplicativo atualizado como novo. O próprio aplicativo remove a entrada vencida e pede a permissão outra vez: um interruptor e um «Permitir» por atualização.",
    },
    {
      q: "O interruptor nos Ajustes do Sistema está ligado, mas o ditado não funciona.",
      a: "Então aquela entrada pertence à cópia anterior do aplicativo, que é o que acontece depois de uma atualização. Desligar e ligar de novo não a revincula — nós testamos. O MediaChef limpa essa entrada por conta própria e dispara o aviso do sistema: ligue-o na lista e reinicie o aplicativo.",
    },
    {
      q: "A gravação saiu vazia mesmo com o microfone funcionando.",
      a: "Normalmente é o fone: AirPods na caixa continuam conectados e continuam sendo a entrada padrão, e o macOS entrega zeros absolutos a partir deles — para qualquer aplicativo, não só o nosso. A notificação diz de qual dispositivo veio o silêncio. Coloque o fone ou escolha o microfone explicitamente na aba Ditado.",
    },
    {
      q: "Posso escolher um microfone específico?",
      a: "Sim: a aba Ditado lista os dispositivos de entrada. «Como o sistema» significa o último fone conectado, e não o microfone do notebook — por isso a escolha explícita é mais confiável.",
    },
    {
      q: "O que acontece se eu apertar o acionador e não falar nada?",
      a: "Nada é digitado. Uma gravação vazia nem chega ao reconhecimento: o Whisper não fica calado diante do silêncio, ele inventa — o modelo russo digitava créditos de legendas. Essas assinaturas de legendadores são reconhecidas e tratadas como silêncio, e você recebe «não se ouve fala».",
    },
    {
      q: "Por que o primeiro acionamento depois de abrir o aplicativo é mais lento?",
      a: "O subsistema de áudio do macOS está acordando: até dois segundos na primeira abertura do microfone por execução. O painel aparece imediatamente, antes de a gravação começar, então segure a tecla até ele dizer que está ouvindo. Depois disso, abrir leva dezenas de milissegundos.",
    },
    {
      q: "Como envio uma mensagem por voz sem apertar Enter?",
      a: "Aperte o acionador junto com Shift: o texto é digitado e o Enter vem automaticamente. Um ditado vazio nunca aperta Enter — caso contrário, ficar calado enviaria uma mensagem vazia ou executaria o comando anterior num terminal.",
    },
    {
      q: "O que acontece se eu apertar outra tecla segurando o acionador?",
      a: "A gravação é cancelada e nada é digitado. A ⌥ direita mais uma letra é o atalho de outro aplicativo, não um ditado, e o programa entende assim.",
    },
    {
      q: "O que eu dito fica salvo no disco?",
      a: "Não. A gravação vive numa pasta temporária e é apagada junto com ela, e guardar um histórico de transcrições vem desligado por padrão. O aplicativo promete que o seu conteúdo não sai da máquina; escrever nela tudo o que você dita em texto puro combinaria mal com isso — as pessoas ditam senhas e trechos de conversas privadas.",
    },
    {
      q: "Funciona sobre aplicativos em tela cheia?",
      a: "Sim. O painel é desenhado acima das janelas em tela cheia e em todas as áreas de trabalho — editores e terminais em tela cheia são justamente onde se dita.",
    },
    {
      q: "Outro aplicativo já usa o acionador. E agora?",
      a: "A aba Ditado também oferece a ⌘ direita — o outro modificador sozinho ao qual o macOS não atribui ação própria — mais duas combinações comuns, ⌃⌥ Espaço e ⌃⌥ D, caso os dois modificadores já estejam ocupados.",
    },
  ],

  ctaTitle: "O MediaChef hoje",
  ctaSub: `Versão ${FACTS.version} — grátis, código aberto, macOS · Windows · Linux. O ditado já está incluído.`,
  also: [
    { page: "transcribe", label: "Áudio para texto — o mesmo motor, para arquivos" },
    { page: "srt", label: "Vídeo para legendas SRT — medido e offline" },
    { page: "catalog", label: `As ${FACTS.recipeCount} receitas por categoria` },
  ],
} as const;
