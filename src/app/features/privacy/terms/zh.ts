import type { LegalContent } from '../privacy-content';

export const zh: LegalContent = {
  lang: 'zh',
  meta: {
    title: '服务条款 — Locry',
    description:
      'Locry（免费、开源的加密笔记与任务应用）的使用条款：你的数据和密钥、可接受的使用、第三方服务、AI 回答以及不提供担保。',
  },
  title: '服务条款',
  updated: '最后更新',
  intro:
    '当你在此地址使用 Locry 时，适用本条款。Locry 是一款完全在浏览器中运行的免费开源笔记与任务应用；没有账号，也没有需要购买的东西。',
  sections: [
    {
      heading: '使用 Locry',
      body: ['使用 Locry 即表示你同意本条款。如果你不同意，请不要使用。'],
    },
    {
      heading: '开源',
      body: [
        'Locry 的源代码以 [MIT 许可证](https://github.com/eerkan/locry/blob/main/LICENSE) 发布。你可以在该许可证下使用、复制、修改和分发它；本条款适用于此地址上的网站。',
      ],
    },
    {
      heading: '你的数据和密钥',
      body: [
        '你的笔记和任务在你的设备上加密，只有你的通行密钥和恢复密钥能打开它们。妥善保管它们是你的责任：如果两者都丢失，任何人（包括开发者）都无法恢复你的数据。',
        '请定期备份。浏览器可能会删除网站数据，例如在存储空间不足或你清除浏览数据时。',
      ],
    },
    {
      heading: '可接受的使用',
      body: [
        '请仅以合法方式使用 Locry。不要试图干扰本网站，也不要利用它滥用其所连接的第三方服务。',
      ],
    },
    {
      heading: '第三方服务',
      body: [
        '可选功能依赖 Google 云端硬盘、Hugging Face 和 GitHub Pages，使用时适用它们各自的条款，例如 [Google 服务条款](https://policies.google.com/terms) 和 [GitHub 服务条款](https://docs.github.com/site-policy/github-terms/github-terms-of-service)。',
      ],
    },
    {
      heading: 'AI 回答',
      body: [
        '智能搜索的结果和“向你的笔记提问”的回答来自在你设备上运行的小型 AI 模型。它们可能不完整或有误；在依赖它们之前请核对来源。',
      ],
    },
    {
      heading: '不提供担保',
      body: [
        'Locry 按“原样”提供，不附带任何明示或暗示的担保，包括对特定用途的适用性和不间断的可用性。',
        '在法律允许的范围内，开发者不对因使用 Locry 而造成的任何数据丢失或其他损害承担责任。',
      ],
    },
    {
      heading: '变更',
      body: ['本条款可能会变更。新版本将在本页面发布并注明新的日期；此后继续使用 Locry 即表示你接受新条款。'],
    },
    {
      heading: '联系方式',
      body: ['对本条款有疑问：请在 [github.com/eerkan/locry](https://github.com/eerkan/locry/issues) 提交 issue。'],
    },
  ],
  back: '返回 Locry',
};
