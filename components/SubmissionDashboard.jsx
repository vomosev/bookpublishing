'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { apiRequest } from '../lib/api';

const GENRES = [
  'Fiction',
  'Nonfiction',
  'Memoir',
  'Poetry',
  'Young Adult',
  "Children's",
];

const INITIAL_FORM = {
  title: '',
  genre: '',
  wordCount: '',
  synopsis: '',
  manuscriptUrl: '',
};

const STATUS_LABELS = {
  received: 'Received',
  under_review: 'Under review',
  revisions_requested: 'Revisions requested',
  accepted: 'Accepted',
  declined: 'Declined',
};

function validateForm(values) {
  const errors = {};
  const title = values.title.trim();
  const synopsis = values.synopsis.trim();
  const manuscriptUrl = values.manuscriptUrl.trim();
  const wordCount = Number(values.wordCount);

  if (!title) {
    errors.title = 'Enter your manuscript title.';
  } else if (title.length > 160) {
    errors.title = 'The title must be 160 characters or fewer.';
  }

  if (!GENRES.includes(values.genre)) {
    errors.genre = 'Choose a genre from the list.';
  }

  if (!values.wordCount) {
    errors.wordCount = 'Enter the manuscript word count.';
  } else if (!Number.isInteger(wordCount) || wordCount <= 0) {
    errors.wordCount = 'Word count must be a positive whole number.';
  } else if (wordCount > 10000000) {
    errors.wordCount = 'Word count must be 10,000,000 or fewer.';
  }

  if (!synopsis) {
    errors.synopsis = 'Tell our editorial team what your book is about.';
  } else if (synopsis.length > 5000) {
    errors.synopsis = 'The synopsis must be 5,000 characters or fewer.';
  }

  if (!manuscriptUrl) {
    errors.manuscriptUrl = 'Provide a secure link to your manuscript.';
  } else if (manuscriptUrl.length > 2048) {
    errors.manuscriptUrl = 'The manuscript link is too long.';
  } else {
    try {
      const url = new URL(manuscriptUrl);
      if (url.protocol !== 'https:') {
        errors.manuscriptUrl = 'Use a secure HTTPS manuscript link.';
      }
    } catch {
      errors.manuscriptUrl = 'Enter a valid HTTPS manuscript link.';
    }
  }

  return errors;
}

function isServiceUnavailable(error) {
  const status = Number(error?.status || error?.statusCode || 0);
  return !status || status >= 500 || error?.name === 'AbortError';
}

function safeErrorMessage(error, fallback) {
  if (
    error &&
    typeof error.message === 'string' &&
    error.message.trim() &&
    Number(error.status || error.statusCode) < 500
  ) {
    return error.message;
  }

  return fallback;
}

function normalizeSubmissionResponse(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  return response.submission || response.data?.submission || response.data || response;
}

function normalizeSubmissionList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.submissions)) {
    return response.submissions;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.submissions)) {
    return response.data.submissions;
  }

  return [];
}

function formatDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatWordCount(value) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return 'Word count unavailable';
  }

  return `${new Intl.NumberFormat('en').format(count)} words`;
}

function statusClassName(status) {
  const normalized = String(status || 'received')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  return `status-badge status-badge--${normalized}`;
}

function LoadingDashboard() {
  return (
    <main className="dashboard-page">
      <div className="container dashboard-container">
        <div className="dashboard-loading" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <div>
            <p className="eyebrow">Author workspace</p>
            <h1>Preparing your dashboard</h1>
            <p>We are securely checking your publishing session.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SubmissionDashboard() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    apiAvailable,
    refreshUser,
  } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryingSession, setRetryingSession] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && apiAvailable && !user) {
      router.replace('/login');
    }
  }, [apiAvailable, authLoading, router, user]);

  const loadSubmissions = useCallback(async () => {
    if (!userId) {
      return;
    }

    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await apiRequest('/api/submissions/mine');
      setSubmissions(normalizeSubmissionList(response));
      setServiceUnavailable(false);
    } catch (error) {
      if (Number(error?.status || error?.statusCode) === 401) {
        router.replace('/login');
        return;
      }

      if (isServiceUnavailable(error)) {
        setServiceUnavailable(true);
        setHistoryError(
          'The publishing API is temporarily unavailable. Your existing proposals could not be loaded.'
        );
      } else {
        setHistoryError(
          safeErrorMessage(
            error,
            'We could not load your submission history. Please try again.'
          )
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [router, userId]);

  useEffect(() => {
    if (authLoading || !userId || !apiAvailable) {
      return;
    }

    loadSubmissions();
  }, [apiAvailable, authLoading, loadSubmissions, userId]);

  const displayName = useMemo(() => {
    const candidate = user?.displayName || user?.name;
    return typeof candidate === 'string' && candidate.trim()
      ? candidate.trim()
      : 'Author';
  }, [user]);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }

    if (submitError) {
      setSubmitError('');
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm(form);
    setFieldErrors(errors);
    setSubmitError('');
    setSuccessMessage('');

    if (Object.keys(errors).length > 0) {
      const firstInvalidField = Object.keys(errors)[0];
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      genre: form.genre,
      wordCount: Number(form.wordCount),
      synopsis: form.synopsis.trim(),
      manuscriptUrl: form.manuscriptUrl.trim(),
    };

    try {
      const response = await apiRequest('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const createdSubmission = normalizeSubmissionResponse(response);

      if (
        createdSubmission &&
        typeof createdSubmission === 'object' &&
        (createdSubmission.id || createdSubmission.title)
      ) {
        setSubmissions((current) => [
          createdSubmission,
          ...current.filter(
            (submission) =>
              !createdSubmission.id || submission.id !== createdSubmission.id
          ),
        ]);
      } else {
        await loadSubmissions();
      }

      setForm(INITIAL_FORM);
      setFieldErrors({});
      setServiceUnavailable(false);
      setSuccessMessage(
        'Your proposal has been received. Our editorial team will review it and keep the status updated here.'
      );
    } catch (error) {
      const status = Number(error?.status || error?.statusCode);

      if (status === 401) {
        setSubmitError('Your session has expired. Please sign in again.');
        router.replace('/login');
      } else if (isServiceUnavailable(error)) {
        setServiceUnavailable(true);
        setSubmitError(
          'The publishing API is currently unavailable. Your form has been preserved so you can try again.'
        );
      } else {
        setSubmitError(
          safeErrorMessage(
            error,
            'We could not submit your proposal. Review the form and try again.'
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function retrySession() {
    setRetryingSession(true);

    try {
      await refreshUser();
    } finally {
      setRetryingSession(false);
    }
  }

  if (authLoading) {
    return <LoadingDashboard />;
  }

  if (!apiAvailable && !user) {
    return (
      <main className="dashboard-page">
        <div className="container dashboard-container">
          <section className="dashboard-unavailable" aria-labelledby="api-unavailable-title">
            <p className="eyebrow">Author workspace</p>
            <h1 id="api-unavailable-title">The publishing desk is offline</h1>
            <p>
              We could not reach the secure account service, so your session and
              manuscript proposals cannot be loaded right now. No information has
              been changed.
            </p>
            <div className="button-row">
              <button
                className="button button--primary"
                type="button"
                onClick={retrySession}
                disabled={retryingSession}
              >
                {retryingSession ? 'Checking connection…' : 'Try again'}
              </button>
              <a className="button button--secondary" href="/">
                Return home
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboard-page">
        <div className="container dashboard-container">
          <div className="dashboard-loading" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <div>
              <p className="eyebrow">Author workspace</p>
              <h1>Taking you to sign in</h1>
              <p>Your author dashboard is available after authentication.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="container dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Author workspace</p>
            <h1>Welcome back, {displayName}</h1>
            <p className="dashboard-intro">
              Share your next manuscript with our editorial team and follow every
              proposal from receipt through review.
            </p>
          </div>
          <div className="dashboard-account" aria-label="Signed-in account">
            <span className="dashboard-account__label">Signed in as</span>
            <strong>{user.email}</strong>
          </div>
        </header>

        {serviceUnavailable && (
          <div className="alert alert--warning" role="alert">
            <div>
              <strong>Publishing service temporarily unavailable</strong>
              <p>
                Some dashboard actions may not work until the secure API reconnects.
                Information entered in the form will remain on this page.
              </p>
            </div>
            <button
              type="button"
              className="button button--small button--secondary"
              onClick={loadSubmissions}
              disabled={historyLoading}
            >
              {historyLoading ? 'Checking…' : 'Retry connection'}
            </button>
          </div>
        )}

        <div className="dashboard-grid">
          <section
            className="dashboard-panel submission-form-panel"
            aria-labelledby="proposal-form-title"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">New proposal</p>
                <h2 id="proposal-form-title">Submit your manuscript</h2>
              </div>
              <span className="panel-step">Editorial review</span>
            </div>

            <p className="panel-description">
              Tell us about your book and provide a private HTTPS link where our
              editorial team can access the manuscript.
            </p>

            {successMessage && (
              <div className="alert alert--success" role="status" aria-live="polite">
                <strong>Proposal submitted</strong>
                <p>{successMessage}</p>
              </div>
            )}

            {submitError && (
              <div className="alert alert--error" role="alert">
                <strong>We could not submit your proposal</strong>
                <p>{submitError}</p>
              </div>
            )}

            <form className="submission-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="title">Manuscript title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFieldChange}
                  maxLength={160}
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                  placeholder="The title of your book"
                  disabled={submitting}
                />
                {fieldErrors.title && (
                  <p className="field-error" id="title-error">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="genre">Genre</label>
                  <select
                    id="genre"
                    name="genre"
                    value={form.genre}
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(fieldErrors.genre)}
                    aria-describedby={fieldErrors.genre ? 'genre-error' : undefined}
                    disabled={submitting}
                  >
                    <option value="">Select a genre</option>
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.genre && (
                    <p className="field-error" id="genre-error">
                      {fieldErrors.genre}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="wordCount">Word count</label>
                  <input
                    id="wordCount"
                    name="wordCount"
                    type="number"
                    min="1"
                    max="10000000"
                    step="1"
                    inputMode="numeric"
                    value={form.wordCount}
                    onChange={handleFieldChange}
                    aria-invalid={Boolean(fieldErrors.wordCount)}
                    aria-describedby={
                      fieldErrors.wordCount ? 'wordCount-error' : 'wordCount-help'
                    }
                    placeholder="80000"
                    disabled={submitting}
                  />
                  {fieldErrors.wordCount ? (
                    <p className="field-error" id="wordCount-error">
                      {fieldErrors.wordCount}
                    </p>
                  ) : (
                    <p className="field-help" id="wordCount-help">
                      Use the complete manuscript count.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="synopsis">Synopsis</label>
                  <span>{form.synopsis.length}/5,000</span>
                </div>
                <textarea
                  id="synopsis"
                  name="synopsis"
                  rows="7"
                  value={form.synopsis}
                  onChange={handleFieldChange}
                  maxLength={5000}
                  aria-invalid={Boolean(fieldErrors.synopsis)}
                  aria-describedby={
                    fieldErrors.synopsis ? 'synopsis-error' : 'synopsis-help'
                  }
                  placeholder="Introduce the central idea, key characters or argument, intended readership, and what makes this book distinctive."
                  disabled={submitting}
                />
                {fieldErrors.synopsis ? (
                  <p className="field-error" id="synopsis-error">
                    {fieldErrors.synopsis}
                  </p>
                ) : (
                  <p className="field-help" id="synopsis-help">
                    A concise overview helps our editors assess the project.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="manuscriptUrl">Secure manuscript link</label>
                <input
                  id="manuscriptUrl"
                  name="manuscriptUrl"
                  type="url"
                  inputMode="url"
                  value={form.manuscriptUrl}
                  onChange={handleFieldChange}
                  maxLength={2048}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-invalid={Boolean(fieldErrors.manuscriptUrl)}
                  aria-describedby={
                    fieldErrors.manuscriptUrl
                      ? 'manuscriptUrl-error'
                      : 'manuscriptUrl-help'
                  }
                  placeholder="https://example.com/private-manuscript"
                  disabled={submitting}
                />
                {fieldErrors.manuscriptUrl ? (
                  <p className="field-error" id="manuscriptUrl-error">
                    {fieldErrors.manuscriptUrl}
                  </p>
                ) : (
                  <p className="field-help" id="manuscriptUrl-help">
                    Confirm that reviewers with the link have permission to open the
                    file. Please do not include a password in the URL.
                  </p>
                )}
              </div>

              <div className="submission-form__footer">
                <p>
                  By submitting, you confirm that you control the rights needed for
                  us to review this manuscript.
                </p>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Sending proposal…' : 'Submit for review'}
                </button>
              </div>
            </form>
          </section>

          <aside
            className="dashboard-panel submission-history-panel"
            aria-labelledby="submission-history-title"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Your projects</p>
                <h2 id="submission-history-title">Submission status</h2>
              </div>
              {!historyLoading && (
                <span className="submission-count" aria-label={`${submissions.length} submissions`}>
                  {submissions.length}
                </span>
              )}
            </div>

            {historyLoading ? (
              <div className="history-state" role="status" aria-live="polite">
                <span className="loading-spinner" aria-hidden="true" />
                <h3>Loading your proposals</h3>
                <p>Checking the latest editorial status.</p>
              </div>
            ) : historyError ? (
              <div className="history-state history-state--error" role="alert">
                <h3>Status history unavailable</h3>
                <p>{historyError}</p>
                <button
                  className="button button--secondary button--small"
                  type="button"
                  onClick={loadSubmissions}
                >
                  Try again
                </button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="history-state history-state--empty">
                <span className="history-state__icon" aria-hidden="true">
                  ✦
                </span>
                <h3>Your next chapter starts here</h3>
                <p>
                  You have not submitted a proposal yet. Complete the form to begin
                  an editorial review.
                </p>
              </div>
            ) : (
              <div className="submission-list">
                {submissions.map((submission, index) => {
                  const status = submission.status || 'received';
                  const submissionKey =
                    submission.id ||
                    `${submission.title || 'submission'}-${submission.createdAt || index}`;

                  return (
                    <article className="submission-card" key={submissionKey}>
                      <div className="submission-card__header">
                        <span className={statusClassName(status)}>
                          {STATUS_LABELS[status] ||
                            String(status).replace(/_/g, ' ')}
                        </span>
                        <time dateTime={submission.createdAt || undefined}>
                          {formatDate(submission.createdAt)}
                        </time>
                      </div>

                      <h3>{submission.title || 'Untitled manuscript'}</h3>

                      <div className="submission-card__meta">
                        <span>{submission.genre || 'Genre unavailable'}</span>
                        <span aria-hidden="true">•</span>
                        <span>{formatWordCount(submission.wordCount)}</span>
                      </div>

                      {submission.synopsis && (
                        <p className="submission-card__synopsis">
                          {submission.synopsis}
                        </p>
                      )}

                      <div className="submission-card__footer">
                        <span>
                          Reference{' '}
                          <strong>
                            {submission.id
                              ? `#${String(submission.id).slice(0, 8)}`
                              : 'pending'}
                          </strong>
                        </span>
                        {submission.updatedAt &&
                          submission.updatedAt !== submission.createdAt && (
                            <span>
                              Updated {formatDate(submission.updatedAt)}
                            </span>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}