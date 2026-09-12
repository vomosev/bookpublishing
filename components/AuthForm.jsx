'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordByteLength(value) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return unescape(encodeURIComponent(value)).length;
}

function validateForm(values, isSignup) {
  const errors = {};
  const displayName = values.displayName.trim();
  const email = values.email.trim().toLowerCase();

  if (isSignup) {
    if (!displayName) {
      errors.displayName = 'Enter your author or pen name.';
    } else if (displayName.length < 2 || displayName.length > 80) {
      errors.displayName = 'Your author name must be between 2 and 80 characters.';
    }
  }

  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Enter your password.';
  } else if (isSignup) {
    const byteLength = passwordByteLength(values.password);

    if (values.password.length < 8 || byteLength > 72) {
      errors.password = 'Use a password between 8 and 72 bytes.';
    } else if (
      !/[a-z]/.test(values.password) ||
      !/[A-Z]/.test(values.password) ||
      !/[0-9]/.test(values.password)
    ) {
      errors.password =
        'Include at least one uppercase letter, one lowercase letter, and one number.';
    }
  }

  return errors;
}

function getSafeErrorMessage(error, isSignup) {
  const status = Number(error?.status || error?.statusCode || 0);

  if (status === 400) {
    const message =
      typeof error?.message === 'string'
        ? error.message.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
        : '';

    return message && message.length <= 180
      ? message
      : 'Please review your details and try again.';
  }

  if (status === 401) {
    return isSignup
      ? 'Your session could not be started. Please try signing up again.'
      : 'The email address or password you entered is incorrect.';
  }

  if (status === 409) {
    return 'An account already exists for this email address. Try signing in instead.';
  }

  if (status === 429) {
    return 'Too many attempts were made. Please wait a moment and try again.';
  }

  if (status >= 500 || status === 0) {
    return 'The secure account service is temporarily unavailable. Please try again shortly.';
  }

  return isSignup
    ? 'We could not create your account. Please try again.'
    : 'We could not sign you in. Please try again.';
}

export default function AuthForm({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const { user, loading, login, signup, apiAvailable } = useAuth();

  const idPrefix = useId();
  const displayNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const errorRef = useRef(null);

  const [values, setValues] = useState({
    displayName: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (formError) {
      errorRef.current?.focus();
    }
  }, [formError]);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (formError) {
      setFormError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (pending || loading || user) return;

    setFormError('');

    const validationErrors = validateForm(values, isSignup);
    setFieldErrors(validationErrors);

    const firstInvalidField = ['displayName', 'email', 'password'].find(
      (field) => validationErrors[field],
    );

    if (firstInvalidField) {
      const refs = {
        displayName: displayNameRef,
        email: emailRef,
        password: passwordRef,
      };
      refs[firstInvalidField].current?.focus();
      return;
    }

    const credentials = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };

    if (isSignup) {
      credentials.displayName = values.displayName.trim();
    }

    setPending(true);

    try {
      if (isSignup) {
        await signup(credentials);
      } else {
        await login(credentials);
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      setFormError(getSafeErrorMessage(error, isSignup));
    } finally {
      setPending(false);
    }
  }

  if (!loading && user) {
    return (
      <section className="auth-form-card" aria-live="polite">
        <div className="auth-form-header">
          <p className="eyebrow">Author workspace</p>
          <h2>Opening your dashboard</h2>
          <p>Please wait while we take you to your publishing workspace.</p>
        </div>
        <div className="loading-state" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading dashboard…</span>
        </div>
      </section>
    );
  }

  const displayNameId = `${idPrefix}-display-name`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const passwordHintId = `${idPrefix}-password-hint`;
  const formErrorId = `${idPrefix}-form-error`;

  return (
    <section className="auth-form-card">
      <div className="auth-form-header">
        <p className="eyebrow">{isSignup ? 'Begin your next chapter' : 'Welcome back'}</p>
        <h2>{isSignup ? 'Create your author account' : 'Sign in to your account'}</h2>
        <p>
          {isSignup
            ? 'Create a private workspace for manuscript proposals and editorial updates.'
            : 'Access your manuscript proposals and publishing progress.'}
        </p>
      </div>

      {apiAvailable === false && (
        <div className="status-message status-warning" role="status">
          The secure account service is currently unavailable. You may try again in a moment.
        </div>
      )}

      {formError && (
        <div
          ref={errorRef}
          id={formErrorId}
          className="status-message status-error"
          role="alert"
          tabIndex={-1}
        >
          {formError}
        </div>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={pending}
        aria-describedby={formError ? formErrorId : undefined}
      >
        {isSignup && (
          <div className="form-group">
            <label className="form-label" htmlFor={displayNameId}>
              Author or pen name
            </label>
            <input
              ref={displayNameRef}
              id={displayNameId}
              className="form-input"
              type="text"
              name="displayName"
              value={values.displayName}
              onChange={handleChange}
              autoComplete="name"
              maxLength={80}
              disabled={pending}
              aria-invalid={Boolean(fieldErrors.displayName)}
              aria-describedby={
                fieldErrors.displayName ? `${displayNameId}-error` : undefined
              }
              required
            />
            {fieldErrors.displayName && (
              <p
                id={`${displayNameId}-error`}
                className="form-error"
                role="alert"
              >
                {fieldErrors.displayName}
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor={emailId}>
            Email address
          </label>
          <input
            ref={emailRef}
            id={emailId}
            className="form-input"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
            required
          />
          {fieldErrors.email && (
            <p id={`${emailId}-error`} className="form-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor={passwordId}>
            Password
          </label>
          <input
            ref={passwordRef}
            id={passwordId}
            className="form-input"
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            maxLength={72}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              [
                isSignup ? passwordHintId : '',
                fieldErrors.password ? `${passwordId}-error` : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            required
          />
          {isSignup && (
            <p id={passwordHintId} className="form-hint">
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
          )}
          {fieldErrors.password && (
            <p id={`${passwordId}-error`} className="form-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          className="button button-primary auth-submit"
          type="submit"
          disabled={pending || loading}
        >
          {pending
            ? isSignup
              ? 'Creating your account…'
              : 'Signing you in…'
            : loading
              ? 'Checking your session…'
              : isSignup
                ? 'Create author account'
                : 'Sign in'}
        </button>
      </form>

      <p className="auth-form-switch">
        {isSignup ? 'Already have an author account? ' : 'New to bookpublishing? '}
        <Link href={isSignup ? '/login' : '/signup'}>
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </section>
  );
}