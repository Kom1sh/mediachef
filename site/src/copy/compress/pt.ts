// Гайд «сжать видео», португальский. Поисковые формулировки: «comprimir
// vídeo», «reduzir tamanho de vídeo», «diminuir vídeo».
import { FACTS } from "../../facts";

export default {
  title: "Comprimir vídeo — grátis, sem conexão, sem limite de tamanho",
  description:
    "Como reduzir o tamanho de um vídeo no seu computador: escolha um dos três níveis de qualidade e aperte começar. Sem enviar nada, sem teto de tamanho, sem marca d'água. Dentro, tamanhos medidos, bitrates resultantes e o caso em que comprimir aumenta o arquivo.",
  h1: "Comprimir vídeo no seu próprio computador",
  crumb: "Comprimir vídeo",

  answer:
    "Solte o vídeo no MediaChef, escolha a receita «Comprimir vídeo», selecione um nível de qualidade e aperte começar. O arquivo menor aparece ao lado do original, que fica intacto. Cada passo da escala — 23, 28, 33 — reduz o arquivo em cerca de metade: nas nossas medições 23 deu 5,5–10 Mbit/s, 28 deu 2,7–4,6 e 33 por volta de 1,6. Nada é enviado, não há teto de tamanho, e vinte segundos de 1080p são recodificados em menos de dois segundos.",

  facts: [
    { k: "O que você precisa", v: `MediaChef ${FACTS.version} — um download, o FFmpeg já vem dentro` },
    { k: "Funciona sem conexão", v: "Sim, totalmente — a rede não é tocada em momento algum" },
    { k: "Níveis de qualidade", v: "23 (alta) · 28 (padrão) · 33 (arquivo pequeno)" },
    { k: "Codec", v: `Vídeo H.264, áudio AAC a 128 kbps (FFmpeg ${FACTS.ffmpeg})` },
    { k: "O que você recebe", v: "clip.compressed.mp4 ao lado do original, que é preservado" },
    { k: "Velocidade", v: "20 s de 1080p30 em 1,3–2,0 s num notebook com Apple Silicon" },
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
      h: "Escolha «Comprimir vídeo» e um nível",
      p: "Um único ajuste: 23, 28 ou 33, onde um número menor significa imagem melhor e arquivo maior. 28 é o padrão e o primeiro palpite certo para quase tudo.",
    },
    {
      h: "Aperte começar e compare",
      p: "O resultado fica ao lado do original como clip.compressed.mp4. O arquivo de origem não é modificado, então você pode ver os dois e repetir a receita em outro nível se errou.",
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
        ["33", "Visivelmente mais mole; aparecem blocos no movimento rápido e em cenas escuras", "O arquivo tem de caber em algo específico. Escolha de propósito, não por inércia."],
      ],
      note:
        "Como o que se define é a qualidade, o mesmo nível dá um arquivo pequeno numa gravação de tela estática e grande em material filmado na mão com folhas se movendo. Dois clipes no nível 28 podem diferir várias vezes.",
    },
    {
      id: "size",
      title: "O que você recebe de fato",
      lead:
        "Medido em dois clipes de 1080p30 com vinte segundos: um com gradientes suaves e movimento contínuo, outro com detalhe fino em todo o quadro — mais ou menos a ponta fácil e a difícil do que um codificador encontra. A coluna do bitrate é a que se transfere para o seu material; os megabytes são destes clipes.",
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
      h: "Nada é enviado.",
      p: "O vídeo que você quer reduzir costuma ser justamente o que ainda não publicou. Ele fica no seu disco: sem cópia num servidor cuja política de retenção você teria de acreditar.",
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
      p: "Cortar primeiro é de graça: a receita «Cortar sem recodificar» copia o fluxo em vez de recalculá-lo, em centésimos de segundo e sem perda. Corte e depois comprima, se ainda estiver grande.",
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
      a: "Depende do bitrate de onde você parte, não do tamanho do arquivo. Nas nossas medições o nível 28 produziu 2,7–4,6 Mbit/s e o 33 cerca de 1,6 Mbit/s, seja qual fosse a origem. Divida seu bitrate atual por esses números para estimar: uma gravação de celular a 40 Mbit/s cai umas dez vezes no nível 28, enquanto um download a 3 Mbit/s quase não se move.",
    },
    {
      q: "O que significam os números 23, 28 e 33?",
      a: "É o fator de taxa constante do H.264: uma meta de qualidade em que menor é melhor. O codificador gasta o bitrate necessário para alcançar essa qualidade no seu material. Por isso o mesmo nível dá tamanhos bem diferentes numa gravação de tela estática e numa filmagem na mão.",
    },
    {
      q: "Qual nível devo escolher?",
      a: "Comece no 28 — é o padrão e está certo para compartilhar, enviar e subir. Use 23 quando o vídeo importar por si e você for olhar de perto ou reeditar. Use 33 só quando o arquivo tiver de caber num limite específico; o amolecimento aparece no movimento rápido e em cenas escuras.",
    },
    {
      q: "Por que comprimir aumentou meu arquivo?",
      a: "Porque você pediu uma qualidade maior do que o arquivo já tinha. Medimos isso: um arquivo de 1,66 Mbit/s saiu 2,7 vezes maior no nível 23 e 1,5 vez maior no nível 28. Se um arquivo já tem bitrate baixo, comprimir mais só remove qualidade — veja o que você tem antes de rodar a receita.",
    },
    {
      q: "Muda a resolução?",
      a: "Não. 1080p na entrada é 1080p na saída; a receita muda como a imagem é guardada, não o tamanho dela. Se você quer menos pixels, use «Reduzir para 720p», que ataca o tamanho na origem e combina com esta.",
    },
    {
      q: "O que acontece com o som?",
      a: "O áudio é recodificado para AAC a 128 kbps, fosse o que fosse antes. É transparente o bastante para fala e para música num clipe que você compartilha. Se precisa do áudio original intacto, extraia antes com «Tirar o áudio para MP3» ou guarde o arquivo de origem.",
    },
    {
      q: "O arquivo original é sobrescrito?",
      a: "Não. O resultado é escrito ao lado como clip.compressed.mp4, e a origem não é modificada, renomeada nem apagada. Você pode rodar a receita de novo em outro nível e comparar.",
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
      a: "Menor, sim, mas cada passada perde qualidade de forma permanente e a segunda ganha muito menos que a primeira. Se o resultado ainda pesa, volte ao original e use um número maior em vez de empilhar passadas sobre a cópia comprimida.",
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
