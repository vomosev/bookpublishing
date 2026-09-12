const benefits = [
  {
    number: "01",
    title: "Keep creative ownership",
    description:
      "Your voice, rights, and long-term vision remain yours. We help shape the book without taking control of the story behind it.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M14 22v-6a10 10 0 0 1 20 0v6" />
        <rect x="10" y="22" width="28" height="20" rx="4" />
        <path d="M24 30v5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Work with publishing professionals",
    description:
      "Collaborate with experienced editors and designers who refine your manuscript, strengthen its presentation, and respect your style.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m10 37 3-11L32 7l9 9-19 19-12 2Z" />
        <path d="m28 11 9 9M13 26l9 9M10 37l7-7" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Publish with clarity",
    description:
      "Understand each stage before it begins. Our transparent process keeps scope, decisions, and production milestones clear from review to release.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="7" width="30" height="34" rx="4" />
        <path d="m16 18 3 3 6-7M28 19h5M16 30l3 3 6-7M28 31h5" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Reach readers worldwide",
    description:
      "Prepare your book for professional distribution with practical launch guidance and support designed to build lasting discoverability.",
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="18" />
        <path d="M6 24h36M24 6c6 5 9 11 9 18s-3 13-9 18c-6-5-9-11-9-18s3-13 9-18Z" />
      </svg>
    ),
  },
];

export default function AuthorBenefits() {
  return (
    <section
      className="author-benefits section"
      id="author-benefits"
      aria-labelledby="author-benefits-title"
    >
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Built around the author</p>
          <h2 id="author-benefits-title">
            Professional publishing without surrendering your independence
          </h2>
          <p>
            Bring your manuscript to market with expert guidance, a clear
            process, and an experienced team invested in your book.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.title}>
              <div className="benefit-card__top" aria-hidden="true">
                <span className="benefit-card__icon">{benefit.icon}</span>
                <span className="benefit-card__number">{benefit.number}</span>
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>

        <div className="benefits-cta">
          <div className="benefits-cta__content">
            <p className="eyebrow">Your next chapter starts here</p>
            <h2>Ready to give your manuscript a professional path forward?</h2>
            <p>
              Create your author account to access your private workspace and
              submit a proposal for editorial review.
            </p>
          </div>
          <div className="benefits-cta__actions">
            <a className="button button--primary" href="/signup">
              Create an author account
              <span aria-hidden="true">→</span>
            </a>
            <a className="button button--secondary" href="/login">
              Already have an account?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}