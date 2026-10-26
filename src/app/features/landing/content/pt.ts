import type { LandingContent } from '../landing-content';

export const pt: LandingContent = {
  lang: 'pt',
  meta: {
    title: 'Locry — Notas e tarefas com criptografia de ponta a ponta e passkey',
    description:
      'Locry é um app de notas e tarefas de código aberto e sem servidor que roda no navegador: Markdown, tarefas, login com passkey, AES-256, sincronização criptografada e busca com IA privada.',
    ogImageAlt: 'O editor de notas do Locry: uma nota em Markdown com prévia ao vivo, notas e tarefas na barra lateral',
  },
  nav: {
    features: 'Recursos',
    security: 'Segurança',
    sync: 'Sincronização',
    selfHost: 'Hospedar',
    faq: 'Perguntas',
    open: 'Abrir o Locry',
    skip: 'Pular para o conteúdo',
  },
  sections: {
    overview: 'Visão geral',
    features: 'Recursos',
    tasks: 'Tarefas',
    security: 'Segurança',
    vaults: 'Cofres',
    sync: 'Sincronização',
    search: 'Busca inteligente',
    compare: 'Comparação',
    selfHost: 'Hospedagem própria',
    faq: 'Perguntas',
  },
  ui: {
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    language: 'Idioma',
    flow: 'Fluxo de desbloqueio',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Código aberto · Sem servidor · Funciona offline',
    title: 'Suas notas e tarefas,',
    accent: 'trancadas só com a sua chave.',
    lead:
      'O Locry é um app de notas e tarefas com criptografia de ponta a ponta que roda no seu navegador. Sem conta, sem senha, sem servidor: seu cofre abre com sua digital, seu rosto ou o PIN do dispositivo — com uma chave de acesso (passkey).',
    start: 'Comece grátis',
    resume: 'Abrir seu cofre',
    github: 'Ver no GitHub',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', '11 idiomas'],
    screenshotAlt: 'O editor Markdown do Locry: lista de notas à esquerda, editor e prévia ao vivo à direita',
    phoneAlt: 'O Locry no celular: a lista de notas',
  },
  summary: {
    title: 'O Locry em resumo',
    text:
      'O Locry é um app web gratuito e de código aberto que guarda suas notas e tarefas no seu dispositivo, criptografadas com uma chave que só você consegue abrir. Nada é enviado a um servidor; se quiser, ele faz backup e sincroniza com seus outros dispositivos pelo Google Drive, sempre criptografado.',
    facts: [
      { term: 'O que é', detail: 'Notas em Markdown e listas de tarefas em um só app' },
      { term: 'Preço', detail: 'Gratuito e de código aberto' },
      { term: 'Conta', detail: 'Nenhuma; você entra com uma passkey' },
      { term: 'Criptografia', detail: 'AES-256-GCM por registro; a chave é derivada da sua passkey' },
      { term: 'Onde ficam os dados', detail: 'No seu dispositivo, no armazenamento criptografado do navegador' },
      { term: 'Sincronização', detail: 'Opcional, com criptografia de ponta a ponta pelo Google Drive' },
      { term: 'Plataformas', detail: 'Navegadores modernos; instalável no macOS, Windows, Linux, iOS e Android (PWA)' },
      { term: 'Idiomas', detail: 'Inglês, turco, chinês, espanhol, árabe, português, indonésio, francês, japonês, russo e alemão' },
    ],
  },
  features: {
    title: 'Tudo o que você precisa para anotar, sem abrir mão da privacidade',
    lead: 'O Locry parece simples, mas é completo para o dia a dia. Cada recurso funciona dentro do seu cofre criptografado.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Notas em Markdown',
        text: 'Modos de edição, dividido e prévia; barra de ferramentas e atalhos, etiquetas, fixar, arquivo e listas de tarefas marcáveis.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tarefas',
        text: 'Visões Caixa de entrada, Hoje, Próximas e Concluídas; listas coloridas, subtarefas, prioridades, prazos e arrastar e soltar.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Login com passkey',
        text: 'Sem senha. O cofre é descriptografado com uma passkey que você libera com digital, rosto ou PIN do dispositivo; uma chave de recuperação fica de reserva.',
      },
      {
        icon: 'lucideLayers',
        title: 'Vários cofres',
        text: 'Cofres totalmente separados, como Pessoal e Trabalho, cada um com suas passkeys, chave de recuperação, backups e configurações.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Celular e computador',
        text: 'Sincronização com criptografia de ponta a ponta pelo Google Drive. Exclusões são levadas junto e edições conflitantes nunca se perdem.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Busca inteligente',
        text: 'Busque pelo sentido, não só pelas palavras. O modelo de IA roda no seu navegador; suas notas nunca são enviadas a um serviço de IA.',
      },
      {
        icon: 'lucideArchive',
        title: 'Backups criptografados',
        text: 'Backups .locry em um único arquivo, compactados e criptografados, para um arquivo ou para o Google Drive, automaticamente se quiser.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Offline e instalável',
        text: 'Abre sem internet. Instale na área de trabalho ou na tela inicial como um app.',
      },
      {
        icon: 'lucideCommand',
        title: 'Feito para o teclado',
        text: 'Paleta de comandos ⌘K, “/” para buscar, N para nova nota, T para nova tarefa e atalhos G para navegar.',
      },
    ],
  },
  security: {
    title: 'Como a criptografia funciona?',
    lead:
      'No Locry, a confiança se apoia na matemática, não em um servidor. A chave só existe no seu dispositivo, e só na memória enquanto o cofre está aberto.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Ao desbloquear, seu dispositivo usa a extensão WebAuthn PRF para gerar um segredo exclusivo da sua passkey. Ele nunca sai do dispositivo.',
      },
      {
        title: '2. Chave',
        text: 'O HKDF-SHA-256 deriva desse segredo uma chave que abre a chave aleatória de 256 bits do seu cofre.',
      },
      {
        title: '3. Registros',
        text: 'Cada nota e cada tarefa é criptografada separadamente com AES-256-GCM, vinculada ao seu tipo e ao seu id.',
      },
    ],
    tableTitle: 'Modelo de segurança',
    rows: [
      ['Chave do cofre', '256 bits aleatórios; só na memória, não exportável'],
      ['Login', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Recuperação', 'Chave de recuperação de 256 bits em um compartimento de chave separado'],
      ['Dados', 'AES-256-GCM por registro, com contexto autenticado (AAD)'],
      ['Backups e sincronização', 'gzip + AES-256-GCM; cabeçalho autenticado'],
      ['Prévia', 'Higienizada com DOMPurify, imagens remotas bloqueadas, Content Security Policy'],
      ['Bloqueio automático', 'A chave é apagada da memória após o tempo de inatividade que você escolher'],
    ],
    note: 'Se você perder suas passkeys e sua chave de recuperação, ninguém — nem o Locry — consegue acessar seus dados. Isso não é uma falha; é o projeto.',
  },
  vaults: {
    title: 'Pessoal e trabalho, em cofres separados',
    text:
      'Cada cofre é independente: chave de criptografia, passkeys, chave de recuperação, backups e configurações próprios. Trocar de cofre bloqueia o que está aberto; os dados de um cofre nunca aparecem em outro.',
    bullets: [
      'Escolha o cofre na tela de bloqueio; o último usado é lembrado',
      'Dê nome e cor aos cofres; troque pela barra lateral com um clique',
      'Ao restaurar um backup, ele é mesclado no mesmo cofre ou adicionado como um novo',
    ],
    alt: 'A tela de bloqueio do Locry: escolher um cofre e desbloquear com passkey',
  },
  sync: {
    title: 'O mesmo cofre no celular e no computador',
    lead:
      'Não existe servidor do Locry para sincronizar. Cada dispositivo grava sua própria cópia criptografada do cofre em uma pasta oculta de app no seu Google Drive e mescla as cópias dos seus outros dispositivos.',
    bullets: [
      'O Google só vê arquivos criptografados; nunca conteúdo, títulos ou etiquetas',
      'Notas e tarefas que você exclui também são excluídas nos outros dispositivos',
      'Se uma nota mudou em dois dispositivos, a versão mais antiga fica como nota “(conflito)”',
      'Passkeys adicionadas e o nome e a cor do cofre também são sincronizados',
      'Funciona com o app aberto: ao desbloquear, ao voltar para a aba e depois de alterações',
    ],
    stepsTitle: 'Como configurar',
    steps: [
      'No computador: Configurações → Sincronização entre dispositivos → Ativar sincronização.',
      'No celular, abra o Locry no mesmo endereço e adicione-o à tela inicial.',
      'Restaurar de um backup → Google Drive → escolha seu cofre em Cofres sincronizados.',
      'Desbloqueie com sua passkey sincronizada ou sua chave de recuperação; a sincronização começa sozinha.',
    ],
    alt: 'A sincronização entre dispositivos nas configurações do Locry, com os dispositivos que sincronizam o cofre',
  },
  search: {
    title: 'IA que busca pelo sentido e preserva sua privacidade',
    text:
      'Busque “planos de férias” e encontre também sua nota “Reserva de hotel em Florianópolis”. O modelo padrão é o EmbeddingGemma do Google, e as Configurações oferecem cinco modelos multilíngues. O modelo é baixado uma vez e roda inteiramente no seu navegador.',
    bullets: [
      'Busca por palavras e por sentido juntas, em qualquer idioma do app',
      'Os vetores são guardados criptografados e ficam fora de backups e da sincronização',
      'Sugestões de “notas parecidas”; ⌘K para buscar de qualquer lugar',
      'Opcional: nada é baixado se você não ativar',
    ],
    alt: 'A página de busca do Locry: resultados semânticos em notas e tarefas',
  },
  tasks: {
    title: 'Tarefas, bem ao lado das suas notas',
    text: 'Veja o que fazer na visão Hoje, não perca nada atrasado e vincule tarefas às notas a que pertencem.',
    bullets: [
      'Visões inteligentes: Caixa de entrada, Hoje, Próximas, Concluídas',
      'Listas coloridas, subtarefas, prioridades e prazos',
      'Ordenação por arrastar e soltar, inclusão rápida com T',
    ],
    alt: 'Tarefas no Locry: a visão Hoje com prioridades e prazos',
  },
  selfHost: {
    title: 'Rode no seu próprio servidor',
    lead:
      'O Locry é de código aberto e tem apenas arquivos estáticos. Roda no Docker com um comando e pode servir seu próprio domínio com HTTPS automático.',
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'O contêiner não guarda dados: as notas ficam criptografadas no navegador; remover o contêiner não muda nada.',
      'Usuário sem root, sistema de arquivos somente leitura, privilégios removidos.',
      'Com COMPOSE_PROFILES=https e LOCRY_DOMAIN, o Caddy obtém o certificado automaticamente.',
    ],
    github: 'Código-fonte e documentação de instalação',
  },
  compare: {
    title: 'O Locry comparado aos apps de notas na nuvem comuns',
    lead: 'A maioria dos apps de notas guarda seus dados nos próprios servidores e pode lê-los. O Locry torna isso impossível desde o início.',
    headers: ['', 'App de notas na nuvem comum', 'Locry'],
    rows: [
      ['Onde ficam seus dados', 'Nos servidores da empresa', 'No seu dispositivo, criptografados'],
      ['Quem pode ler', 'O provedor do serviço', 'Só você'],
      ['Login', 'E-mail e senha', 'Passkey, sem senha'],
      ['Conta', 'Obrigatória', 'Desnecessária'],
      ['Offline', 'Limitado', 'Completo'],
      ['Busca com IA', 'As notas vão para um servidor', 'Roda no seu navegador'],
      ['Código-fonte', 'Fechado', 'Aberto'],
    ],
  },
  faq: {
    title: 'Perguntas frequentes',
    items: [
      {
        q: 'O que é o Locry?',
        a: 'O Locry é um app gratuito e de código aberto que roda no seu navegador e guarda notas em Markdown e tarefas com criptografia de ponta a ponta. Não precisa de conta nem de senha; o cofre abre com uma passkey.',
      },
      {
        q: 'Onde meus dados ficam guardados?',
        a: 'No seu dispositivo, criptografados, no armazenamento IndexedDB do navegador. O Locry não tem servidor que guarde seus dados. Se você ativar backups no Google Drive ou a sincronização, só arquivos criptografados vão para o Drive.',
      },
      {
        q: 'O Locry é gratuito?',
        a: 'Sim. O Locry é gratuito e de código aberto; o código-fonte está no GitHub. Você também pode rodá-lo no seu próprio servidor com Docker.',
      },
      {
        q: 'O que é uma passkey e por que não há senha?',
        a: 'Uma passkey é uma forma de login resistente a phishing que usa sua digital, seu rosto ou o PIN do dispositivo. O Locry deriva a chave de criptografia da passkey pela extensão WebAuthn PRF, então não existe senha para adivinhar ou vazar.',
      },
      {
        q: 'O que acontece se eu perder minha passkey?',
        a: 'Você abre o cofre com a chave de recuperação de 256 bits que guardou na configuração e adiciona uma nova passkey. Se perder as passkeys e a chave de recuperação, ninguém consegue acessar os dados.',
      },
      {
        q: 'Como sincronizo o celular e o computador?',
        a: 'Ative a Sincronização entre dispositivos nas Configurações; no celular, abra o Locry no mesmo endereço e escolha Restaurar de um backup → Google Drive → seu cofre em Cofres sincronizados. Cada dispositivo grava sua própria cópia criptografada no Drive e mescla as outras.',
      },
      {
        q: 'O Google consegue ler minhas notas?',
        a: 'Não. Os arquivos de backup e sincronização são criptografados com AES-256-GCM no seu dispositivo antes de chegar ao Drive. O Locry só acessa a própria pasta oculta de app (drive.appdata) e não vê seus outros arquivos do Drive.',
      },
      {
        q: 'A busca com IA envia minhas notas para algum lugar?',
        a: 'Não. O modelo de linguagem multilíngue é baixado uma vez e roda em um Web Worker no seu navegador. Suas notas nunca são enviadas a um serviço de IA.',
      },
      {
        q: 'Funciona offline?',
        a: 'Sim. O Locry é um app web instalável (PWA) e funciona offline depois da primeira visita. Só a sincronização com o Drive e o primeiro download do modelo precisam de internet.',
      },
      {
        q: 'Quais navegadores e dispositivos são compatíveis?',
        a: 'Navegadores compatíveis com passkeys com a extensão PRF: Chrome e Edge 118+, Safari 18+. Funcionam as Chaves do iCloud, o Gerenciador de Senhas do Google, o 1Password ou uma chave de segurança física.',
      },
      {
        q: 'Posso exportar meus dados?',
        a: 'Sim. Baixe nas Configurações um backup .locry criptografado em um único arquivo; ele abre em outro dispositivo ou endereço com uma passkey ou a chave de recuperação.',
      },
    ],
  },
  cta: {
    title: 'Suas notas continuam suas.',
    text: 'A configuração leva um minuto: dê nome ao cofre, crie uma passkey e guarde sua chave de recuperação.',
    start: 'Usar o Locry grátis',
    github: 'Ver o código-fonte',
  },
  footer: {
    tagline: 'Notas e tarefas com criptografia de ponta a ponta.',
    openSource: 'Código aberto',
    madeWith: 'Feito com Angular, Web Crypto e WebAuthn, sem servidor.',
    links: 'Links',
  },
  support: {
    title: 'Apoie o Locry',
    text: 'O Locry é gratuito, de código aberto e não tem anúncios nem rastreamento. Se ele é útil para você, você pode apoiar o desenvolvimento.',
    crypto: 'Cripto',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  howTo: {
    name: 'Criar um cofre criptografado no Locry',
    description: 'Passos para criar no Locry um cofre de notas e tarefas com criptografia de ponta a ponta que abre com uma passkey.',
    steps: [
      { name: 'Abrir o Locry', text: 'Abra o Locry no navegador e clique em “Comece grátis”.' },
      { name: 'Dar nome ao cofre', text: 'Escolha um nome e uma cor para o cofre, por exemplo “Pessoal”.' },
      { name: 'Criar uma passkey', text: 'Crie uma passkey com sua digital, seu rosto ou o PIN do dispositivo.' },
      { name: 'Guardar a chave de recuperação', text: 'Guarde a chave de recuperação no gerenciador de senhas e confirme um dos grupos dela.' },
    ],
  },
};
