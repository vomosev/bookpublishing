'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('A recoverable application error occurred:', error);
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-card" role="alert" aria-labelledby="error-title">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" focusable="false">
            <path d="M8 14.5c8.7 0 16.7 2.3 24 6.8v31.2c-7.3-4.3-15.3-6.4-24-6.4V14.5Z" />
            <path d="M56 14.5c-8.7 0-16.7 2.3-24 6.8v31.2c7.3-4.3 15.3-6.4 24-6.4V14.5Z" />
            <path className="gold-line" d="M32 21.3v31.2" />
            <path className="gold-line" d="m45.5 10.5 5.8 5.8-13.8 13.8-7.2 1.5 1.5-7.2 13.7-13.9Z" />
          </svg>
        </div>

        <p className="eyebrow">A page out of place</p>
        <h1 id="error-title">We couldn’t finish this chapter.</h1>
        <p className="message">
          Something unexpected interrupted the page. Your work is still yours,
          and you can try loading this section again or return to the
          bookpublishing homepage.
        </p>

        <div className="actions">
          <button type="button" className="primary-action" onClick={reset}>
            Try again
          </button>
          <a className="secondary-action" href="/">
            Return home
          </a>
        </div>

        <p className="support-note">
          If the issue continues, please wait a moment before trying again.
        </p>
      </section>

      <style jsx>{`
        .error-page {
          display: grid;
          min-height: calc(100svh - 12rem);
          place-items: center;
          padding: clamp(3rem, 8vw, 7rem) 1.25rem;
          background:
            radial-gradient(
              circle at 50% 12%,
              rgba(183, 140, 63, 0.12),
              transparent 34rem
            ),
            var(--paper, #f7f1e7);
        }

        .error-card {
          position: relative;
          width: min(100%, 44rem);
          overflow: hidden;
          padding: clamp(2.25rem, 6vw, 4.75rem);
          text-align: center;
          background: rgba(255, 252, 246, 0.94);
          border: 1px solid rgba(92, 28, 41, 0.16);
          border-radius: 1.5rem;
          box-shadow:
            0 1.5rem 4rem rgba(48, 31, 27, 0.1),
            0 0.25rem 1rem rgba(48, 31, 27, 0.05);
        }

        .error-card::before {
          position: absolute;
          inset: 0 0 auto;
          height: 0.3rem;
          content: '';
          background: linear-gradient(
            90deg,
            #641f31,
            #b78c3f 50%,
            #641f31
          );
        }

        .brand-mark {
          display: grid;
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.5rem;
          place-items: center;
          color: #641f31;
          background: #f4ead8;
          border: 1px solid rgba(183, 140, 63, 0.35);
          border-radius: 50%;
        }

        .brand-mark svg {
          width: 3.1rem;
          height: 3.1rem;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2.3;
        }

        .brand-mark .gold-line {
          stroke: #b78c3f;
        }

        .eyebrow {
          margin: 0 0 0.75rem;
          color: #8b682b;
          font-size: 0.75rem;
          font-weight: 750;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        h1 {
          max-width: 12ch;
          margin: 0 auto 1.25rem;
          color: var(--ink, #2d2522);
          font-family: var(--font-serif, Georgia, serif);
          font-size: clamp(2.25rem, 7vw, 4rem);
          font-weight: 650;
          letter-spacing: -0.035em;
          line-height: 1.04;
          text-wrap: balance;
        }

        .message {
          max-width: 36rem;
          margin: 0 auto;
          color: #655b55;
          font-size: clamp(1rem, 2vw, 1.125rem);
          line-height: 1.75;
          text-wrap: pretty;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .primary-action,
        .secondary-action {
          display: inline-flex;
          min-height: 3rem;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.35rem;
          border-radius: 999px;
          font: inherit;
          font-weight: 700;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background-color 160ms ease,
            border-color 160ms ease;
        }

        .primary-action {
          color: #fffaf2;
          background: #641f31;
          border: 1px solid #641f31;
          box-shadow: 0 0.6rem 1.4rem rgba(100, 31, 49, 0.18);
        }

        .secondary-action {
          color: #641f31;
          background: transparent;
          border: 1px solid rgba(100, 31, 49, 0.4);
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-2px);
        }

        .primary-action:hover {
          background: #511725;
          box-shadow: 0 0.8rem 1.6rem rgba(100, 31, 49, 0.24);
        }

        .secondary-action:hover {
          background: rgba(100, 31, 49, 0.06);
          border-color: #641f31;
        }

        .primary-action:focus-visible,
        .secondary-action:focus-visible {
          outline: 3px solid rgba(183, 140, 63, 0.55);
          outline-offset: 3px;
        }

        .support-note {
          margin: 1.5rem 0 0;
          color: #82766f;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        @media (max-width: 32rem) {
          .actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .primary-action,
          .secondary-action {
            transition: none;
          }

          .primary-action:hover,
          .secondary-action:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}