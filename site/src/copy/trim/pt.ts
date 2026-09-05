// Гайд «обрезать видео», португальский. Поисковые формулировки: «cortar
// vídeo», «cortar vídeo sem perder qualidade», «recortar um trecho».
import { FACTS } from "../../facts";

export default {
  title: "Cortar vídeo sem recodificar — grátis, sem conexão, instantâneo",
  description:
    "Como tirar um trecho de um vídeo no seu computador sem mexer na qualidade: o fluxo é copiado, não recalculado, então termina em centésimos de segundo seja qual for a duração. Dentro, tempos medidos e o limite dos quadros-chave explicado com honestidade.",
  h1: "Cortar vídeo sem perder qualidade",
  crumb: "Cortar vídeo",

  answer:
    "Solte o vídeo no MediaChef, escolha «Cortar sem recodificar», escreva o início e o fim como HH:MM:SS e aperte começar. O trecho aparece ao lado do original. Nada é recalculado — o fluxo é copiado como está, então a imagem é bit a bit a mesma e o trabalho termina em centésimos de segundo: nas nossas medições 0,03 segundo, tanto para um trecho de cinco segundos quanto de quinze. A única ressalva é que os cortes só podem cair num quadro-chave, e isso está explicado abaixo.",

  facts: [
    { k: "O que você precisa", v: `MediaChef ${FACTS.version} — um download, o FFmpeg já vem dentro` },
    { k: "Funciona sem conexão", v: "Sim, totalmente — a rede não é tocada em momento algum" },
    { k: "Custo em qualidade", v: "Nenhum. Nada é recodificado; o fluxo é copiado" },
    { k: "Formato de tempo", v: "HH:MM:SS. Deixe o fim vazio para cortar até o final" },
    { k: "Velocidade", v: "Cerca de 0,03 s, e não cresce com a duração do trecho" },
    { k: "O que você recebe", v: "clip.trim.mp4 ao lado do original, que é preservado" },
  ],

  toc: [
    { id: "how", label: "Como fazer" },
    { id: "speed", label: "O quanto é rápido" },
    { id: "keyframes", label: "Por que o corte se desloca" },
    { id: "changes", label: "O que muda e o que não" },
    { id: "format", label: "Como escrever os tempos" },
    { id: "why", label: "Por que no seu computador" },
    { id: "notfor", label: "Quando a receita é a errada" },
    { id: "faq", label: "Perguntas" },
  ],

  stepsTitle: "Como tirar um trecho de um vídeo",
  steps: [
    {
      h: "Baixe o MediaChef",
      p: "Um arquivo para macOS, Windows ou Linux. O FFmpeg viaja dentro do download: não há nada para instalar em separado nem para acrescentar ao PATH.",
    },
    {
      h: "Solte o vídeo no tabuleiro",
      p: "O MediaChef lê o arquivo com o ffprobe e deixa só as receitas que servem. Qualquer vídeo recebe o cartão de corte, seja qual for o formato de origem.",
    },
    {
      h: "Escolha «Cortar sem recodificar» e escreva os tempos",
      p: "Início e fim como HH:MM:SS — 00:01:30 é um minuto e meio. Se deixar o fim vazio, o trecho vai do ponto de início até o final do arquivo.",
    },
    {
      h: "Aperte começar e pegue o trecho",
      p: "O resultado fica ao lado do original como clip.trim.mp4, e o original não é tocado. É rápido o bastante para terminar antes de você desviar o olhar.",
    },
  ],
  shotAlt:
    "MediaChef pronto para converter: o tabuleiro espera um arquivo de vídeo e à direita está a fila de tarefas.",
  shotCaption: "O tabuleiro onde o vídeo cai. As receitas aparecem quando o MediaChef termina de ler o arquivo.",

  tables: [
    {
      id: "speed",
      title: "O quanto é rápido de verdade",
      lead:
        "Como nada é recalculado, o trabalho é copiar os bytes necessários. O tempo não depende da duração do trecho — medido sobre uma origem 1080p de vinte segundos.",
      head: ["Trecho cortado", "Resultado", "Tempo"],
      rows: [
        ["00:00:02 → 00:00:07", "5,2 s", "0,03 s"],
        ["00:00:00 → 00:00:10", "10,1 s", "0,03 s"],
        ["00:00:05 → 00:00:20", "15,0 s", "0,04 s"],
      ],
      note:
        "Compare com recodificar a mesma origem, que levou de 1,3 a 2,0 segundos — cerca de cinquenta vezes mais, e ainda com perda de qualidade. Se você só precisa de um pedaço, esta é a primeira receita a procurar.",
    },
    {
      id: "keyframes",
      title: "Por que às vezes o corte se desloca",
      lead:
        "Esta é a limitação honesta, e conhecê-la transforma um resultado confuso num resultado esperado. Um vídeo não guarda cada quadro inteiro: a maioria só descreve a diferença em relação ao anterior, e o corte só pode começar num quadro completo — um quadro-chave. Peça um ponto entre dois deles e o corte começa no quadro-chave anterior.",
      head: ["Origem", "Quadros-chave em", "Pediu começar em", "Começou de fato em"],
      rows: [
        ["Chaves esparsos", "0 s, 8,33 s, 16,67 s", "5 s", "0 s — cinco segundos antes"],
        ["Chaves esparsos", "0 s, 8,33 s, 16,67 s", "9 s", "8,33 s — 0,67 s antes"],
        ["Chaves densos", "a cada 1 s", "5 s", "5 s — exato"],
        ["Chaves densos", "a cada 1 s", "9 s", "9 s — exato"],
      ],
      note:
        "O quanto um corte pode se deslocar é propriedade do arquivo, não do MediaChef: gravações de celular e de programas de captura costumam colocar um quadro-chave por segundo, enquanto arquivos exportados para streaming podem separá-los em oito segundos ou mais. Se o corte precisa ser exato no quadro, use um editor de vídeo, que recodifica para chegar lá.",
    },
    {
      id: "changes",
      title: "O que muda e o que fica como estava",
      lead:
        "Quase nada muda, e é justamente esse o sentido da receita. A lista é curta porque copiar toca em muito pouco.",
      head: ["Propriedade", "Depois do corte", "Observação"],
      rows: [
        ["Qualidade da imagem", "Idêntica", "São escritos os mesmos quadros já codificados. Nunca há perda de geração."],
        ["Codec de vídeo", "Sem mudança", "H.264 entra, H.264 sai. O que a origem usava é preservado."],
        ["Resolução", "Sem mudança", "Use a receita de redimensionar se precisar de menos pixels."],
        ["Áudio", "Copiado, não recodificado", "A trilha mantém o codec e o bitrate originais."],
        ["Contêiner", "MP4", "O resultado é escrito como MP4 qualquer que seja o contêiner de origem."],
        ["O original", "Intacto", "Um arquivo novo é escrito ao lado; nada é sobrescrito."],
      ],
    },
    {
      id: "format",
      title: "Como escrever os tempos",
      lead:
        "Os dois campos aceitam horas, minutos e segundos separados por dois-pontos. O campo do fim é o que mais gera dúvida.",
      head: ["O que você quer", "Início", "Fim"],
      rows: [
        ["Os primeiros trinta segundos", "00:00:00", "00:00:30"],
        ["De 1:30 até o final do arquivo", "00:01:30", "deixar vazio"],
        ["Um minuto do meio de uma gravação longa", "01:12:00", "01:13:00"],
        ["A última parte, a partir de 2:05", "00:02:05", "deixar vazio"],
      ],
      note:
        "O fim é uma posição na linha do tempo, não uma duração: para dez segundos começando no minuto um, escreva 00:01:00 e 00:01:10, não 00:00:10.",
    },
  ],

  whyTitle: "Por que cortar no seu próprio computador",
  whyBullets: [
    {
      h: "Nada é enviado.",
      p: "Cortar costuma ser a primeira coisa feita com o material bruto, que é exatamente o material que você não mostrou a ninguém. Ele fica no seu disco.",
    },
    {
      h: "Não há espera nenhuma.",
      p: "Uma ferramenta web precisa receber o arquivo inteiro antes de tirar dez segundos dele. Aqui o trabalho acaba em centésimos de segundo, com um arquivo de qualquer tamanho.",
    },
    {
      h: "Não custa qualidade.",
      p: "A maioria dos cortadores online recodifica, então cada corte custa uma geração. Copiar o fluxo não custa nada, e você pode cortar o mesmo arquivo quantas vezes quiser.",
    },
    {
      h: "Sem limite de tamanho.",
      p: "Uma gravação de duas horas não é problema aqui, e é justamente o tamanho que as ferramentas web recusam.",
    },
    {
      h: "Vários de uma vez.",
      p: "Solte uma pasta inteira: a fila passa por eles e diz onde cada trecho ficou.",
    },
  ],

  notForTitle: "Quando a receita é a errada",
  notForLead:
    "Copiar o fluxo é o que torna esta receita rápida e sem perda, e é também o que a limita. Estes são os casos em que outra coisa serve melhor.",
  notFor: [
    {
      h: "O corte precisa cair num quadro exato.",
      p: "Como medido acima, o início recua para o quadro-chave mais próximo, que em alguns arquivos são vários segundos. Um corte exato no quadro exige recodificação, que é o que um editor de vídeo faz.",
    },
    {
      h: "Você quer remover um pedaço do meio.",
      p: "Esta receita tira um trecho contínuo. Remover uma seção do meio significa produzir dois trechos e juntá-los, e isso é edição, não corte.",
    },
    {
      h: "Você vai comprimir de qualquer forma.",
      p: "Então corte primeiro e comprima depois: essa ordem custa uma recodificação em vez de duas, e o corte em si continua de graça.",
    },
    {
      h: "Você precisa de outro formato no fim.",
      p: "A saída é MP4 com os fluxos originais dentro. Se precisa de WebM, de um GIF ou só do áudio, use a receita correspondente; essas recodificam por natureza.",
    },
  ],

  faqTitle: "Perguntas",
  faq: [
    {
      q: "Cortar perde qualidade?",
      a: "Não, nenhuma. Os quadros codificados são copiados intocados, então a imagem do trecho é bit a bit a mesma do original. Essa é a diferença em relação à maioria dos cortadores online, que recodificam e custam uma geração de qualidade a cada corte.",
    },
    {
      q: "Por que meu corte começou antes do que pedi?",
      a: "Porque um corte só pode começar num quadro-chave — guardado inteiro — e seu arquivo não tinha nenhum no ponto pedido. Medimos isso: num arquivo com chaves a cada 8,33 segundos, pedir para começar no segundo 5 produziu um trecho começando em 0. Num arquivo com chaves a cada segundo, o mesmo pedido caiu exato. É propriedade do arquivo, não do aplicativo.",
    },
    {
      q: "Como consigo um corte exato no quadro?",
      a: "Não consegue, sem recodificar: o quadro que você quer não existe como imagem completa no arquivo. Se a exatidão importa mais que velocidade e qualidade, use um editor de vídeo, que decodifica e recodifica para lhe dar qualquer quadro que você apontar.",
    },
    {
      q: "Quanto tempo leva?",
      a: "Cerca de 0,03 segundo nas nossas medições, e não cresce com a duração do trecho: cinco segundos e quinze levaram o mesmo. Recodificar a mesma origem levou de 1,3 a 2,0 segundos, cerca de cinquenta vezes mais.",
    },
    {
      q: "Como escrevo o início e o fim?",
      a: "Como HH:MM:SS — horas, minutos, segundos. 00:01:30 é um minuto e meio. O fim é uma posição, não uma duração: para dez segundos começando no minuto um, escreva 00:01:00 e 00:01:10.",
    },
    {
      q: "E se eu deixar o fim vazio?",
      a: "O trecho vai do seu ponto de início até o final do arquivo. É o jeito mais rápido de cortar uma cauda longa — uma gravação que continuou depois de a reunião acabar, por exemplo.",
    },
    {
      q: "Posso remover um pedaço do meio e ficar com o resto?",
      a: "Não num passo só. Esta receita produz um trecho contínuo. Remover uma seção do meio significa fazer dois trechos e juntá-los, o que é trabalho de um editor e não de um corte.",
    },
    {
      q: "O arquivo original é alterado?",
      a: "Não. O trecho é escrito ao lado como clip.trim.mp4, e a origem não é modificada, renomeada nem apagada. Você pode tirar vários trechos diferentes do mesmo arquivo em sequência.",
    },
    {
      q: "O que acontece com o som?",
      a: "Ele é copiado junto com a imagem, mantendo o codec e o bitrate originais. Nenhuma das duas trilhas é recodificada.",
    },
    {
      q: "Existe limite de duração ou de tamanho?",
      a: "Não. O MediaChef não impõe nenhum, e como o trabalho é copiar e não calcular, um arquivo de duas horas não é mais lento de cortar que um de dois minutos. O limite é o espaço livre em disco, que o aplicativo confere antes de começar.",
    },
    {
      q: "Quais formatos posso cortar?",
      a: "Tudo que o FFmpeg lê: MP4, MKV, MOV, WebM, AVI, TS e o resto. O resultado é escrito como MP4 com os fluxos de vídeo e áudio originais dentro.",
    },
    {
      q: "Posso cortar vários vídeos de uma vez?",
      a: "Sim, embora todos recebam o mesmo início e fim. Solte todos no tabuleiro, adicione a receita, e a fila fará um após o outro.",
    },
    {
      q: "Funciona sem internet?",
      a: "Sim, totalmente. O FFmpeg viaja dentro do download, então cortar não toca a rede em momento algum. Só a transcrição precisa baixar um modelo uma vez, e essa é outra receita.",
    },
    {
      q: "Tem marca d'água ou versão paga?",
      a: "Não. O MediaChef é código aberto sob GPL-3.0, sem versão paga, e como nada é recodificado, não haveria nem onde acrescentar uma marca d'água.",
    },
    {
      q: "Funciona no Windows e no Linux?",
      a: "Nas três plataformas. Há instalador para Windows, AppImage e .deb para Linux, e DMG para macOS com Apple Silicon. A receita se comporta igual em todas.",
    },
  ],

  ctaTitle: "Tire esse trecho",
  ctaSub: `MediaChef ${FACTS.version} — grátis, código aberto, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Comprimir vídeo — tamanhos e bitrates medidos" },
    { page: "gif", label: "Vídeo para GIF — tamanhos medidos para cada ajuste" },
    { page: "catalog", label: `As ${FACTS.recipeCount} receitas, por categoria` },
  ],
} as const;
