DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session_tokens CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS restaurant CASCADE;
DROP TABLE IF EXISTS occasion CASCADE;
DROP TABLE IF EXISTS seating_zone CASCADE;
DROP TABLE IF EXISTS restaurant_frontpage CASCADE;
DROP TABLE IF EXISTS customer_contact CASCADE;
DROP TABLE IF EXISTS booking CASCADE;

-- Restaurant accounts
CREATE TABLE account
(
    id            UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    email         TEXT  NOT NULL UNIQUE,
    password_hash BYTEA NOT NULL CHECK (length(password_hash) = 256),
    password_salt BYTEA NOT NULL CHECK (length(password_salt) = 128)
);
-- Speed up indexing of account on email comparisons by constructing a searchable binary tree
CREATE INDEX idx_account_email ON account (email);

CREATE TABLE availability
(
    id                  UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    monday_hour_mask    BIGINT NOT NULL,
    tuesday_hour_mask   BIGINT NOT NULL,
    wednesday_hour_mask BIGINT NOT NULL,
    thursday_hour_mask  BIGINT NOT NULL,
    friday_hour_mask    BIGINT NOT NULL,
    saturday_hour_mask  BIGINT NOT NULL,
    sunday_hour_mask    BIGINT NOT NULL
);

CREATE TABLE restaurant
(
    id                   UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    account_id           UUID NOT NULL,
    availability_id      UUID NOT NULL,
    name                 TEXT NOT NULL,
    email                TEXT,
    phone                TEXT,
    description          TEXT,
    location_text        TEXT,
    location_url         TEXT,
    frontpage_markdown   TEXT,
    max_people_per_table INT  NOT NULL CHECK (max_people_per_table > 0),
    booking_capacity     INT  NOT NULL,
    booking_length       INT  NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE occasion
(
    availability_id  UUID   NOT NULL,
    close_date       DATE   NOT NULL,
    hour_mask        BIGINT NOT NULL CHECK (hour_mask > 0), -- Check that they've actually set some time off
    yearly_recurring BOOL DEFAULT false,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE customer_contact
(
    id          UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    given_name  TEXT NOT NULL,
    family_name TEXT NOT NULL,
    phone       TEXT,
    email       TEXT NOT NULL
);

CREATE TABLE booking
(
    id               UUID PRIMARY KEY                  DEFAULT pg_catalog.gen_random_uuid(),
    contact_id       UUID                     NOT NULL,
    restaurant_id    UUID                     NOT NULL,
    party_size       INT                      NOT NULL CHECK (party_size > 0),
    booking_date     DATE                     NOT NULL,
    time_slot        INT                      NOT NULL,
    creation_date    TIMESTAMP WITH TIME ZONE NOT NULL,
    customer_created BOOL                     NOT NULL DEFAULT TRUE,
    attendance       TEXT CHECK (attendance IN ('attended', 'cancelled', 'no-show')),
    customer_notes   TEXT,
    restaurant_notes TEXT,
    FOREIGN KEY (contact_id) REFERENCES customer_contact (id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE
);
-- Create binary tree indexes to optimise searches filtered by restaurants, restaurants & contacts (compound), and start times.
CREATE INDEX idx_booking_restaurant ON booking (restaurant_id);
CREATE INDEX idx_booking_restaurant_contact ON booking (restaurant_id, contact_id);
CREATE INDEX idx_booking_start_time ON booking (start_time);