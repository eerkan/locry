import type { LegalContent } from '../privacy-content';

export const pt: LegalContent = {
  lang: 'pt',
  meta: {
    title: 'Termos de Serviço — Locry',
    description:
      'Os termos de uso do Locry, o app gratuito e de código aberto de notas e tarefas criptografadas: seus dados e chaves, uso aceitável, serviços de terceiros, respostas de IA e ausência de garantia.',
  },
  title: 'Termos de Serviço',
  updated: 'Última atualização',
  intro:
    'Estes termos valem quando você usa o Locry neste endereço. O Locry é um app de notas e tarefas gratuito e de código aberto que roda inteiramente no seu navegador; não há conta nem nada para comprar.',
  sections: [
    {
      heading: 'Uso do Locry',
      body: ['Ao usar o Locry, você concorda com estes termos. Se não concordar, por favor não o use.'],
    },
    {
      heading: 'Código aberto',
      body: [
        'O código-fonte do Locry está disponível sob a [Licença MIT](https://github.com/eerkan/locry/blob/main/LICENSE). Você pode usá-lo, copiá-lo, modificá-lo e distribuí-lo nos termos dessa licença; estes termos cobrem o site neste endereço.',
      ],
    },
    {
      heading: 'Seus dados e suas chaves',
      body: [
        'Suas notas e tarefas são criptografadas no seu dispositivo, e só suas chaves de acesso (passkeys) e sua chave de recuperação conseguem abri-las. Guardá-las em segurança é responsabilidade sua: se você perder ambas, ninguém, nem o desenvolvedor, consegue recuperar seus dados.',
        'Faça backups com frequência. Os navegadores podem apagar dados de sites, por exemplo quando falta espaço ou quando você limpa os dados de navegação.',
      ],
    },
    {
      heading: 'Uso aceitável',
      body: [
        'Use o Locry apenas de forma lícita. Não tente prejudicar o funcionamento do site nem use-o para abusar dos serviços de terceiros aos quais ele se conecta.',
      ],
    },
    {
      heading: 'Serviços de terceiros',
      body: [
        'Os recursos opcionais dependem do Google Drive, do Hugging Face e do GitHub Pages, cujos próprios termos valem quando você os usa, como os [Termos de Serviço do Google](https://policies.google.com/terms) e os [Termos de Serviço do GitHub](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'Respostas de IA',
      body: [
        'Os resultados da busca inteligente e as respostas de “Pergunte às suas notas” vêm de pequenos modelos de IA que rodam no seu dispositivo. Podem estar incompletos ou errados; confira as fontes antes de confiar neles.',
      ],
    },
    {
      heading: 'Sem garantia',
      body: [
        'O Locry é fornecido “no estado em que se encontra”, sem garantia de nenhum tipo, expressa ou implícita, incluindo adequação a uma finalidade específica e disponibilidade ininterrupta.',
        'Na medida permitida por lei, o desenvolvedor não se responsabiliza por perda de dados nem por qualquer outro dano decorrente do uso do Locry.',
      ],
    },
    {
      heading: 'Alterações',
      body: [
        'Estes termos podem mudar. A nova versão será publicada nesta página com uma nova data; continuar usando o Locry depois disso significa aceitá-la.',
      ],
    },
    {
      heading: 'Contato',
      body: ['Dúvidas sobre estes termos: abra uma issue em [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Voltar ao Locry',
};
