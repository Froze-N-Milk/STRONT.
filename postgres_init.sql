DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session_tokens CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS restaurant CASCADE;
DROP TABLE IF EXISTS availability_exclusion CASCADE;
DROP TABLE IF EXISTS seating_zone CASCADE;
DROP TABLE IF EXISTS restaurant_frontpage CASCADE;
DROP TABLE IF EXISTS customer_contact CASCADE;
DROP TABLE IF EXISTS booking CASCADE;

CREATE TABLE account
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash BYTEA CHECK (length(password_hash) = 256),
    password_salt BYTEA CHECK (length(password_salt) = 128)
);
CREATE INDEX ON account USING HASH (email);

/*CREATE TABLE session_tokens
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE
);
*/
CREATE TABLE availability
(
    id                  UUID PRIMARY KEY,
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
    id              UUID PRIMARY KEY,
    account_id      UUID NOT NULL,
    availability_id UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    location_text   TEXT,
    location_url    TEXT,
    FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE availability_exclusion
(
    id               UUID PRIMARY KEY,
    availability_id  UUID   NOT NULL,
    close_date       DATE   NOT NULL,
    hour_mask        BIGINT NOT NULL CHECK (hour_mask > 0), -- Check that they've actually set some time off
    yearly_recurring BOOL DEFAULT false,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE seating_zone
(
    id            UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    zone_name     TEXT,
    seats         INT  NOT NULL CHECK (seats > 0),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE
);

CREATE TABLE restaurant_frontpage
(
    id            UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    markdown      TEXT
);

CREATE TABLE customer_contact
(
    id          UUID PRIMARY KEY,
    given_name  TEXT NOT NULL,
    family_name TEXT NOT NULL,
    phone       TEXT,
    email       TEXT NOT NULL
);

CREATE TABLE booking
(
    id            UUID PRIMARY KEY,
    contact_id    UUID                     NOT NULL,
    restaurant_id UUID                     NOT NULL,
    seating_id    UUID                     NOT NULL,
    start_time    TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time      TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES customer_contact (id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE,
    FOREIGN KEY (seating_id) REFERENCES seating_zone (id) ON DELETE CASCADE
);