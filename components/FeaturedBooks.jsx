'use client';

import { useEffect, useState } from 'react';
import BookCard from './BookCard';
import { apiRequest } from '../lib/api';
import { fallbackBooks } from '../lib/content';

export default function FeaturedBooks() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadFeaturedBooks() {
      setStatus('loading');

      try {
        const response = await apiRequest('/api/books?featured=true');
        const featuredBooks = Array.isArray(response)
          ? response
          : response?.books;

        if (!Array.isArray(featuredBooks)) {
          throw new Error('The catalog returned an invalid response.');
        }

        if (isActive) {
          setBooks(featuredBooks);
          setStatus('available');
        }
      } catch {
        if (isActive) {
          setBooks(fallbackBooks);
          setStatus('fallback');
        }
      }
    }

    loadFeaturedBooks();

    return () => {
      isActive = false;
    };
  }, [requestVersion]);

  const retryCatalog = () => {
    setRequestVersion((version) => version + 1);
  };

  return (
    <section
      id="featured-books"
      className="section featured-books"
      aria-labelledby="featured-books-title"
      aria-busy={status === 'loading'}
    >
      <div className="container">
        <header className="section-heading">
          <p className="eyebrow">From independent voices</p>
          <h2 id="featured-books-title">Books worth discovering</h2>
          <p>
            Explore distinctive stories and ideas brought to life through
            thoughtful editing, intentional design, and author-led publishing.
          </p>
        </header>

        {status === 'loading' && (
          <div className="loading-state" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Opening the featured catalog…</p>
          </div>
        )}

        {status === 'fallback' && (
          <div className="availability-message" role="status" aria-live="polite">
            <div>
              <strong>Our live catalog is temporarily unavailable.</strong>
              <p>
                You can still browse this curated selection while we reconnect.
              </p>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={retryCatalog}
            >
              Try again
            </button>
          </div>
        )}

        {status !== 'loading' && books.length > 0 && (
          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.slug} {...book} />
            ))}
          </div>
        )}

        {status === 'available' && books.length === 0 && (
          <div className="empty-state" role="status">
            <h3>New featured releases are on the way</h3>
            <p>
              Check back soon to discover the next collection of independent
              voices.
            </p>
          </div>
        )}

        {status === 'fallback' && books.length === 0 && (
          <div className="empty-state" role="alert">
            <h3>The catalog cannot be displayed right now</h3>
            <p>Please try again when your connection is available.</p>
            <button
              type="button"
              className="button button-primary"
              onClick={retryCatalog}
            >
              Reload catalog
            </button>
          </div>
        )}
      </div>
    </section>
  );
}