const baseUrl = 'https://bookpublishing.geo-drops.com';

export default function sitemap() {
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}