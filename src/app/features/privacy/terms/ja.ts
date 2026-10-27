import type { LegalContent } from '../privacy-content';

export const ja: LegalContent = {
  lang: 'ja',
  meta: {
    title: '利用規約 — Locry',
    description:
      '暗号化されたメモとタスクの無料オープンソースアプリ Locry の利用規約。データと鍵、許容される利用、第三者サービス、AI の回答、無保証について。',
  },
  title: '利用規約',
  updated: '最終更新日',
  intro:
    'この規約は、このアドレスで Locry を利用する場合に適用されます。Locry は、すべてブラウザー内で動作する無料のオープンソースのメモ・タスクアプリです。アカウントはなく、購入するものもありません。',
  sections: [
    {
      heading: 'Locry の利用',
      body: ['Locry を利用することで、この規約に同意したものとみなされます。同意できない場合は利用しないでください。'],
    },
    {
      heading: 'オープンソース',
      body: [
        'Locry のソースコードは [MIT ライセンス](https://github.com/eerkan/locry/blob/main/LICENSE) で公開されています。このライセンスに従って使用、複製、改変、配布できます。この規約は、このアドレスのサイトに適用されます。',
      ],
    },
    {
      heading: 'データと鍵',
      body: [
        'メモとタスクはデバイス上で暗号化され、開けるのはあなたのパスキーと回復キーだけです。これらを安全に保管するのはあなたの責任です。両方を失うと、開発者を含め誰もデータを復元できません。',
        '定期的にバックアップを取ってください。ストレージが不足したときや閲覧データを消去したときなど、ブラウザーがサイトのデータを削除することがあります。',
      ],
    },
    {
      heading: '許容される利用',
      body: [
        'Locry は合法的な方法でのみ利用してください。サイトの運営を妨げたり、接続先の第三者サービスを不正に利用するために使ったりしないでください。',
      ],
    },
    {
      heading: '第三者サービス',
      body: [
        '任意の機能は Google Drive、Hugging Face、GitHub Pages を利用しており、それらを使う際には [Google 利用規約](https://policies.google.com/terms) や [GitHub 利用規約](https://docs.github.com/site-policy/github-terms/github-terms-of-service) など、各サービスの規約が適用されます。',
      ],
    },
    {
      heading: 'AI の回答',
      body: [
        'スマート検索の結果と「メモに質問する」の回答は、デバイス上で動く小さな AI モデルによるものです。不完全または誤っている場合があるため、頼る前に出典を確認してください。',
      ],
    },
    {
      heading: '無保証',
      body: [
        'Locry は「現状のまま」提供され、特定目的への適合性や中断のない利用を含め、明示または黙示を問わずいかなる保証もありません。',
        '法律で認められる範囲で、開発者は Locry の利用によって生じたデータの損失その他の損害について責任を負いません。',
      ],
    },
    {
      heading: '変更',
      body: [
        'この規約は変更されることがあります。新しい版は新しい日付とともにこのページで公開され、その後も Locry を利用した場合は新しい規約に同意したものとみなされます。',
      ],
    },
    {
      heading: 'お問い合わせ',
      body: ['この規約に関するご質問は [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) で issue を作成してください。'],
    },
  ],
  back: 'Locry に戻る',
};
