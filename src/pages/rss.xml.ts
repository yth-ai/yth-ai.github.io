import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const articles = (await getCollection('articles'))
    .filter((a) => !a.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || b.slug.localeCompare(a.slug));

  const research = (await getCollection('research'))
    .filter((r) => !r.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || b.slug.localeCompare(a.slug));

  const columns = (await getCollection('column'))
    .filter((c) => !c.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || b.slug.localeCompare(a.slug));

  const items = [
    ...articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.description || '',
      link: `/articles/${a.slug}/`,
      categories: a.data.tags,
    })),
    ...research.map((r) => ({
      title: r.data.title,
      pubDate: r.data.date,
      description: r.data.description || '',
      link: `/research/${r.slug}/`,
      categories: [r.data.category, ...r.data.tags],
    })),
    ...columns.map((c) => ({
      title: `[${c.data.series} Vol.${c.data.volume}] ${c.data.title}`,
      pubDate: c.data.date,
      description: c.data.description || '',
      link: `/column/${c.slug}/`,
      categories: c.data.tags,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Maxwell',
    description: '大模型算法专家的数字平台 — 专栏 / 文章 / 研究',
    site: context.site!,
    items,
    customData: '<language>zh-CN</language>',
  });
}
