import { getCollection } from 'astro:content';

export async function GET() {
  const canonStories = await getCollection('canon');
  const novels = await getCollection('novels');
  const pages = await getCollection('pages');

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/canon/', priority: '0.9', changefreq: 'monthly' },
    { url: '/novels/', priority: '0.9', changefreq: 'monthly' },
  ];

  const canonRoutes = canonStories.map(story => ({
    url: `/canon/${story.slug}/`,
    priority: '0.8',
    changefreq: 'monthly'
  }));

  const novelRoutes = novels.map(novel => ({
    url: `/novels/${novel.slug}/`,
    priority: '0.8',
    changefreq: 'monthly'
  }));

  const pageRoutes = pages.map(page => ({
    url: `/${page.slug}/`,
    priority: '0.7',
    changefreq: 'monthly'
  }));

  const allRoutes = [...staticRoutes, ...canonRoutes, ...novelRoutes, ...pageRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>https://sirconandoyle.com${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
