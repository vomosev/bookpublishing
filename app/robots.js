export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/dashboard',
    },
    sitemap: 'https://bookpublishing.geo-drops.com/sitemap.xml',
  };
}