DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session_tokens CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS restaurant CASCADE;
DROP TABLE IF EXISTS availability_exclusion CASCADE;
DROP TABLE IF EXISTS seating_zone CASCADE;
DROP TABLE IF EXISTS restaurant_frontpage CASCADE;
DROP TABLE IF EXISTS customer_contact CASCADE;
DROP TABLE IF EXISTS booking CASCADE;

-- Restaurant accounts
CREATE TABLE account
(
    id            UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash BYTEA NOT NULL CHECK (length(password_hash) = 256),
    password_salt BYTEA NOT NULL CHECK (length(password_salt) = 128)
);
-- Speed up indexing of account on email comparisons by constructing a searchable binary tree
CREATE INDEX idx_account_email ON account (email);

CREATE TABLE availability
(
    id                  UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    monday_hour_mask    BIGINT NOT NULL, -- Could also do a check for incorrectly formatted masks by seeing if any bits are set in the mask for 0xFFFF000000000000
    tuesday_hour_mask   BIGINT NOT NULL,
    wednesday_hour_mask BIGINT NOT NULL,
    thursday_hour_mask  BIGINT NOT NULL,
    friday_hour_mask    BIGINT NOT NULL,
    saturday_hour_mask  BIGINT NOT NULL,
    sunday_hour_mask    BIGINT NOT NULL
);

CREATE TABLE restaurant
(
    id                 UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    account_id         UUID NOT NULL,
    availability_id    UUID NOT NULL,
    name               TEXT NOT NULL,
    description        TEXT,
    location_text      TEXT,
    location_url       TEXT,
    frontpage_markdown TEXT,
    FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE availability_exclusion
(
    id               UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    availability_id  UUID   NOT NULL,
    close_date       DATE   NOT NULL,
    hour_mask        BIGINT NOT NULL CHECK (hour_mask > 0), -- Check that they've actually set some time off
    yearly_recurring BOOL             DEFAULT false,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE seating_zone
(
    id            UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    zone_name     TEXT NOT NULL,
    seats         INT  NOT NULL CHECK (seats > 0),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE
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
    id            UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
    contact_id    UUID                     NOT NULL,
    restaurant_id UUID                     NOT NULL,
    seating_id    UUID                     NOT NULL,
    start_time    TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time      TIMESTAMP WITH TIME ZONE NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    creation_method TEXT NOT NULL CHECK (creation_method IN ('online', 'phone', 'walk-in')), -- NOTE: may need to adjust contact reference if booking is walk-in
    attendance TEXT CHECK (attendance IN ('attended', 'late', 'cancelled', 'no-show') AND start_time > now()), -- Ensure that attendance can't be set until their booking is actually due to begin
    bill NUMERIC(12, 2), -- Total bill of the table
    paid NUMERIC(12, 2) CHECK (end_time >= now()), -- Amount paid towards the bill. Ensure that paid cannot be updated until they have been checked out of the booking
    FOREIGN KEY (contact_id) REFERENCES customer_contact (id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE,
    FOREIGN KEY (seating_id) REFERENCES seating_zone (id) ON DELETE CASCADE
);
-- Create binary tree indexes to optimise searches filtered by restaurants, restaurants & contacts (compound), and start times.
CREATE INDEX idx_booking_restaurant ON booking (restaurant_id);
CREATE INDEX idx_booking_restaurant_contact ON booking (restaurant_id, contact_id);
CREATE INDEX idx_booking_start_time ON booking(start_time);