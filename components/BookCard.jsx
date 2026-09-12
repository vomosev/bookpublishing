import Link from 'next/link';

export function BookCard({
  book,
  slug,
  title,
  authorName,
  genre,
  description,
  coverTheme,
}) {
  const details = book ?? {
    slug,
    title,
    authorName,
    genre,
    description,
    coverTheme,
  };

  const safeSlug =
    typeof details.slug === 'string' && details.slug.trim()
      ? details.slug.trim()
      : 'untitled';

  const displayTitle =
    typeof details.title === 'string' && details.title.trim()
      ? details.title.trim()
      : 'Untitled Book';

  const displayAuthor =
    typeof details.authorName === 'string' && details.authorName.trim()
      ? details.authorName.trim()
      : 'Independent Author';

  const displayGenre =
    typeof details.genre === 'string' && details.genre.trim()
      ? details.genre.trim()
      : 'Literature';

  const displayDescription =
    typeof details.description === 'string' ? details.description.trim() : '';

  const theme =
    typeof details.coverTheme === 'string' && details.coverTheme.trim()
      ? details.coverTheme
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : 'burgundy';

  const href = `/books/${encodeURIComponent(safeSlug)}`;

  return (
    <article className="book-card">
      <Link
        className="book-card__cover-link"
        href={href}
        aria-label={`View ${displayTitle} by ${displayAuthor}`}
      >
        <div
          className={`book-cover book-cover--${theme} cover-${theme}`}
          aria-hidden="true"
        >
          <span className="book-cover__spine" />
          <span className="book-cover__ornament">✦</span>
          <div className="book-cover__text">
            <span className="book-cover__title">{displayTitle}</span>
            <span className="book-cover__author">{displayAuthor}</span>
          </div>
        </div>
      </Link>

      <div className="book-card__content">
        <p className="book-card__genre">{displayGenre}</p>
        <h3 className="book-card__title">
          <Link href={href}>{displayTitle}</Link>
        </h3>
        <p className="book-card__author">by {displayAuthor}</p>
        {displayDescription ? (
          <p className="book-card__description">{displayDescription}</p>
        ) : null}
        <Link className="book-card__link" href={href}>
          Discover the book
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </article>
  );
}

export default BookCard;