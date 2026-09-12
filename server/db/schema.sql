BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_display_name_not_blank CHECK (BTRIM(display_name) <> ''),
    CONSTRAINT users_email_not_blank CHECK (BTRIM(email) <> ''),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
    ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(180) NOT NULL,
    title VARCHAR(240) NOT NULL,
    author_name VARCHAR(160) NOT NULL,
    genre VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    cover_theme VARCHAR(40) NOT NULL DEFAULT 'burgundy',
    publication_date DATE,
    isbn VARCHAR(32),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT books_slug_unique UNIQUE (slug),
    CONSTRAINT books_isbn_unique UNIQUE (isbn),
    CONSTRAINT books_slug_format CHECK (
        slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
    CONSTRAINT books_title_not_blank CHECK (BTRIM(title) <> ''),
    CONSTRAINT books_author_name_not_blank CHECK (BTRIM(author_name) <> ''),
    CONSTRAINT books_genre_not_blank CHECK (BTRIM(genre) <> ''),
    CONSTRAINT books_description_not_blank CHECK (BTRIM(description) <> ''),
    CONSTRAINT books_excerpt_not_blank CHECK (BTRIM(excerpt) <> '')
);

CREATE INDEX IF NOT EXISTS books_published_featured_idx
    ON books (published, featured);

CREATE INDEX IF NOT EXISTS books_publication_date_idx
    ON books (publication_date DESC)
    WHERE published = TRUE;

CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(240) NOT NULL,
    genre VARCHAR(80) NOT NULL,
    word_count INTEGER NOT NULL,
    synopsis TEXT NOT NULL,
    manuscript_url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT submissions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT submissions_title_not_blank CHECK (BTRIM(title) <> ''),
    CONSTRAINT submissions_genre_not_blank CHECK (BTRIM(genre) <> ''),
    CONSTRAINT submissions_word_count_positive CHECK (word_count > 0),
    CONSTRAINT submissions_synopsis_not_blank CHECK (BTRIM(synopsis) <> ''),
    CONSTRAINT submissions_manuscript_url_not_blank CHECK (
        BTRIM(manuscript_url) <> ''
    ),
    CONSTRAINT submissions_status_check CHECK (
        status IN (
            'received',
            'under_review',
            'revisions_requested',
            'accepted',
            'declined',
            'withdrawn'
        )
    )
);

CREATE INDEX IF NOT EXISTS submissions_user_created_at_idx
    ON submissions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS submissions_status_idx
    ON submissions (status);

CREATE TABLE IF NOT EXISTS "session" (
    sid VARCHAR NOT NULL,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS session_expire_idx
    ON "session" (expire);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS books_set_updated_at ON books;
CREATE TRIGGER books_set_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS submissions_set_updated_at ON submissions;
CREATE TRIGGER submissions_set_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

INSERT INTO books (
    slug,
    title,
    author_name,
    genre,
    description,
    excerpt,
    cover_theme,
    publication_date,
    isbn,
    featured,
    published
)
VALUES
    (
        'the-cartographers-promise',
        'The Cartographer''s Promise',
        'Elena Marlowe',
        'Historical Fiction',
        'A gifted mapmaker follows a trail of hidden coastlines and family secrets, discovering that the most important borders are the ones people carry within themselves.',
        'By dawn, the ink had dried into a coastline that did not exist on any official chart. Mara traced the unfamiliar harbor with one careful finger and wondered why her father had spent twenty years trying to erase it.',
        'burgundy',
        DATE '2025-03-18',
        '978-1-7390010-1-4',
        TRUE,
        TRUE
    ),
    (
        'where-the-tides-remember',
        'Where the Tides Remember',
        'Noah Vale',
        'Literary Fiction',
        'After returning to his storm-worn island home, a marine photographer confronts an old disappearance and the community that taught itself to live around the silence.',
        'The island remembered every storm by name. It remembered the boats that returned and the ones that did not, though no one in the harbor spoke of either after sunset.',
        'navy',
        DATE '2024-09-24',
        '978-1-7390010-2-1',
        TRUE,
        TRUE
    ),
    (
        'a-season-of-small-fires',
        'A Season of Small Fires',
        'Mina Hart',
        'Contemporary Fiction',
        'Four neighbors in a changing city discover how ordinary acts of courage can alter a family, a street, and the future they thought had already been decided.',
        'The first fire fit inside a teacup. June watched the blue flame lean toward the open window, as if even it knew there was somewhere else to be.',
        'gold',
        DATE '2025-01-14',
        '978-1-7390010-3-8',
        TRUE,
        TRUE
    ),
    (
        'the-last-lantern-keeper',
        'The Last Lantern Keeper',
        'Amara Bell',
        'Fantasy',
        'In a kingdom where memories are kept as light, an apprentice guardian must protect the final lantern before an ambitious ruler can rewrite the past.',
        'Every lantern held a memory, but only one still knew her name. Liora lifted it from the darkened shelf and felt the glass pulse warmly against her palms.',
        'forest',
        DATE '2024-06-11',
        '978-1-7390010-4-5',
        FALSE,
        TRUE
    )
ON CONFLICT (slug) DO NOTHING;

COMMIT;