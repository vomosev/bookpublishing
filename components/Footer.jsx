const SITE_URL = "https://bookpublishing.geo-drops.com";

const publishingLinks = [
  { label: "Featured books", href: `${SITE_URL}/#featured-books` },
  { label: "How publishing works", href: `${SITE_URL}/#publishing-process` },
  { label: "Author benefits", href: `${SITE_URL}/#author-benefits` },
];

const authorLinks = [
  { label: "Create an account", href: `${SITE_URL}/signup` },
  { label: "Author login", href: `${SITE_URL}/login` },
  { label: "Submission dashboard", href: `${SITE_URL}/dashboard` },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-labelledby="footer-heading">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a
            className="footer-logo"
            href={SITE_URL}
            aria-label="Bookpublishing homepage"
          >
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-page" />
              <span className="brand-mark-page" />
            </span>
            <span>bookpublishing</span>
          </a>

          <h2 id="footer-heading" className="footer-heading">
            Independent stories, professionally published.
          </h2>

          <p className="footer-description">
            Editorial guidance, thoughtful design, and transparent publishing
            support for writers ready to share their work with the world.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Publishing">
          <h3>Publishing</h3>
          <ul>
            {publishingLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-nav" aria-label="Author resources">
          <h3>For authors</h3>
          <ul>
            {authorLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-cta">
          <p className="footer-eyebrow">Have a manuscript?</p>
          <h3>Take the next step in your publishing journey.</h3>
          <p>
            Create your author account and submit a proposal for editorial
            review.
          </p>
          <a className="button button-primary" href={`${SITE_URL}/signup`}>
            Start your submission
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          &copy; {currentYear} bookpublishing. All rights reserved.
        </p>
        <a href={SITE_URL}>bookpublishing.geo-drops.com</a>
      </div>
    </footer>
  );
}