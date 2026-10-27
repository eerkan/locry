import type { PrivacyContent } from '../privacy-content';

export const pt: PrivacyContent = {
  lang: 'pt',
  meta: {
    title: 'Política de Privacidade — Locry',
    description:
      'O Locry guarda suas notas e tarefas criptografadas no seu dispositivo. Sem servidor, sem conta, sem rastreamento. O que o Locry guarda, o que o Google Drive e os modelos de IA envolvem e como você mantém o controle.',
  },
  title: 'Política de Privacidade',
  updated: 'Última atualização',
  intro:
    'O Locry é um app de notas e tarefas gratuito e de código aberto que roda inteiramente no seu navegador. Esta política explica quais dados ele trata. Em resumo: suas notas nunca chegam ao desenvolvedor, não existe servidor que as guarde, nem conta, nem rastreamento.',
  sections: [
    {
      heading: 'O que o Locry guarda, e onde',
      body: [
        'Suas notas, tarefas, listas e configurações ficam apenas no seu dispositivo, no armazenamento do navegador (IndexedDB), criptografadas com AES-256-GCM. A chave é derivada da sua chave de acesso (passkey) ou da sua chave de recuperação e existe apenas na memória do dispositivo enquanto o cofre está aberto. O desenvolvedor não tem acesso aos seus dados nem guarda nenhuma cópia.',
        'Para que a tela de bloqueio possa aparecer antes do desbloqueio, algumas informações ficam sem criptografia no dispositivo: nomes e cores dos cofres e preferências do app, como idioma e tema.',
      ],
    },
    {
      heading: 'Sem conta, anúncios ou rastreamento',
      body: [
        'O Locry não tem cadastro nem contas de usuário. Não usa anúncios, cookies de rastreamento nem rastreadores de terceiros. O próprio aplicativo (seus cofres, notas, tarefas e perguntas) nunca é contado nem medido.',
        'Apenas as páginas públicas deste site (a página inicial, esta política e os termos) contam visitas com o [GoatCounter](https://www.goatcounter.com), uma ferramenta de análise de código aberto que respeita a privacidade: sem cookies, nada armazenado no seu dispositivo e sem dados pessoais. Ele registra o endereço da página, o site de onde você veio, o tamanho da tela e o navegador, o sistema operacional e o país deduzidos da requisição; seu endereço IP não é armazenado. As visitas não são contadas quando seu navegador envia Do Not Track ou Global Privacy Control.',
      ],
    },
    {
      heading: 'Google Drive (opcional)',
      body: [
        'Se você conectar o Google Drive para backups ou sincronização, o Locry pede apenas a permissão drive.appdata: uma pasta oculta no seu Drive que só o Locry consegue acessar. Ele não pode ver, ler nem alterar nenhum outro arquivo do seu Drive.',
        'Tudo é criptografado no seu dispositivo antes do envio, então o Google guarda apenas dados criptografados, junto com nomes, tamanhos e datas dos arquivos e um rótulo do dispositivo (por exemplo “iPhone · Safari”). O token de acesso emitido pelo Google fica só na memória e é descartado quando o cofre é bloqueado. Você pode desconectar a qualquer momento nas Configurações ou nas [permissões da sua Conta do Google](https://myaccount.google.com/permissions).',
        'O uso e a transferência, pelo Locry, de informações recebidas das APIs do Google seguem a [Política de Dados do Usuário dos Serviços de API do Google](https://developers.google.com/terms/api-services-user-data-policy), incluindo os requisitos de Uso Limitado (Limited Use). Essas informações servem apenas para guardar e ler seus próprios backups e cópias de sincronização criptografados; não são compartilhadas com ninguém, não são usadas para anúncios e não são lidas por pessoas.',
      ],
    },
    {
      heading: 'Recursos de IA (opcionais)',
      body: [
        'Se você ativar a busca inteligente ou “Pergunte às suas notas”, os arquivos do modelo de IA são baixados uma vez do Hugging Face (huggingface.co). Como em qualquer download, o Hugging Face pode ver seu endereço IP e quais arquivos foram pedidos. Suas notas e perguntas são processadas apenas no seu dispositivo e nunca são enviadas a nenhum serviço de IA.',
      ],
    },
    {
      heading: 'Hospedagem',
      body: [
        'Este site é servido pelo GitHub Pages. Como qualquer serviço de hospedagem, o GitHub pode registrar dados técnicos, como endereços IP, para fins de segurança; veja a [Declaração de Privacidade do GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Se você usa o Locry no servidor de outra pessoa, valem para esse servidor as políticas de quem o administra.',
      ],
    },
    {
      heading: 'Doações',
      body: [
        'Os links de doação levam a plataformas externas (como GitHub Sponsors ou Ko-fi), com suas próprias políticas de privacidade. O Locry não recebe nenhum dado delas.',
      ],
    },
    {
      heading: 'O controle é seu',
      body: [
        'Você pode apagar seus dados a qualquer momento: exclua um cofre nas Configurações ou limpe os dados deste site no navegador. Os backups no Google Drive podem ser excluídos nas Configurações, e o acesso do Locry pode ser revogado na sua Conta do Google. Como o desenvolvedor não tem dados sobre você, não há nada a solicitar ou apagar do nosso lado.',
      ],
    },
    {
      heading: 'Alterações',
      body: ['Se esta política mudar, a nova versão será publicada nesta página com uma nova data.'],
    },
    {
      heading: 'Contato',
      body: ['Dúvidas sobre esta política: abra uma issue em [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Voltar ao Locry',
};
