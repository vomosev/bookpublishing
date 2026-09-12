import Link from 'next/link';
import AuthForm from '../../components/AuthForm';

export const metadata = {
  title: 'Author Login | Bookpublishing',
  description:
    'Sign in to your Bookpublishing author account to submit manuscripts and follow your publishing journey.',
  alternates: {
    canonical: 'https://bookpublishing.geo-drops.com/login',
  },
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-layout" aria-labelledby="login-heading">
        <div className="auth-intro">
          <p className="eyebrow">Your publishing journey</p>
          <h1 id="login-heading">Welcome back, author.</h1>
          <p className="auth-intro-text">
            Sign in to manage your manuscript proposals, review submission
            updates, and take the next step toward publishing your work.
          </p>

          <ul className="auth-benefits" aria-label="Author account benefits">
            <li>
              <strong>Submit with confidence</strong>
              <span>Share your manuscript proposal through a secure workspace.</span>
            </li>
            <li>
              <strong>Follow every chapter</strong>
              <span>Keep track of your submissions and their review status.</span>
            </li>
            <li>
              <strong>Publish independently</strong>
              <span>Build your book with professional guidance while retaining ownership.</span>
            </li>
          </ul>

          <p className="auth-secondary-action">
            New to Bookpublishing? <Link href="/signup">Create an author account</Link>
          </p>
        </div>

        <div className="auth-panel" aria-label="Author login form">
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}