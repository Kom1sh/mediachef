// Гайд «видео в субтитры», португальский (BR). Реальные запросы: «como colocar
// legenda em video», «gerar legenda automatica», «video para srt».
import { FACTS } from "../../facts";

export default {
  title: "Legendas SRT a partir de um vídeo — grátis, offline, no seu computador",
  description:
    "Como tirar de um vídeo legendas SRT com marcações de tempo sem enviar nada para lugar nenhum. Com medições reais: os quatro modelos do Whisper cronometrados lado a lado, o tamanho que as legendas saem e o que cada um dos quatro formatos realmente carrega.",
  h1: "Gerar legendas SRT a partir de um vídeo",
  crumb: "Vídeo para SRT",

  answer:
    "Arraste o vídeo para o MediaChef, escolha «Criar legendas SRT para um vídeo», deixe o modelo em small e o idioma em automático e execute. Um arquivo .srt aparece ao lado do vídeo, já com os tempos. Tudo é calculado na sua máquina: a fala não sai do disco e, depois que o modelo é baixado, a receita funciona com a rede desligada. Num notebook com M5, 2 minutos e 43 segundos de fala levaram 6,2 segundos no modelo padrão — cerca de 26 vezes mais rápido que o tempo real — e deram 73 legendas com média de 39 caracteres, curtas o bastante para dar tempo de ler.",

  facts: [
    { k: "O que você precisa", v: `MediaChef ${FACTS.version} mais um download único do modelo` },
    { k: "Modelo padrão", v: "small — 488 MB, baixado uma vez e mantido" },
    { k: "Velocidade", v: "≈26× o tempo real no modelo padrão (medido, M5)" },
    { k: "Funciona offline", v: "Sim, depois que o modelo está no disco" },
    { k: "Formatos", v: "SRT, VTT, TXT comum e JSON — uma receita para cada" },
    { k: "O que você recebe", v: "clip.subs.srt ao lado do vídeo, com o original intacto" },
  ],

  toc: [
    { id: "how", label: "Como fazer" },
    { id: "models", label: "Qual modelo escolher" },
    { id: "cues", label: "De que tamanho saem as legendas" },
    { id: "formats", label: "SRT, VTT, TXT ou JSON" },
    { id: "recipes", label: "Qual receita para cada caso" },
    { id: "why", label: "Por que fazer localmente" },
    { id: "notfor", label: "Quando não é a ferramenta certa" },
    { id: "faq", label: "Perguntas" },
  ],

  stepsTitle: "Como fazer legendas para um vídeo",
  steps: [
    {
      h: "Baixe o MediaChef",
      p: "Um arquivo para macOS, Windows ou Linux. Tanto o FFmpeg quanto o motor do Whisper viajam dentro do download: não há nada para instalar à parte nem nada para acrescentar ao PATH.",
    },
    {
      h: "Baixe um modelo, uma vez só",
      p: "A primeira transcrição pede um modelo de fala. O padrão é o small, de 488 MB, e é com ele que estas medições foram feitas; o tiny tem 78 MB, o base 148 MB e o large-v3-turbo 1,62 GB. É baixado uma vez, fica no disco e daí em diante a receita não encosta mais na rede.",
    },
    {
      h: "Solte o vídeo e escolha a receita",
      p: "«Criar legendas SRT para um vídeo» aceita o vídeo direto — não é preciso extrair o áudio antes. O MediaChef decodifica a faixa para o mono de 16 kHz que o Whisper exige, numa pasta temporária que você nunca chega a ver.",
    },
    {
      h: "Execute e abra o .srt",
      p: "O arquivo cai ao lado do vídeo com o nome clip.subs.srt, com as legendas numeradas e seus tempos. Players, editores e plataformas leem direto e, como é texto puro, dá para corrigir um nome ou um termo em qualquer editor.",
    },
  ],
  shotAlt:
    "MediaChef pronto para converter: a bancada espera um arquivo de vídeo, a fila de tarefas fica à direita.",
  shotCaption: "A bancada onde o vídeo cai. As receitas aparecem quando o MediaChef termina de ler o arquivo.",

  tables: [
    {
      id: "models",
      title: "Qual modelo escolher",
      lead:
        "Quatro modelos, os mesmos 2 minutos e 43 segundos de fala, a mesma máquina: um notebook com M5 e 16 GB, cada modelo aquecido antes e valendo a melhor de duas passadas.",
      head: ["Modelo", "Download", "Tempo", "Contra o tempo real", "Palavras erradas"],
      rows: [
        ["tiny", "78 MB", "2,1 s", "×78", "5 de 540"],
        ["base", "148 MB", "2,6 s", "×63", "3 de 540"],
        ["small — o padrão", "488 MB", "6,2 s", "×26", "0 de 540"],
        ["large-v3-turbo", "1,62 GB", "11,5 s", "×14", "1 de 540"],
      ],
      note:
        "Leia a última coluna com cuidado, porque o áudio de teste é uma voz sintetizada lendo um texto preparado: sem sotaque, sem ruído de fundo e sem ninguém falando por cima. É por isso que aqui até o menor modelo acerta quase tudo, e isso não se parece com a gravação de uma reunião de verdade — em áudio difícil a distância entre estes modelos se abre bastante. Já a coluna do tempo se transfere direto para o seu caso. E uma coisa que a comparação crua esconde: quase todas as divergências eram números escritos em algarismos em vez de por extenso — o large-v3-turbo escreveu «70», «10», «50», «30» onde o texto dizia tudo por extenso —, e isso é formatação, não erro de escuta.",
    },
    {
      id: "cues",
      title: "De que tamanho saem as legendas",
      lead:
        "Uma legenda tecnicamente correta ainda pode ser inútil se jogar vinte palavras na tela de uma vez. Os modelos picotam a mesma fala de maneiras bem diferentes, e isto foi medido na mesma passada acima.",
      head: ["Modelo", "Legendas", "Duração média", "Caracteres em média", "A mais longa"],
      rows: [
        ["tiny", "35", "4,7 s", "83", "97 caracteres"],
        ["base", "35", "4,7 s", "83", "100 caracteres"],
        ["small — o padrão", "73", "2,2 s", "39", "58 caracteres"],
        ["large-v3-turbo", "30", "5,4 s", "97", "112 caracteres"],
      ],
      note:
        "A regra comum na televisão fica em torno de 42 caracteres por linha em duas linhas, ou seja, cerca de 84 caracteres na tela ao mesmo tempo. Por essa medida, dos quatro só o small cabe com folga: 39 caracteres em média e 58 na legenda mais longa, enquanto o large-v3-turbo já passa do limite numa legenda comum. Ou seja, o modelo padrão não é só a escolha equilibrada em acerto — ele também corta a fala nos pedaços mais legíveis.",
    },
    {
      id: "formats",
      title: "SRT, VTT, texto puro ou JSON",
      lead:
        "A mesma transcrição escrita de quatro jeitos. Os tamanhos vêm dos mesmos 2 minutos e 43 segundos de fala, então dá para comparar direto.",
      head: ["Formato", "Tamanho", "O que tem dentro", "Quando usar"],
      rows: [
        ["SRT", "5,5 KB", "Legendas numeradas, tempos com vírgula: 00:00:00,000", "Quase sempre. Players, editores e plataformas aceitam"],
        ["VTT", "5,3 KB", "Cabeçalho WEBVTT, tempos com ponto: 00:00:00.000", "Legendas para player web, a faixa do navegador"],
        ["TXT", "3,0 KB", "Texto corrido, sem tempo nenhum", "Você quer as palavras, não as legendas"],
        ["JSON", "15,2 KB", "Cada legenda mais o modelo e os parâmetros usados", "Quem vai ler isso é um programa, não uma pessoa"],
      ],
      note:
        "SRT e VTT diferem principalmente no caractere entre segundos e milissegundos, então, se um player recusar um deles, o outro é trocar de receita e não transcrever de novo. O JSON pesa cerca de três vezes mais que o SRT porque carrega os dados da execução junto com o texto.",
    },
    {
      id: "recipes",
      title: "Qual receita para cada caso",
      lead:
        `Legenda não é uma receita só, são várias, e escolher a certa economiza um passo. Todas estão no catálogo de ${FACTS.recipeCount} receitas.`,
      head: ["O que você tem", "O que você quer", "Receita"],
      rows: [
        ["Um vídeo", "Legendas ao lado dele", "Criar legendas SRT para um vídeo"],
        ["Um arquivo de áudio", "Legendas", "Transcrever áudio para legendas SRT"],
        ["Fala em outro idioma", "Legendas em inglês numa passada", "Traduzir a fala para legendas em inglês"],
        ["Qualquer coisa com fala", "Só o texto", "Transcrever áudio para texto"],
        ["Qualquer coisa com fala", "Uma faixa para player web", "Transcrever áudio para WebVTT"],
      ],
      note:
        "A receita de tradução vai da fala estrangeira direto para legendas em inglês com tempos, numa única passada — não é transcrever primeiro e traduzir depois. Mas só vai para o inglês; esse é um limite do modelo, não do aplicativo.",
    },
  ],

  whyTitle: "Por que fazer legendas no seu próprio computador",
  whyBullets: [
    {
      h: "A fala não sai do seu disco.",
      p: "Gravações de reuniões, entrevistas e chamadas são o tipo de arquivo mais delicado que a maioria das pessoas manuseia, e uma transcrição online é, por definição, uma cópia daquela conversa no servidor de outra pessoa. Aqui não existe upload sobre o qual pensar.",
    },
    {
      h: "Nada de pagar por minuto.",
      p: "Serviços de transcrição cobram por minuto de áudio, e isso transforma um acervo longo numa fatura de verdade. O download do modelo é único e, depois dele, uma gravação de duas horas custa o mesmo que uma de dois minutos: nada.",
    },
    {
      h: "Roda com a rede desligada.",
      p: "Assim que o arquivo do modelo está no disco, esta receita não encosta na internet. Funciona no avião, numa máquina fechada e numa sala onde o wi-fi é a coisa menos confiável presente.",
    },
    {
      h: "Sem limite de duração.",
      p: "Transcritores web gratuitos costumam travar em poucos minutos por arquivo, justamente quando a gravação vale a pena transcrever por ser longa. Aqui não há teto.",
    },
    {
      h: "Uma pasta inteira de uma vez.",
      p: "Solte um diretório de gravações e a fila passa por elas uma a uma, dizendo onde cada arquivo de legenda foi escrito.",
    },
  ],

  notForTitle: "Quando não é a ferramenta certa",
  notForLead:
    "A receita escreve um arquivo de legenda. Isso é mais estreito do que «colocar legenda no vídeo», e a diferença pesa nestes casos.",
  notFor: [
    {
      h: "Você quer a legenda queimada na imagem.",
      p: "Aqui sai um .srt separado que o player carrega junto com o vídeo. Gravar o texto dentro dos quadros é outra operação: ela recodifica o vídeo, e depois disso as palavras não podem mais ser desligadas nem corrigidas.",
    },
    {
      h: "Você precisa de precisão de broadcast.",
      p: "Mesmo no áudio limpo das medições acima os modelos tropeçaram em algumas palavras, e gravações reais são mais difíceis. Tudo que é publicado sob exigência legal de acessibilidade passa por revisão humana antes de sair, seja lá o que tenha feito o rascunho.",
    },
    {
      h: "O áudio é realmente ruim.",
      p: "Muita gente falando por cima, a gravação de uma sala feita no celular ou música mais alta que a voz derrubam os quatro modelos. Consertar o áudio antes — nem que seja só extrair uma faixa mais limpa — rende mais do que subir de tamanho de modelo.",
    },
    {
      h: "Você precisa de tradução para outra coisa além do inglês.",
      p: "O Whisper traduz para o inglês e só para ele. Para qualquer outro idioma de destino, transcreva primeiro no idioma original e traduza esse texto com uma ferramenta feita para isso.",
    },
  ],

  faqTitle: "Perguntas",
  faq: [
    {
      q: "Isso é grátis?",
      a: `Sim, tudo. O MediaChef é de código aberto sob GPL-3.0: não há versão paga, nem cobrança por minuto, nem limite de duração. Os modelos também são baixados de graça. A versão atual é a ${FACTS.version}.`,
    },
    {
      q: "Meu vídeo é enviado para algum lugar?",
      a: "Não. A fala é processada por um arquivo de modelo que está no seu próprio disco. A única coisa que atravessa a rede é o download único do modelo, e depois disso a receita roda com a internet desligada.",
    },
    {
      q: "Quanto tempo leva?",
      a: "Cerca de 26 vezes mais rápido que o tempo real no modelo padrão: medimos 6,2 segundos para 2 minutos e 43 segundos de fala num notebook com M5. Nessa proporção, uma gravação de uma hora sai em poucos minutos. No mesmo áudio, o tiny deu ×78 e o large-v3-turbo ×14.",
    },
    {
      q: "Qual modelo eu devo escolher?",
      a: "Comece pelo small, o padrão. Nas nossas medições ele acertou todas as palavras do áudio de teste e produziu as legendas mais legíveis — 39 caracteres em média contra 97 do large-v3-turbo. Suba só se o seu áudio for difícil; desça para tiny ou base se quiser um rascunho em poucos segundos.",
    },
    {
      q: "Qual o tamanho do modelo?",
      a: "78 MB o tiny, 148 MB o base, 488 MB o small e 1,62 GB o large-v3-turbo. O download é único. Depois o arquivo fica no disco e cada execução seguinte o usa sem perguntar.",
    },
    {
      q: "Preciso dizer em que idioma é a fala?",
      a: "Não. O idioma vem em automático e o modelo descobre pelo áudio. Ainda assim dá para informar explicitamente, e vale a pena quando a gravação começa com algumas frases em outro idioma.",
    },
    {
      q: "Ele consegue traduzir as legendas para o inglês?",
      a: "Sim, com a receita «Traduzir a fala para legendas em inglês»: entra fala estrangeira e sai um SRT em inglês com tempos, numa passada só em vez de transcrever e depois traduzir. O inglês é o único idioma de destino que o modelo suporta.",
    },
    {
      q: "Qual a diferença entre SRT e VTT?",
      a: "Principalmente a pontuação nos tempos: o SRT escreve 00:00:00,000 com vírgula e numera as legendas, o VTT escreve 00:00:00.000 com ponto e começa com uma linha WEBVTT. O SRT é o que players e editores esperam; o VTT é o que um player web quer para a própria faixa de legenda. São receitas diferentes, então trocar de formato é rodar de novo, não reescrever o arquivo.",
    },
    {
      q: "Dá para editar as legendas depois?",
      a: "Dá — um .srt é texto puro. Abra em qualquer editor para corrigir um nome próprio, um jargão ou um tempo. Esse é o jeito normal de trabalhar: o modelo entrega noventa e tantos por cento e você acerta o resto na mão.",
    },
    {
      q: "Por que minhas legendas estão longas demais?",
      a: "Porque o modelo decide onde cortar, e os modelos maiores cortam menos. Medimos 39 caracteres por legenda no small contra 97 no large-v3-turbo, no mesmo áudio. Se as suas legendas estão se esticando, voltar para o small costuma resolver — e em fala limpa isso não custa nada em acerto.",
    },
    {
      q: "Ele separa os falantes?",
      a: "Não. O Whisper escreve o que foi dito, não quem disse. Se você precisa de marcações «Falante 1 / Falante 2», vai ter que colocá-las à mão ou usar uma ferramenta feita justamente para isso.",
    },
    {
      q: "O que acontece se não houver fala no arquivo?",
      a: "A execução para e avisa que não ouviu nada reconhecível, em vez de escrever calada um arquivo vazio. Silêncio não gera legenda, e isso é de propósito.",
    },
    {
      q: "Funciona no Windows e no Linux?",
      a: "Nas três plataformas. A fala é processada na CPU em todas elas e, no Apple Silicon, usa também a GPU — daí os números rápidos acima. A mesma receita num notebook modesto com Windows vai ser mais lenta, mas ainda assim mais rápida do que ouvir a gravação inteira.",
    },
    {
      q: "Dá para legendar vários arquivos de uma vez?",
      a: "Dá. Solte uma pasta inteira, acrescente a receita e a fila passa por eles um atrás do outro. Cada arquivo de legenda é escrito ao lado da própria fonte.",
    },
    {
      q: "O arquivo de vídeo é alterado?",
      a: "Não. É escrito um .srt separado ao lado dele — clip.subs.srt — e o vídeo não é modificado, nem renomeado, nem recodificado. Esta receita não toca na imagem.",
    },
  ],

  ctaTitle: "Tire as legendas desse vídeo",
  ctaSub: `MediaChef ${FACTS.version} — grátis, código aberto, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Áudio para texto — o mesmo motor, só as palavras" },
    { page: "trim", label: "Cortar um vídeo — medido e sem perdas" },
    { page: "catalog", label: `As ${FACTS.recipeCount} receitas por categoria` },
  ],
} as const;
