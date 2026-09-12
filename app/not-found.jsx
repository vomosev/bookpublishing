export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-illustration" aria-hidden="true">
          <span className="not-found-number">4</span>
          <span className="not-found-book">
            <span className="not-found-book-page not-found-book-page-left" />
            <span className="not-found-book-page not-found-book-page-right" />
          </span>
          <span className="not-found-number">4</span>
        </div>

        <p className="not-found-eyebrow">Page not found</p>
        <h1 id="not-found-title">This chapter seems to be missing.</h1>
        <p className="not-found-copy">
          The page may have moved, or the story may have taken an unexpected
          turn. Return home or discover books from independent authors.
        </p>

        <nav className="not-found-actions" aria-label="404 page navigation">
          <a className="not-found-primary" href="/">
            Return to homepage
          </a>
          <a className="not-found-secondary" href="/#featured-books">
            Browse featured books
          </a>
        </nav>
      </section>

      <style>{`
        .not-found-page {
          position: relative;
          display: grid;
          min-height: 70vh;
          place-items: center;
          overflow: hidden;
          padding: clamp(3rem, 8vw, 7rem) 1.25rem;
          background:
            radial-gradient(circle at 15% 20%, rgba(173, 132, 47, 0.12), transparent 28rem),
            radial-gradient(circle at 88% 80%, rgba(104, 25, 42, 0.1), transparent 30rem);
        }

        .not-found-page::before,
        .not-found-page::after {
          position: absolute;
          width: 16rem;
          height: 16rem;
          border: 1px solid rgba(104, 25, 42, 0.12);
          border-radius: 50%;
          content: "";
          pointer-events: none;
        }

        .not-found-page::before {
          top: -8rem;
          right: -5rem;
        }

        .not-found-page::after {
          bottom: -10rem;
          left: -6rem;
          width: 22rem;
          height: 22rem;
        }

        .not-found-card {
          position: relative;
          z-index: 1;
          width: min(100%, 48rem);
          padding: clamp(2rem, 6vw, 4.5rem);
          border: 1px solid rgba(104, 25, 42, 0.14);
          border-radius: 1.5rem;
          background: rgba(255, 252, 245, 0.88);
          box-shadow: 0 1.5rem 4rem rgba(51, 36, 30, 0.1);
          text-align: center;
          backdrop-filter: blur(12px);
        }

        .not-found-illustration {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(0.35rem, 2vw, 1rem);
          margin-bottom: 1.75rem;
          color: #68192a;
        }

        .not-found-number {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(4.5rem, 15vw, 8rem);
          font-weight: 700;
          line-height: 0.8;
          letter-spacing: -0.08em;
        }

        .not-found-book {
          position: relative;
          display: flex;
          width: clamp(4.5rem, 13vw, 7rem);
          height: clamp(3.5rem, 10vw, 5.5rem);
          align-items: flex-end;
          filter: drop-shadow(0 0.6rem 0.5rem rgba(51, 36, 30, 0.12));
        }

        .not-found-book::after {
          position: absolute;
          bottom: -0.3rem;
          left: 50%;
          width: 0.12rem;
          height: 85%;
          background: #ad842f;
          content: "";
          transform: translateX(-50%);
        }

        .not-found-book-page {
          width: 50%;
          height: 100%;
          border: 2px solid #68192a;
          background: #fffaf0;
        }

        .not-found-book-page-left {
          border-radius: 0.35rem 0 0.15rem 0.55rem;
          transform: skewY(7deg);
          transform-origin: right bottom;
        }

        .not-found-book-page-right {
          border-radius: 0 0.35rem 0.55rem 0.15rem;
          transform: skewY(-7deg);
          transform-origin: left bottom;
        }

        .not-found-eyebrow {
          margin: 0 0 0.75rem;
          color: #8b6824;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .not-found-card h1 {
          max-width: 12em;
          margin: 0 auto;
          color: #2d2420;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(2rem, 6vw, 3.75rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .not-found-copy {
          max-width: 38rem;
          margin: 1.25rem auto 0;
          color: #665a53;
          font-size: clamp(1rem, 2vw, 1.125rem);
          line-height: 1.75;
        }

        .not-found-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.85rem;
          margin-top: 2rem;
        }

        .not-found-actions a {
          display: inline-flex;
          min-height: 3rem;
          align-items: center;
          justify-content: center;
          padding: 0.8rem 1.35rem;
          border: 1px solid #68192a;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 750;
          line-height: 1.2;
          text-decoration: none;
          transition:
            background-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .not-found-primary {
          background: #68192a;
          box-shadow: 0 0.65rem 1.5rem rgba(104, 25, 42, 0.2);
          color: #fffaf0;
        }

        .not-found-secondary {
          background: transparent;
          color: #68192a;
        }

        .not-found-actions a:hover {
          transform: translateY(-2px);
        }

        .not-found-primary:hover {
          background: #531321;
          box-shadow: 0 0.8rem 1.8rem rgba(104, 25, 42, 0.25);
        }

        .not-found-secondary:hover {
          background: rgba(104, 25, 42, 0.07);
        }

        .not-found-actions a:focus-visible {
          outline: 3px solid rgba(173, 132, 47, 0.55);
          outline-offset: 4px;
        }

        @media (max-width: 34rem) {
          .not-found-card {
            padding-inline: 1.35rem;
          }

          .not-found-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .not-found-actions a {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .not-found-actions a {
            transition: none;
          }

          .not-found-actions a:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}