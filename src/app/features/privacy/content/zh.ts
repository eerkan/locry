import type { PrivacyContent } from '../privacy-content';

export const zh: PrivacyContent = {
  lang: 'zh',
  meta: {
    title: '隐私政策 — Locry',
    description:
      'Locry 将你的笔记和任务加密保存在你的设备上。没有服务器、没有账号、没有跟踪。本政策说明 Locry 保存哪些数据、Google 云端硬盘和 AI 模型下载涉及什么，以及你如何掌控一切。',
  },
  title: '隐私政策',
  updated: '最后更新',
  intro:
    'Locry 是一款完全在浏览器中运行的免费开源笔记与任务应用。本政策说明它处理哪些数据。简而言之：你的笔记永远不会到达开发者手中，没有保存它们的服务器，没有账号，也没有跟踪。',
  sections: [
    {
      heading: 'Locry 保存什么、保存在哪里',
      body: [
        '你的笔记、任务、列表和设置只保存在你的设备上，位于浏览器的存储（IndexedDB）中，并使用 AES-256-GCM 加密。密钥由你的通行密钥（或恢复密钥）派生，只在保险库打开期间存在于设备内存中。开发者无法访问你的数据，也不持有任何副本。',
        '为了在解锁前显示锁定屏幕，少量信息以未加密形式保存在设备上：保险库的名称和颜色，以及语言、主题等应用偏好。',
      ],
    },
    {
      heading: '没有账号、统计分析或广告',
      body: [
        'Locry 没有注册，也没有用户账号。它不使用统计分析、广告、跟踪 Cookie 或任何第三方跟踪器。',
      ],
    },
    {
      heading: 'Google 云端硬盘（可选）',
      body: [
        '如果你连接 Google 云端硬盘用于备份或同步，Locry 只请求 drive.appdata 权限：这是你云端硬盘中只有 Locry 能访问的隐藏文件夹。它无法查看、读取或修改你云端硬盘中的其他任何文件。',
        '所有内容在上传前都会在你的设备上加密，因此 Google 只保存加密数据，以及文件名、大小、时间和设备标签（例如“iPhone · Safari”）。Google 签发的访问令牌只保存在内存中，保险库锁定时即被丢弃。你可以随时在设置中或在 [Google 账号权限](https://myaccount.google.com/permissions) 中断开连接。',
        'Locry 对从 Google API 获取的信息的使用和传输遵守 [Google API 服务用户数据政策](https://developers.google.com/terms/api-services-user-data-policy)，包括“有限使用”（Limited Use）要求。这些信息仅用于保存和读取你自己的加密备份和同步副本；不会与任何人共享，不会用于广告，也不会由人工阅读。',
      ],
    },
    {
      heading: 'AI 功能（可选）',
      body: [
        '如果你开启智能搜索或“向你的笔记提问”，AI 模型文件会从 Hugging Face（huggingface.co）下载一次。与任何下载一样，Hugging Face 可以看到你的 IP 地址和所请求的文件。你的笔记和问题只在你的设备上处理，绝不会发送给任何 AI 服务。',
      ],
    },
    {
      heading: '托管',
      body: [
        '本网站由 GitHub Pages 提供。与其他托管服务一样，GitHub 可能出于安全目的记录 IP 地址等技术数据；详见 [GitHub 隐私声明](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)。如果你在他人的服务器上使用 Locry，该服务器适用其运营者的政策。',
      ],
    },
    {
      heading: '捐赠',
      body: [
        '捐赠链接指向外部平台（例如 GitHub Sponsors 或 Ko-fi），适用其各自的隐私政策。Locry 不会从它们那里获得任何数据。',
      ],
    },
    {
      heading: '一切由你掌控',
      body: [
        '你可以随时删除数据：在设置中删除保险库，或在浏览器中清除本网站的数据。Google 云端硬盘中的备份可以在设置中删除，Locry 的访问权限可以在你的 Google 账号中撤销。由于开发者不持有任何关于你的数据，你无需向我们申请或删除任何内容。',
      ],
    },
    {
      heading: '变更',
      body: ['如果本政策有所变更，新版本将在本页面发布并注明新的日期。'],
    },
    {
      heading: '联系方式',
      body: ['对本政策有疑问：请在 [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) 提交 issue。'],
    },
  ],
  back: '返回 Locry',
};
