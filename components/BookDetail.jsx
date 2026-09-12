'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../lib/api';
import { fallbackBooks } from '../lib/content';

function normalizeSlug(value) {
  if (typeof value !== 'string') return '';

  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function getErrorStatus(error) {
  return error?.status ?? error?.statusCode ?? error?.response?.status ?? null;
}

function getPublicationLabel(book) {
  const year =
    book.publicationYear ??
    book.publishedYear ??
    book.year ??
    null;

  if (year) return String(year);

  const dateValue =
    book.publicationDate ??
    book.publishedAt ??
    book.releaseDate ??
    null;

  if (!dateValue) return 'Available now';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

function getCoverTheme(theme) {
  const normalized = String(theme || 'burgundy')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  return normalized || 'burgundy';
}

export default function BookDetail({ slug }) {
  const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const fallbackBook = useMemo(
    () =>
      fallbackBooks.find(
        (book) => normalizeSlug(book.slug) === normalizedSlug,
      ) ?? null,
    [normalizedSlug],
  );

  const [view, setView] = useState({
    status: 'loading',
    book: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!normalizedSlug) {
      setView({ status: 'not-found', book: null });
      return () => {
        active = false;
        controller.abort();
      };
    }

    setView({ status: 'loading', book: null });

    async function loadBook() {
      try {
        const response = await apiRequest(
          `/api/books/${encodeURIComponent(normalizedSlug)}`,
          { signal: controller.signal },
        );
        const book = response?.book ?? response;

        if (!book || typeof book !== 'object' || !book.title) {
          throw new Error('The catalog returned an invalid book response.');
        }

        if (active) {
          setView({ status: 'ready', book });
        }
      } catch (error) {
        if (!active) return;

        if (getErrorStatus(error) === 404) {
          setView({ status: 'not-found', book: null });
          return;
        }

        setView({
          status: 'offline',
          book: fallbackBook,
        });
      }
    }

    loadBook();

    return () => {
      active = false;
      controller.abort();
    };
  }, [fallbackBook, normalizedSlug]);

  if (view.status === 'loading') {
    return (
      <main className="book-detail-page">
        <section className="page-section" aria-labelledby="book-loading-title">
          <div className="container">
            <div className="status-card loading-state" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <p className="eyebrow">The bookpublishing catalog</p>
              <h1 id="book-loading-title">Opening this book…</h1>
              <p>We’re retrieving its publication details and excerpt.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (view.status === 'not-found') {
    return (
      <main className="book-detail-page">
        <section className="page-section" aria-labelledby="book-not-found-title">
          <div className="container">
            <div className="status-card empty-state">
              <span className="status-badge">Book not found</span>
              <h1 id="book-not-found-title">This title is not in our catalog.</h1>
              <p>
                It may have moved, or the address may be incomplete. Explore our
                featured independent releases to find your next read.
              </p>
              <div className="button-group">
                <Link className="button button-primary" href="/#featured-books">
                  Browse featured books
                </Link>
                <Link className="button button-secondary" href="/">
                  Return home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (view.status === 'offline' && !view.book) {
    return (
      <main className="book-detail-page">
        <section className="page-section" aria-labelledby="catalog-offline-title">
          <div className="container">
            <div className="status-card offline-state" role="status">
              <span className="status-badge status-badge-warning">
                Catalog offline
              </span>
              <h1 id="catalog-offline-title">
                This book’s details are temporarily unavailable.
              </h1>
              <p>
                We couldn’t reach the live catalog, and no saved edition of this
                title is available. Please try again shortly.
              </p>
              <div className="button-group">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
                <Link className="button button-secondary" href="/#featured-books">
                  View featured books
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const book = view.book;
  const authorName = book.authorName || book.author || 'Independent author';
  const genre = book.genre || 'Independent literature';
  const description =
    book.description ||
    'Discover an original work brought to readers through independent publishing.';
  const excerpt =
    book.excerpt ||
    'An excerpt from this independent release will be available soon.';
  const publicationLabel = getPublicationLabel(book);
  const publisher = book.publisher || 'bookpublishing';
  const format = book.format || book.edition || 'Print and digital editions';
  const coverTheme = getCoverTheme(book.coverTheme);

  return (
    <main className="book-detail-page">
      {view.status === 'offline' && (
        <div className="offline-banner" role="status" aria-live="polite">
          <div className="container">
            <strong>Live catalog unavailable.</strong>{' '}
            You’re viewing our saved edition of this book’s details.
          </div>
        </div>
      )}

      <section className="page-section book-detail-section">
        <div className="container">
          <article className="book-detail-grid">
            <div className="book-detail-art">
              <div
                className={`book-cover book-cover-large book-cover--${coverTheme}`}
                role="img"
                aria-label={`Cover of ${book.title} by ${authorName}`}
              >
                <span className="book-cover-mark" aria-hidden="true">
                  bp
                </span>
                <div className="book-cover-copy">
                  <span className="book-cover-genre">{genre}</span>
                  <strong className="book-cover-title">{book.title}</strong>
                  <span className="book-cover-author">{authorName}</span>
                </div>
                <span className="book-cover-spine" aria-hidden="true" />
              </div>
            </div>

            <div className="book-detail-content">
              <p className="eyebrow">From our independent catalog</p>
              <span className="status-badge">{genre}</span>
              <h1>{book.title}</h1>
              <p className="book-detail-author">
                By <strong>{authorName}</strong>
              </p>

              <p className="book-detail-description">{description}</p>

              <dl className="publication-details" aria-label="Publication details">
                <div>
                  <dt>Published</dt>
                  <dd>{publicationLabel}</dd>
                </div>
                <div>
                  <dt>Publisher</dt>
                  <dd>{publisher}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{format}</dd>
                </div>
                {book.isbn && (
                  <div>
                    <dt>ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </div>
                )}
              </dl>
            </div>
          </article>

          <section className="book-excerpt" aria-labelledby="book-excerpt-title">
            <div className="section-heading">
              <p className="eyebrow">Read a passage</p>
              <h2 id="book-excerpt-title">From the book</h2>
            </div>
            <blockquote>
              <p>{excerpt}</p>
              <footer>
                — <cite>{book.title}</cite>, {authorName}
              </footer>
            </blockquote>
          </section>

          <aside className="author-cta" aria-labelledby="author-cta-title">
            <div>
              <p className="eyebrow">Your story belongs on the shelf</p>
              <h2 id="author-cta-title">Ready to publish your own book?</h2>
              <p>
                Share your manuscript proposal with our editorial team and take
                the first step toward a professionally produced independent
                release.
              </p>
            </div>
            <div className="button-group">
              <Link className="button button-primary" href="/signup">
                Submit your manuscript
              </Link>
              <Link className="button button-secondary" href="/#publishing-process">
                See how publishing works
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}