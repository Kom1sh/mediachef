// Гайд «сжать видео», португальский. Поисковые формулировки: «comprimir
// vídeo», «reduzir tamanho de vídeo», «diminuir vídeo».
import { FACTS } from "../../facts";

export default {
  title: "Comprimir vídeo — grátis, sem conexão, sem limite de tamanho",
  description:
    "Comprima um MP4 offline no MediaChef. Escolha um nível de qualidade ou informe o tamanho desejado em MB para respeitar um limite.",
  h1: "Comprimir vídeo no seu próprio computador",
  crumb: "Comprimir vídeo",

  answer:
    "Arraste o vídeo para o MediaChef. Para reduzir o arquivo, escolha «Comprimir vídeo (predefinição de qualidade)» e comece pelo CRF 28. Se houver um limite em MB, use «Comprimir vídeo para um tamanho» e informe o tamanho máximo. Inicie a tarefa e confira o MP4 gerado. O original fica no computador.",

  facts: [
    { k: "O que você precisa", v: `MediaChef ${FACTS.version} — um download, o FFmpeg já vem dentro` },
    { k: "Funciona sem conexão", v: "Sim, totalmente — a rede não é tocada em momento algum" },
    { k: "Níveis de qualidade", v: "23 (alta) · 28 (padrão) · 33 (arquivo pequeno)" },
    { k: "Codec", v: `CRF: Vídeo H.264, áudio AAC a 128 kbps (FFmpeg ${FACTS.ffmpeg})` },
    { k: "O que você recebe", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (MB)" },
    { k: "Velocidade", v: "CRF: 20 s de 1080p30 em 1,3–2,0 s num notebook com Apple Silicon" },
  ],

  toc: [
    { id: "how", label: "Como fazer" },
    { id: "level", label: "Qual nível escolher" },
    { id: "size", label: "O que você recebe de fato" },
    { id: "bigger", label: "Quando comprimir aumenta" },
    { id: "changes", label: "O que muda e o que não" },
    { id: "why", label: "Por que no seu computador" },
    { id: "notfor", label: "Quando a receita é a errada" },
    { id: "faq", label: "Perguntas" },
  ],

  stepsTitle: "Como comprimir um vídeo",
  steps: [
    {
      h: "Baixe o MediaChef",
      p: "Um arquivo para macOS, Windows ou Linux. O FFmpeg viaja dentro do download: não há nada para instalar em separado nem para acrescentar ao PATH.",
    },
    {
      h: "Solte o vídeo no tabuleiro",
      p: "O MediaChef lê o arquivo com o ffprobe e deixa só as receitas que servem. Qualquer vídeo recebe o cartão de comprimir, seja qual for o formato de origem.",
    },
    {
      h: "Escolha a qualidade ou o tamanho desejado",
      p: "Para reduzir o arquivo, escolha «Comprimir vídeo (predefinição de qualidade)» e comece em 28. Para um limite em MB, escolha «Comprimir vídeo para um tamanho» e informe o máximo. O aplicativo calcula a taxa de bits pela duração e pode reduzir a resolução.",
    },
    {
      h: "Clique em «Adicionar à fila»",
      p: "Confira o tamanho do arquivo no fim. A fila mostra onde o arquivo foi salvo. Por padrão, ele fica ao lado do original. O modo de qualidade gera clip.compressed.mp4. O modo por tamanho gera clip.small.mp4.",
    },
  ],
  shotAlt:
    "MediaChef pronto para converter: o tabuleiro espera um arquivo de vídeo e à direita está a fila de tarefas.",
  shotCaption: "O tabuleiro onde o vídeo cai. As receitas aparecem quando o MediaChef termina de ler o arquivo.",

  tables: [
    {
      id: "level",
      title: "Qual nível de qualidade escolher",
      lead:
        "O número define a qualidade, não o tamanho — e isso é a coisa mais útil de entender. Você está dizendo ao codificador o quão bem a imagem precisa ficar; o tamanho do arquivo é o que isso custar no seu material específico.",
      head: ["Nível", "Imagem", "Escolha quando"],
      rows: [
        ["23", "Difícil de distinguir do original a uma distância normal", "O vídeo importa por si: uma peça de portfólio, material que você vai reeditar, algo que vai para uma tela grande."],
        ["28", "Boa. A textura fina amolece se você for procurar", "O padrão. Compartilhar, subir, enviar — o nível certo enquanto não houver motivo para outro."],
        ["33", "Visivelmente mais mole; aparecem blocos no movimento rápido e em cenas escuras", "Use 33 se aceitar mais perda visual em troca de um arquivo menor. Para um limite em MB, use a receita por tamanho."],
      ],
      note:
        "Como o que se define é a qualidade, o mesmo nível dá um arquivo pequeno numa gravação de tela estática e grande em material filmado na mão com folhas se movendo. Dois clipes no nível 28 podem diferir várias vezes.",
    },
    {
      id: "size",
      title: "O que você recebe de fato",
      lead:
        "Medições com CRF em dois vídeos de 20 segundos em 1080p30, um com gradientes e outro com detalhes finos. Os tamanhos e taxas de bits correspondem apenas a esses vídeos.",
      head: ["Nível", "Clipe suave", "Clipe detalhado", "Bitrate resultante"],
      rows: [
        ["Origem", "47,0 MB", "23,9 MB", "10–20 Mbit/s"],
        ["23", "24,1 MB", "13,2 MB", "5,5–10,1 Mbit/s"],
        ["28", "11,0 MB", "6,4 MB", "2,7–4,6 Mbit/s"],
        ["33", "4,0 MB", "3,8 MB", "1,6–1,7 Mbit/s"],
      ],
      note:
        "O padrão se mantém nos dois clipes: cada passo da escala reduz o arquivo em cerca de metade. Ir de 23 para 33 deu 6,1× no clipe suave e 3,5× no detalhado — quanto mais difícil o material, menos há para ganhar.",
    },
    {
      id: "bigger",
      title: "Quando comprimir aumenta o arquivo",
      lead:
        "Isso surpreende, então vale dizer com clareza: pedir uma qualidade maior do que o arquivo já tem obriga o codificador a gastar mais bits do que o arquivo contém. Medimos isso devolvendo o resultado do nível 33 para a entrada.",
      head: ["Aplicado a um arquivo de 1,66 Mbit/s", "Resultado", "Efeito"],
      rows: [
        ["Nível 23", "10,6 MB a partir de 4,0 MB", "2,7 vezes maior"],
        ["Nível 28", "6,1 MB a partir de 4,0 MB", "1,5 vez maior"],
        ["Nível 33", "3,4 MB a partir de 4,0 MB", "1,2 vez menor, e mais mole"],
      ],
      note:
        "Então veja o que você tem antes de comprimir. Uma gravação de celular a 40 Mbit/s tem muito a dar; algo já baixado da web a 2 Mbit/s quase nada, e recodificar só tira qualidade.",
    },
    {
      id: "changes",
      title: "O que muda e o que fica como estava",
      lead:
        "A receita recodifica; não reenquadra. Saber exatamente no que ela toca poupa uma rodada de surpresas.",
      head: ["Propriedade", "Depois de comprimir", "Observação"],
      rows: [
        ["Resolução", "Sem mudança", "1080p entra, 1080p sai. Para menos pixels existe a receita de redimensionar."],
        ["Quadros por segundo", "Sem mudança", "Todos os quadros são mantidos; muda só como são guardados."],
        ["Duração", "Sem mudança", "Para encurtar o clipe existe a receita de cortar."],
        ["Codec de vídeo", "H.264", "Codificado com o preset veryfast — daí os vinte segundos em menos de dois."],
        ["Áudio", "AAC a 128 kbps", "Sempre recodificado, seja o que fosse antes. Suficiente para fala e música num clipe que você compartilha."],
        ["O original", "Intacto", "Um arquivo novo é escrito ao lado; nada é sobrescrito."],
      ],
    },
  ],

  whyTitle: "Por que comprimir no seu próprio computador",
  whyBullets: [
    {
      h: "Sem enviar arquivos para a nuvem.",
      p: "O MediaChef comprime o vídeo no seu computador. O arquivo original e a versão comprimida ficam no seu dispositivo.",
    },
    {
      h: "Sem limite de tamanho.",
      p: "Compressores online terminam entre 100 MB e 2 GB, que é exatamente a faixa onde comprimir começa a importar. Um arquivo de quatro gigas é tratado como um de quatro megas.",
    },
    {
      h: "Mais rápido que enviar.",
      p: "Vinte segundos de 1080p são recodificados aqui em menos de dois. Num serviço web o mesmo clipe tem de ir e voltar primeiro.",
    },
    {
      h: "O original é preservado.",
      p: "O resultado é um arquivo novo ao lado da origem, então um nível escolhido errado custa uma passada a mais, não o material.",
    },
    {
      h: "Uma pasta inteira de uma vez.",
      p: "Solte todos os clipes: a fila passa por eles e diz onde cada resultado ficou.",
    },
  ],

  notForTitle: "Quando a receita é a errada",
  notForLead:
    "Comprimir é recodificar, e recodificar sempre custa algo. Estes são os casos em que outra receita faz o trabalho melhor ou mais barato.",
  notFor: [
    {
      h: "Você só precisa de um pedaço do clipe.",
      p: "Se você só precisa de um trecho, use «Cortar vídeo sem recodificar» primeiro. Ela copia as faixas sem recodificar. Comprima o trecho se ele ainda for grande demais.",
    },
    {
      h: "O arquivo já está muito comprimido.",
      p: "Como medido acima, um arquivo de 1,66 Mbit/s cresceu 2,7 vezes no nível 23. Veja o bitrate primeiro; se já for baixo, não há nada a ganhar.",
    },
    {
      h: "Você precisa de menos pixels, não de menos bits.",
      p: "Esta receita mantém a resolução. Se um arquivo 4K pesa porque é 4K, a receita «Reduzir para 720p» ataca a causa real.",
    },
    {
      h: "Você está arquivando um master.",
      p: "H.264 em qualquer destes níveis tem perda, e a perda se acumula em cada recodificação futura. Deixe o master como está e comprima cópias.",
    },
  ],

  faqTitle: "Perguntas",
  faq: [
    {
      q: "Quanto meu arquivo vai diminuir?",
      a: "Depende do vídeo de origem e de sua duração. Com CRF 28, os dois vídeos da tabela ficaram com 11,0 e 6,4 MB. Para um limite específico, use o modo por tamanho.",
    },
    {
      q: "O que significam os números 23, 28 e 33?",
      a: "É o fator de taxa constante do H.264: uma meta de qualidade em que menor é melhor. O codificador gasta o bitrate necessário para alcançar essa qualidade no seu material. Por isso o mesmo nível dá tamanhos bem diferentes numa gravação de tela estática e numa filmagem na mão.",
    },
    {
      q: "Qual nível devo escolher?",
      a: "Comece em 28. Experimente 23 para preservar mais detalhes ou 33 para um arquivo menor. Para um limite em MB, use «Comprimir vídeo para um tamanho» e confira o resultado.",
    },
    {
      q: "Por que comprimir aumentou meu arquivo?",
      a: "Porque você pediu uma qualidade maior do que o arquivo já tinha. Medimos isso: um arquivo de 1,66 Mbit/s saiu 2,7 vezes maior no nível 23 e 1,5 vez maior no nível 28. Se um arquivo já tem bitrate baixo, comprimir mais só remove qualidade — veja o que você tem antes de rodar a receita.",
    },
    {
      q: "Muda a resolução?",
      a: "O modo de qualidade preserva a resolução. O modo por tamanho pode reduzi-la para caber na taxa de bits disponível.",
    },
    {
      q: "O que acontece com o som?",
      a: "O modo de qualidade recodifica o áudio para AAC a 128 kbps. O modo por tamanho pode usar uma taxa de áudio menor. Guarde o original se precisar do áudio intacto.",
    },
    {
      q: "O arquivo original é sobrescrito?",
      a: "Os dois modos gravam um novo MP4 ao lado do original: clip.compressed.mp4 no modo de qualidade e clip.small.mp4 no modo por tamanho. O original é preservado.",
    },
    {
      q: "Quanto tempo leva?",
      a: "Num notebook com Apple Silicon, vinte segundos de 1080p30 levaram de 1,3 a 2,0 segundos — cerca de dez a quinze vezes mais rápido do que assistir. Clipes mais longos escalam quase linearmente e a fila mostra o tempo restante. O preset veryfast é o que compra essa velocidade.",
    },
    {
      q: "Existe limite de tamanho?",
      a: "Não. O MediaChef não impõe nenhum; o limite é o espaço livre em disco, e o aplicativo confere antes de começar. Essa é a principal diferença prática em relação aos compressores web, que costumam terminar entre 100 MB e 2 GB.",
    },
    {
      q: "Comprimir duas vezes deixa ainda menor?",
      a: "Uma segunda passada pode diminuir ou aumentar o arquivo e piorar a imagem. Se o primeiro resultado exceder o limite, use a receita por tamanho no original.",
    },
    {
      q: "Quais formatos posso comprimir?",
      a: "Tudo que o FFmpeg lê: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV e o resto. A saída é sempre MP4 com H.264, que é a combinação que toca em qualquer lugar sem plugin.",
    },
    {
      q: "Posso comprimir vários vídeos de uma vez?",
      a: "Sim. Solte todos no tabuleiro, adicione a receita, e a fila fará um após o outro com o andamento e o tempo restante de cada um.",
    },
    {
      q: "Funciona sem internet?",
      a: "Sim, totalmente. O FFmpeg viaja dentro do download, então comprimir não toca a rede em momento algum. Só a transcrição precisa baixar um modelo uma vez, e essa é outra receita.",
    },
    {
      q: "Tem marca d'água ou versão paga?",
      a: "Não. O MediaChef é código aberto sob GPL-3.0, sem versão paga, e não escreve nada na imagem além da recodificação que você pediu.",
    },
    {
      q: "Funciona no Windows e no Linux?",
      a: "Nas três plataformas. Há instalador para Windows, AppImage e .deb para Linux, e DMG para macOS com Apple Silicon. A receita e seus níveis são idênticos em todas.",
    },
  ],

  ctaTitle: "Deixe esse arquivo menor",
  ctaSub: `MediaChef ${FACTS.version} — grátis, código aberto, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Vídeo para GIF — tamanhos medidos para cada ajuste" },
    { page: "mp3", label: "Converter MP4 em MP3 — grátis e sem conexão" },
    { page: "catalog", label: `As ${FACTS.recipeCount} receitas, por categoria` },
  ],
} as const;
