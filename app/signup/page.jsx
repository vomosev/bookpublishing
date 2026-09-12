import AuthForm from '../../components/AuthForm';

export const metadata = {
  title: 'Create Your Author Account',
  description:
    'Join bookpublishing to submit your manuscript, follow its review progress, and access professional publishing support.',
  alternates: {
    canonical: '/signup',
  },
};

const benefits = [
  {
    title: 'Submit with confidence',
    description:
      'Share your manuscript proposal securely and give our editorial team the details they need for a thoughtful review.',
  },
  {
    title: 'Track every step',
    description:
      'Keep your submissions and their latest review statuses together in one clear author workspace.',
  },
  {
    title: 'Protect your creative ownership',
    description:
      'Explore a transparent publishing path designed to respect your voice, rights, and long-term goals.',
  },
];

export default function SignupPage() {
  return (
    <main id="main-content" className="auth-page">
      <div className="container auth-layout">
        <section className="auth-copy" aria-labelledby="signup-heading">
          <p className="eyebrow">For independent authors</p>
          <h1 id="signup-heading">Your story deserves a publishing partner.</h1>
          <p className="auth-intro">
            Create your free author account to introduce your manuscript and
            begin a collaborative, professional publishing journey.
          </p>

          <div className="auth-benefits" aria-label="Account benefits">
            {benefits.map((benefit, index) => (
              <article className="auth-benefit" key={benefit.title}>
                <span className="auth-benefit-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2>{benefit.title}</h2>
                  <p>{benefit.description}</p>
                </div>
              </article>
            ))}
          </div>

          <blockquote className="auth-quote">
            <p>
              “A considered publishing process starts by understanding the
              author, the manuscript, and the readers it hopes to reach.”
            </p>
          </blockquote>
        </section>

        <section className="auth-card" aria-label="Create an author account">
          <div className="auth-card-heading">
            <p className="eyebrow">Begin your journey</p>
            <h2>Create your account</h2>
            <p>
              Tell us who you are, then visit your private dashboard to submit
              your manuscript proposal.
            </p>
          </div>
          <AuthForm mode="signup" />
        </section>
      </div>
    </main>
  );
}