import BookDetail from '../../../components/BookDetail';

const siteUrl = 'https://bookpublishing.geo-drops.com';

function formatBookLabel(slug) {
  if (!slug) {
    return 'Book Details';
  }

  return String(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const bookLabel = formatBookLabel(slug);
  const canonicalUrl = `${siteUrl}/books/${encodeURIComponent(slug)}`;
  const description = `Discover ${bookLabel}, explore its story and author, and learn how bookpublishing supports independent writers.`;

  return {
    title: `${bookLabel} | bookpublishing`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${bookLabel} | bookpublishing`,
      description,
      url: canonicalUrl,
      siteName: 'bookpublishing',
      type: 'book',
    },
    twitter: {
      card: 'summary',
      title: `${bookLabel} | bookpublishing`,
      description,
    },
  };
}

export default async function BookPage({ params }) {
  const { slug } = await params;

  return <BookDetail slug={slug} />;
}