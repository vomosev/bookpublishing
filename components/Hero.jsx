export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-content">
          <p className="section-eyebrow hero-eyebrow">
            Independent stories, professionally published
          </p>

          <h1 id="hero-title" className="hero-title">
            Your story deserves to be{" "}
            <span className="hero-title-accent">read.</span>
          </h1>

          <p className="hero-description">
            Thoughtful editorial guidance, beautiful book design, and practical
            publishing support for independent writers ready to share their
            work with the world.
          </p>

          <div className="hero-actions" aria-label="Publishing actions">
            <a className="button button-primary" href="/signup">
              Submit your manuscript
              <span aria-hidden="true">→</span>
            </a>
            <a className="button button-secondary" href="#featured-books">
              Explore our books
            </a>
          </div>

          <ul className="hero-trust" aria-label="Publishing commitments">
            <li>
              <span className="hero-trust-icon" aria-hidden="true">
                ✓
              </span>
              Author-first agreements
            </li>
            <li>
              <span className="hero-trust-icon" aria-hidden="true">
                ✓
              </span>
              Human editorial review
            </li>
            <li>
              <span className="hero-trust-icon" aria-hidden="true">
                ✓
              </span>
              Worldwide distribution support
            </li>
          </ul>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-glow" />
          <div className="hero-book-shadow" />

          <div className="hero-book">
            <div className="hero-book-spine">
              <span>BOOKPUBLISHING</span>
            </div>

            <div className="hero-book-cover">
              <div className="hero-book-cover-rule" />
              <p className="hero-book-kicker">An original work</p>
              <p className="hero-book-title">
                The Story
                <br />
                Only You
                <br />
                Can Tell
              </p>
              <div className="hero-book-ornament">
                <span />
                <span />
                <span />
              </div>
              <p className="hero-book-author">Your name belongs here</p>
            </div>

            <div className="hero-book-pages">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="hero-note hero-note-editorial">
            <span className="hero-note-mark">01</span>
            <span>Editorial care</span>
          </div>

          <div className="hero-note hero-note-independent">
            <span className="hero-note-mark">100%</span>
            <span>Your creative voice</span>
          </div>
        </div>
      </div>
    </section>
  );
}