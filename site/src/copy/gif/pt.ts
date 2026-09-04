// Гайд «видео в GIF», португальский. Поисковые формулировки: «converter vídeo
// em gif», «transformar vídeo em gif», «fazer gif de vídeo». Разделитель
// дробной части — запятая, единицы MB/KB.
import { FACTS } from "../../facts";

export default {
  title: "Vídeo para GIF — grátis e sem conexão, no seu próprio computador",
  description:
    "Como fazer um GIF de um vídeo no seu computador: escolha quadros por segundo e largura, aperte começar. Sem enviar nada, sem limite de tamanho, sem marca d'água. Dentro, os tamanhos medidos para cada ajuste.",
  h1: "Vídeo para GIF, no seu próprio computador",
  crumb: "Vídeo para GIF",

  answer:
    "Solte o vídeo no MediaChef, escolha a receita «Vídeo para GIF», defina os quadros por segundo e a largura, e aperte começar. O GIF aparece ao lado do arquivo original. Nada é enviado: o FFmpeg trabalha na sua máquina, então não há teto de tamanho nem fila de espera. Nos ajustes padrão — 15 quadros por segundo e 480 pixels de largura — um GIF custa cerca de 130 KB por segundo de vídeo: dez segundos saem por volta de 1,3 MB.",

  facts: [
    { k: "O que você precisa", v: `MediaChef ${FACTS.version} — um download, o FFmpeg já vem dentro` },
    { k: "Funciona sem conexão", v: "Sim, totalmente — a rede não é tocada em momento algum" },
    { k: "O que aceita", v: "MP4, MKV, MOV, WebM, AVI, TS e tudo mais que o FFmpeg lê" },
    { k: "Ajustes", v: "Quadros/s 10 / 15 / 24 · largura 320 / 480 / 640 pixels" },
    { k: "O que você recebe", v: "clip.gif, gravado ao lado do vídeo de origem" },
    { k: "Preço", v: "Grátis, código aberto (GPL-3.0), sem conta e sem marca d'água" },
  ],

  toc: [
    { id: "how", label: "Como fazer" },
    { id: "fps", label: "Quantos quadros" },
    { id: "width", label: "Qual largura" },
    { id: "size", label: "Quanto vai pesar" },
    { id: "duration", label: "Como a duração influencia" },
    { id: "why", label: "Por que no seu computador" },
    { id: "notfor", label: "Quando GIF é má ideia" },
    { id: "faq", label: "Perguntas" },
  ],

  stepsTitle: "Como transformar um vídeo em GIF",
  steps: [
    {
      h: "Baixe o MediaChef",
      p: "Um arquivo para macOS, Windows ou Linux. O FFmpeg viaja dentro do download: não há nada para instalar em separado nem para acrescentar ao PATH.",
    },
    {
      h: "Solte o vídeo no tabuleiro",
      p: "O MediaChef lê o arquivo com o ffprobe e deixa só as receitas que servem. O cartão do GIF aparece para qualquer vídeo; o formato de origem não importa.",
    },
    {
      h: "Escolha «Vídeo para GIF»",
      p: "Dois ajustes: quadros por segundo e largura em pixels. A altura é calculada a partir da largura e as proporções se mantêm — um clipe 16:9 com largura 480 sai em 480×270.",
    },
    {
      h: "Aperte começar e pegue o arquivo",
      p: "O GIF aparece ao lado do vídeo como clip.gif. A fila mostra o andamento e o caminho final; solte vários vídeos de uma vez e eles serão feitos um após o outro.",
    },
  ],
  shotAlt:
    "MediaChef pronto para converter: o tabuleiro espera um arquivo de vídeo e à direita está a fila de tarefas.",
  shotCaption: "O tabuleiro onde o vídeo cai. As receitas aparecem quando o MediaChef termina de ler o arquivo.",

  tables: [
    {
      id: "fps",
      title: "Quantos quadros por segundo escolher",
      lead:
        "Os quadros por segundo decidem o quão fluido o movimento parece e, em proporção direta, quanto o arquivo pesa. Um GIF guarda cada quadro quase separadamente, então o dobro de quadros significa mais ou menos o dobro do tamanho.",
      head: ["Quadros/s", "Como fica", "Escolha quando"],
      rows: [
        ["10", "Aos saltos no movimento rápido, tranquilo no lento", "Gravações de tela, um cursor se movendo, texto aparecendo. O menor arquivo."],
        ["15", "Fluido o bastante para quase tudo", "O valor padrão. Reações, cenas curtas e qualquer coisa em que você tenha dúvida."],
        ["24", "Como no cinema, sem saltos visíveis", "Movimento rápido, esporte, panorâmicas — e só se o tamanho servir."],
      ],
      note:
        "A contagem é exata: quadros = quadros/s × segundos. Dez segundos a 15 dão 150 quadros; a 24, já são 240.",
    },
    {
      id: "width",
      title: "Qual largura escolher",
      lead:
        "Você define a largura e a altura é calculada para manter a proporção; o redimensionamento usa o filtro Lanczos. Na tabela, no que se transforma um vídeo 16:9.",
      head: ["Largura", "16:9 se torna", "Escolha quando"],
      rows: [
        ["320 px", "320×180", "Conversas e mensageiros, onde o GIF aparece pequeno de qualquer forma. Cerca da metade de 480."],
        ["480 px", "480×270", "O valor padrão. Legível num post ou numa mensagem e ainda leve."],
        ["640 px", "640×360", "Quando o detalhe importa: uma demonstração de interface, texto pequeno na tela. Cerca de 1,5 vez mais que 480."],
      ],
      note:
        "Nada é ampliado: se a origem tem 320 pixels de largura, continua com 320 mesmo que você peça 640.",
    },
    {
      id: "size",
      title: "Quanto o arquivo vai pesar",
      lead:
        "Medido, não estimado: dez segundos de vídeo 1280×720 com movimento em todo o quadro, passados por esta mesma receita. Uma imagem calma comprime melhor e uma carregada pior, então trate isto como a metade de cima da faixa.",
      head: ["Quadros/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0,45 MB", "0,88 MB", "1,36 MB"],
        ["15", "0,65 MB", "1,28 MB", "1,98 MB"],
        ["24", "0,98 MB", "1,96 MB", "3,05 MB"],
      ],
      note:
        "O ajuste mais barato e o mais caro diferem em quase sete vezes, e há dois cliques entre eles. Se o GIF sair pesado demais, baixe primeiro a largura: aos olhos custa menos do que perder quadros.",
    },
    {
      id: "duration",
      title: "Como a duração influencia o tamanho",
      lead:
        "O crescimento é linear, porque cada segundo acrescenta os seus próprios quadros. Nos ajustes padrão — 15 quadros, largura 480 — um segundo custa cerca de 130 KB, e esse número quase não se move com a duração.",
      head: ["Duração", "Tamanho no padrão", "Por segundo"],
      rows: [
        ["3 s", "0,37 MB", "128 KB"],
        ["5 s", "0,64 MB", "131 KB"],
        ["10 s", "1,28 MB", "131 KB"],
        ["20 s", "2,56 MB", "131 KB"],
        ["30 s", "3,82 MB", "130 KB"],
      ],
      note:
        "Por isso a duração é a sua alavanca mais forte: cortar um clipe de trinta segundos para oito reduz o arquivo em cerca de quatro vezes, e nenhum ajuste chega perto disso.",
    },
  ],

  whyTitle: "Por que converter no seu próprio computador",
  whyBullets: [
    {
      h: "Nada é enviado.",
      p: "Uma edição não publicada, a gravação de uma chamada privada, uma captura de tela com dados de um cliente: nada sai do disco. Não existe cópia num servidor cuja política de retenção você teria de acreditar.",
    },
    {
      h: "Sem limite de tamanho.",
      p: "Conversores online terminam entre 100 MB e 2 GB e colocam você numa fila. Uma gravação de tela de quatro gigas converte igual a uma de quatro megas.",
    },
    {
      h: "Sem esperar upload.",
      p: "Fazer o GIF é rápido; num serviço web a parte lenta é enviar o vídeo primeiro. Localmente esse passo não existe.",
    },
    {
      h: "Grátis, sem conta e sem marca d'água.",
      p: "Código aberto sob GPL-3.0: sem cadastro, sem período de teste e sem nada estampado no canto do seu GIF.",
    },
    {
      h: "Vários de uma vez.",
      p: "Solte uma pasta inteira de clipes: a fila passa por todos e diz onde cada GIF ficou.",
    },
  ],

  notForTitle: "Quando GIF é má ideia",
  notForLead:
    "GIF é um formato de imagem de 1987 fazendo um trabalho que os formatos de vídeo fazem melhor. Vale escolhê-lo de propósito, e estes são os casos em que não vale.",
  notFor: [
    {
      h: "Você precisa de som.",
      p: "Um GIF não tem trilha de áudio nenhuma: o formato não tem onde colocá-la. Se o clipe precisa de som, deixe-o como vídeo.",
    },
    {
      h: "Você precisa de cor fiel.",
      p: "Um quadro de GIF guarda no máximo 256 cores. Gradientes, tons de pele e cenas escuras formam faixas visíveis. Quem mais sofre é o material filmado; uma interface chapada ou desenhos animados quase não notam.",
    },
    {
      h: "O clipe é longo.",
      p: "A 130 KB por segundo, um GIF de dois minutos dá cerca de 16 MB. O mesmo clipe em MP4 costuma ser várias vezes menor e parecer melhor.",
    },
    {
      h: "Ele vai para um lugar que vai recodificar de qualquer forma.",
      p: "Várias plataformas de conversa e redes transformam o GIF enviado em vídeo do lado delas. Ali você pagou o preço de tamanho do GIF por nada.",
    },
  ],

  faqTitle: "Perguntas",
  faq: [
    {
      q: "Quanto tempo o GIF pode ter?",
      a: "O MediaChef não impõe limite: o limite é o seu disco, e o aplicativo confere o espaço livre antes de começar. O limite prático é o tamanho: nos ajustes padrão cada segundo custa cerca de 130 KB, então um GIF de um minuto dá uns 8 MB e um de cinco minutos uns 39 MB. Se ele vai numa mensagem, corte o clipe primeiro.",
    },
    {
      q: "Por que meu GIF pesa mais que o vídeo de onde saiu?",
      a: "Porque o GIF guarda os quadros quase separadamente, enquanto o MP4 guarda a diferença entre eles. Com material filmado de verdade isso faz o MP4 ser várias vezes menor com a mesma imagem. Não é algo que o MediaChef possa consertar: é o que o formato é.",
    },
    {
      q: "GIF tem som?",
      a: "Não. O formato GIF não tem trilha de áudio, então o som é descartado na conversão. Se você precisa do som como arquivo separado, use a receita «Tirar o áudio para MP3» no vídeo original.",
    },
    {
      q: "Por que as cores ficam piores que no vídeo?",
      a: "Um quadro de GIF aceita no máximo 256 cores e o vídeo tem milhões. Gradientes suaves — um céu, um fade, uma cena escura — viram faixas visíveis. Gravações de tela e gráficos chapados quase não perdem nada, porque já tinham poucas cores.",
    },
    {
      q: "Posso fazer um GIF só de uma parte do vídeo?",
      a: "Sim, em dois passos: com a receita «Cortar sem recodificar» você tira o trecho que quer e desse trecho faz o GIF. Cortar primeiro é também a maneira mais barata de reduzir o arquivo: a duração influencia mais do que qualquer ajuste.",
    },
    {
      q: "Quais quadros por segundo e qual largura escolher?",
      a: "Comece pelos valores padrão, 15 quadros e 480 pixels: legível num post e dez segundos dão cerca de 1,3 MB. Baixe para 320 se o arquivo tiver de ser pequeno e vá para 640 quando houver texto pequeno que precise continuar legível. Use 24 só para movimento rápido, e 10 para gravações de tela, onde os saltos quase não aparecem.",
    },
    {
      q: "Como deixo o GIF menor?",
      a: "Nesta ordem: encurte o clipe, depois reduza a largura, depois os quadros. A duração é linear, então passar de trinta segundos para oito economiza cerca de quatro vezes. Baixar de 640 para 320 pixels economiza cerca de três. Passar de 24 para 15 quadros economiza um terço, mas é a mudança que mais se nota.",
    },
    {
      q: "Tem marca d'água ou versão paga?",
      a: "Não. O MediaChef é código aberto sob GPL-3.0, sem nenhuma versão paga, e não escreve nada na imagem além da conversão que você pediu.",
    },
    {
      q: "Funciona sem internet?",
      a: "Sim, totalmente. O FFmpeg viaja dentro do download, então fazer um GIF não toca a rede em momento algum. Só a transcrição precisa baixar um modelo uma vez, e essa é outra receita.",
    },
    {
      q: "De quais formatos de vídeo posso converter?",
      a: "De tudo que o FFmpeg consegue ler: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV e o resto. O MediaChef confere o arquivo com o ffprobe e oferece a receita do GIF para qualquer vídeo que tenha imagem.",
    },
    {
      q: "Posso converter vários vídeos de uma vez?",
      a: "Sim. Solte todos no tabuleiro, adicione a receita e a fila fará um após o outro, com o andamento e o tempo restante de cada um.",
    },
    {
      q: "O GIF fica em loop?",
      a: "Sim: GIFs gravados assim repetem indefinidamente, e é assim que todos os visualizadores e navegadores os tocam.",
    },
    {
      q: "Um GIF pode ter fundo transparente?",
      a: "O formato aceita uma cor transparente, mas converter um vídeo comum não lhe dá nada para tornar transparente: os quadros de vídeo são totalmente opacos. Transparência só faz sentido com material que já a tinha.",
    },
    {
      q: "Funciona no Windows e no Linux ou só no macOS?",
      a: "Nos três. Há instalador para Windows, AppImage e .deb para Linux, e DMG para macOS com Apple Silicon. A receita e os ajustes são idênticos em todos.",
    },
  ],

  ctaTitle: "Faça um GIF desse clipe",
  ctaSub: `MediaChef ${FACTS.version} — grátis, código aberto, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Converter MP4 em MP3 — grátis e sem conexão" },
    { page: "transcribe", label: "Transcrever áudio para texto com Whisper, sem conexão" },
    { page: "catalog", label: `As ${FACTS.recipeCount} receitas, por categoria` },
  ],
} as const;
