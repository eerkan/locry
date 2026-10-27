import type { PrivacyContent } from '../privacy-content';

export const ja: PrivacyContent = {
  lang: 'ja',
  meta: {
    title: 'プライバシーポリシー — Locry',
    description:
      'Locry はメモとタスクを暗号化してあなたのデバイスに保存します。サーバー、アカウント、トラッキングはありません。Locry が保存するもの、Google Drive と AI モデルのダウンロードについて、そしてあなたが管理を保つ方法。',
  },
  title: 'プライバシーポリシー',
  updated: '最終更新日',
  intro:
    'Locry は、すべてブラウザー内で動作する無料のオープンソースのメモ・タスクアプリです。このポリシーでは、Locry が扱うデータについて説明します。要点：あなたのメモが開発者に届くことはなく、保存するサーバーもなく、アカウントもトラッキングもありません。',
  sections: [
    {
      heading: 'Locry が保存するものと保存場所',
      body: [
        'メモ、タスク、リスト、設定は、あなたのデバイスのブラウザーのストレージ（IndexedDB）にのみ、AES-256-GCM で暗号化して保存されます。鍵はパスキー（または回復キー）から導出され、保管庫が開いている間だけデバイスのメモリ上に存在します。開発者はあなたのデータにアクセスできず、コピーも持っていません。',
        'ロック解除前にロック画面を表示するため、一部の情報は暗号化せずにデバイスに保存されます：保管庫の名前と色、言語やテーマなどのアプリの設定です。',
      ],
    },
    {
      heading: 'アカウント、解析、広告はありません',
      body: [
        'Locry には登録もユーザーアカウントもありません。解析ツール、広告、トラッキング Cookie、第三者のトラッカーは使用していません。',
      ],
    },
    {
      heading: 'Google Drive（任意）',
      body: [
        'バックアップや同期のために Google Drive を接続すると、Locry は drive.appdata の権限だけを求めます。これは Drive 内の、Locry だけがアクセスできる非表示のフォルダーです。Drive 内のほかのファイルを表示、読み取り、変更することはできません。',
        'すべてはアップロード前にデバイス上で暗号化されるため、Google が保存するのは暗号化されたデータと、ファイル名、サイズ、日時、デバイスのラベル（例：「iPhone · Safari」）だけです。Google が発行するアクセストークンはメモリ上にのみ保持され、保管庫をロックすると破棄されます。接続はいつでも設定画面または [Google アカウントの権限](https://myaccount.google.com/permissions) から解除できます。',
        'Google API から受け取った情報の Locry による使用と転送は、限定的使用（Limited Use）の要件を含む [Google API サービスのユーザーデータに関するポリシー](https://developers.google.com/terms/api-services-user-data-policy) に準拠します。これらの情報は、あなた自身の暗号化されたバックアップと同期用コピーの保存と読み取りにのみ使われ、誰とも共有されず、広告に使われず、人が読むこともありません。',
      ],
    },
    {
      heading: 'AI 機能（任意）',
      body: [
        'スマート検索や「メモに質問する」をオンにすると、AI モデルのファイルが Hugging Face（huggingface.co）から一度だけダウンロードされます。通常のダウンロードと同様に、Hugging Face にはあなたの IP アドレスと要求されたファイルがわかります。メモと質問はデバイス上でのみ処理され、AI サービスに送られることはありません。',
      ],
    },
    {
      heading: 'ホスティング',
      body: [
        'このサイトは GitHub Pages で配信されています。ほかのホスティングと同様に、GitHub はセキュリティのために IP アドレスなどの技術データを記録することがあります。詳しくは [GitHub のプライバシーに関する声明](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement) をご覧ください。他者のサーバーで Locry を使う場合、そのサーバーには運営者のポリシーが適用されます。',
      ],
    },
    {
      heading: '寄付',
      body: [
        '寄付のリンクは外部のプラットフォーム（GitHub Sponsors や Ko-fi など）につながっており、それぞれのプライバシーポリシーが適用されます。Locry がそれらからデータを受け取ることはありません。',
      ],
    },
    {
      heading: '管理するのはあなたです',
      body: [
        'データはいつでも削除できます。設定画面で保管庫を削除するか、ブラウザーでこのサイトのデータを消去してください。Google Drive のバックアップは設定画面から削除でき、Locry のアクセス権は Google アカウントで取り消せます。開発者はあなたに関するデータを持っていないため、こちらに請求や削除を依頼する必要はありません。',
      ],
    },
    {
      heading: '変更',
      body: ['このポリシーを変更した場合は、新しい日付とともにこのページで公開します。'],
    },
    {
      heading: 'お問い合わせ',
      body: ['このポリシーに関するご質問は [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) で issue を作成してください。'],
    },
  ],
  back: 'Locry に戻る',
};
