'use strict';

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_BYTES = 72;
const MIN_DISPLAY_NAME_LENGTH = 2;
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 200;
const MIN_SYNOPSIS_LENGTH = 50;
const MAX_SYNOPSIS_LENGTH = 5000;
const MAX_MANUSCRIPT_URL_LENGTH = 2048;
const MAX_WORD_COUNT = 10_000_000;

const GENRE_ALIASES = new Map([
  ['fiction', 'Fiction'],
  ['general fiction', 'General Fiction'],
  ['literary fiction', 'Literary Fiction'],
  ['commercial fiction', 'Commercial Fiction'],
  ['historical fiction', 'Historical Fiction'],
  ['mystery', 'Mystery'],
  ['thriller', 'Thriller'],
  ['mystery & thriller', 'Mystery & Thriller'],
  ['mystery and thriller', 'Mystery & Thriller'],
  ['mystery / thriller', 'Mystery & Thriller'],
  ['romance', 'Romance'],
  ['fantasy', 'Fantasy'],
  ['science fiction', 'Science Fiction'],
  ['science fiction & fantasy', 'Science Fiction & Fantasy'],
  ['science fiction and fantasy', 'Science Fiction & Fantasy'],
  ['sci-fi', 'Science Fiction'],
  ['horror', 'Horror'],
  ['young adult', 'Young Adult'],
  ['ya', 'Young Adult'],
  ["children's", "Children's"],
  ['children’s', "Children's"],
  ['childrens', "Children's"],
  ['short stories', 'Short Stories'],
  ['nonfiction', 'Nonfiction'],
  ['non-fiction', 'Nonfiction'],
  ['creative nonfiction', 'Creative Nonfiction'],
  ['creative non-fiction', 'Creative Nonfiction'],
  ['memoir', 'Memoir'],
  ['biography', 'Biography'],
  ['autobiography', 'Biography'],
  ['history', 'History'],
  ['self-help', 'Self-Help'],
  ['self help', 'Self-Help'],
  ['business', 'Business'],
  ['personal development', 'Personal Development'],
  ['poetry', 'Poetry'],
  ['religion & spirituality', 'Religion & Spirituality'],
  ['religion and spirituality', 'Religion & Spirituality'],
  ['spirituality', 'Religion & Spirituality'],
  ['travel', 'Travel'],
  ['cookbook', 'Cookbook'],
  ['other', 'Other']
]);

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateEmail(value) {
  const email = normalizeEmail(value);

  if (
    email.length < 3 ||
    email.length > 254 ||
    /\s/.test(email) ||
    /[\u0000-\u001f\u007f]/.test(email)
  ) {
    return false;
  }

  const atIndex = email.indexOf('@');
  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@')) {
    return false;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (
    localPart.length > 64 ||
    domain.length < 3 ||
    domain.length > 253 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return false;
  }

  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => (
    label.length < 1 ||
    label.length > 63 ||
    label.startsWith('-') ||
    label.endsWith('-') ||
    !/^[a-z0-9-]+$/i.test(label)
  ))) {
    return false;
  }

  const topLevelDomain = labels[labels.length - 1];
  return /^[a-z]{2,63}$/i.test(topLevelDomain) || /^xn--[a-z0-9-]{2,59}$/i.test(topLevelDomain);
}

function validatePassword(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const characterLength = Array.from(value).length;
  const byteLength = Buffer.byteLength(value, 'utf8');

  if (
    characterLength < MIN_PASSWORD_LENGTH ||
    byteLength > MAX_PASSWORD_BYTES ||
    value.includes('\u0000') ||
    /[\r\n]/.test(value)
  ) {
    return false;
  }

  return (
    /\p{Ll}/u.test(value) &&
    /\p{Lu}/u.test(value) &&
    /\p{N}/u.test(value) &&
    /[^\p{L}\p{N}\s]/u.test(value)
  );
}

function validateDisplayName(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const name = value.trim();
  const length = Array.from(name).length;

  if (
    length < MIN_DISPLAY_NAME_LENGTH ||
    length > MAX_DISPLAY_NAME_LENGTH ||
    /[\u0000-\u001f\u007f]/u.test(name) ||
    /[<>]/.test(name)
  ) {
    return false;
  }

  return /[\p{L}\p{N}]/u.test(name);
}

function normalizeGenre(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const key = value.trim().replace(/\s+/g, ' ').toLowerCase();
  return GENRE_ALIASES.get(key) || '';
}

function normalizeWordCount(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : NaN;
  }

  if (typeof value !== 'string') {
    return NaN;
  }

  const normalized = value.trim().replace(/,/g, '');
  if (!/^\d+$/.test(normalized)) {
    return NaN;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : NaN;
}

function isValidProposalText(value, minimumLength, maximumLength, allowLineBreaks) {
  if (typeof value !== 'string') {
    return false;
  }

  const text = value.trim();
  const length = Array.from(text).length;
  const forbiddenControls = allowLineBreaks
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u
    : /[\u0000-\u001f\u007f]/u;

  return (
    length >= minimumLength &&
    length <= maximumLength &&
    !forbiddenControls.test(text)
  );
}

function isValidManuscriptUrl(value) {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.trim().length > MAX_MANUSCRIPT_URL_LENGTH ||
    /\s/.test(value.trim())
  ) {
    return false;
  }

  try {
    const url = new URL(value.trim());

    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function validateSubmission(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : {};

  const title = typeof source.title === 'string' ? source.title.trim() : '';
  const genre = normalizeGenre(source.genre);
  const wordCount = normalizeWordCount(source.wordCount);
  const synopsis = typeof source.synopsis === 'string' ? source.synopsis.trim() : '';
  const manuscriptUrl = typeof source.manuscriptUrl === 'string'
    ? source.manuscriptUrl.trim()
    : '';

  const fieldErrors = {};

  if (!isValidProposalText(title, 1, MAX_TITLE_LENGTH, false)) {
    fieldErrors.title = `Title is required and must be no more than ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!genre) {
    fieldErrors.genre = 'Please select an accepted manuscript genre.';
  }

  if (!Number.isSafeInteger(wordCount) || wordCount <= 0 || wordCount > MAX_WORD_COUNT) {
    fieldErrors.wordCount = `Word count must be a positive whole number no greater than ${MAX_WORD_COUNT.toLocaleString('en-US')}.`;
  }

  if (!isValidProposalText(
    synopsis,
    MIN_SYNOPSIS_LENGTH,
    MAX_SYNOPSIS_LENGTH,
    true
  )) {
    fieldErrors.synopsis = `Synopsis must be between ${MIN_SYNOPSIS_LENGTH} and ${MAX_SYNOPSIS_LENGTH} characters.`;
  }

  if (!isValidManuscriptUrl(manuscriptUrl)) {
    fieldErrors.manuscriptUrl = 'Manuscript URL must be a valid HTTPS address.';
  }

  const errors = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message
  }));

  for (const [field, message] of Object.entries(fieldErrors)) {
    Object.defineProperty(errors, field, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: message
    });
  }

  const data = {
    title,
    genre,
    wordCount,
    synopsis,
    manuscriptUrl
  };

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0].message : null,
    errors,
    fieldErrors,
    data,
    value: data,
    values: data
  };
}

module.exports = {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateSubmission
};