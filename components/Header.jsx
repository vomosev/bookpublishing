'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

const navigationLinks = [
  { href: '/#featured-books', label: 'Featured books' },
  { href: '/#publishing-process', label: 'How it works' },
  { href: '/#author-benefits', label: 'For authors' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setLogoutError('');
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    if (logoutPending) return;

    setLogoutPending(true);
    setLogoutError('');

    try {
      await logout();
      setMenuOpen(false);

      if (pathname?.startsWith('/dashboard')) {
        router.push('/');
      }
    } catch {
      setLogoutError('We could not log you out. Please try again.');
    } finally {
      setLogoutPending(false);
    }
  };

  const renderAccountActions = (mobile = false) => {
    if (loading) {
      return (
        <div
          className={`header-auth-loading${mobile ? ' header-auth-loading--mobile' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="header-auth-loading-dot" aria-hidden="true" />
          <span>Checking account…</span>
        </div>
      );
    }

    if (user) {
      return (
        <>
          <Link
            href="/dashboard"
            className="btn btn-primary btn-small header-dashboard-link"
            onClick={mobile ? closeMenu : undefined}
          >
            Dashboard
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-small header-logout-button"
            onClick={handleLogout}
            disabled={logoutPending}
          >
            {logoutPending ? 'Logging out…' : 'Logout'}
          </button>
        </>
      );
    }

    return (
      <>
        <Link
          href="/login"
          className="btn btn-ghost btn-small header-login-link"
          onClick={mobile ? closeMenu : undefined}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="btn btn-primary btn-small header-join-link"
          onClick={mobile ? closeMenu : undefined}
        >
          Join
        </Link>
      </>
    );
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          href="/"
          className="site-brand"
          aria-label="Bookpublishing home"
          onClick={closeMenu}
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path
                d="M24 37.5c-4.7-3.2-10.4-4.8-17-4.8V10.5c6.6 0 12.3 1.8 17 5.3v21.7Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M24 37.5c4.7-3.2 10.4-4.8 17-4.8V10.5c-6.6 0-12.3 1.8-17 5.3v21.7Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M24 16v21.5M34.5 8.5l5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="m35.5 7.5 5 5 2.2-2.2a2.1 2.1 0 0 0 0-3l-2-2a2.1 2.1 0 0 0-3 0l-2.2 2.2Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="brand-copy">
            <span className="brand-name">bookpublishing</span>
            <span className="brand-tagline">Independent stories, beautifully made</span>
          </span>
        </Link>

        <nav className="primary-navigation desktop-navigation" aria-label="Primary navigation">
          <ul className="header-nav-list">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="header-nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions desktop-header-actions">
          {renderAccountActions()}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className={`mobile-menu-toggle${menuOpen ? ' is-open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span className="mobile-menu-bar" aria-hidden="true" />
          <span className="mobile-menu-bar" aria-hidden="true" />
          <span className="mobile-menu-bar" aria-hidden="true" />
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mobile-navigation${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav className="container mobile-navigation-inner" aria-label="Mobile navigation">
          <ul className="mobile-nav-list">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="mobile-nav-link" onClick={closeMenu}>
                  {link.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mobile-header-actions">
            {renderAccountActions(true)}
          </div>
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="mobile-navigation-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          tabIndex={-1}
        />
      )}

      {logoutError && (
        <p className="header-auth-error" role="alert">
          {logoutError}
        </p>
      )}
    </header>
  );
}