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
    max_party_size       INT  NOT NULL CHECK (max_party_size > 0),
    booking_capacity     INT  NOT NULL,
    booking_length       INT  NOT NULL,
    tags                 TEXT[],
    FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE,
    FOREIGN KEY (availability_id) REFERENCES availability (id) ON DELETE CASCADE
);

CREATE TABLE occasion
(
    availability_id  UUID   NOT NULL,
    close_date       DATE   NOT NULL,
    hour_mask        BIGINT NOT NULL,
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
    attendance       TEXT CHECK (attendance IN ('attended', 'cancelled', 'no-show', 'pending')) DEFAULT 'pending',
    customer_notes   TEXT,
    restaurant_notes TEXT,
    FOREIGN KEY (contact_id) REFERENCES customer_contact (id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id) ON DELETE CASCADE
);
-- Create binary tree indexes to optimise searches filtered by restaurants, restaurants & contacts (compound), and start times.
CREATE INDEX idx_booking_restaurant ON booking (restaurant_id);
CREATE INDEX idx_booking_restaurant_contact ON booking (restaurant_id, contact_id);
CREATE INDEX idx_booking_booking_date ON booking (booking_date);

-- ===== ACCOUNTS =====
INSERT INTO account (id, email, password_hash, password_salt)
VALUES
-- The Queen’s Regret
('11111111-1111-1111-1111-111111111111', 'british.grub@example.com',
 decode('9b74c9897bac770ffc029102a200c5de3a5f4f61d5c2e2d2b3e9f4d3a9f0e5d2' || lpad('', 256*2 - 64, '0'), 'hex'),
 decode('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' || lpad('', 128*2 - 64, '0'), 'hex')),
-- Derulo’s Midnight Munchies
('44444444-4444-4444-4444-444444444444', 'derulo.dines@example.com',
 decode('5d41402abc4b2a76b9719d911017c592' || lpad('', 256*2 - 32, '0'), 'hex'),
 decode('3c6e0b8a9c15224a8228b9a98ca1531d' || lpad('', 128*2 - 32, '0'), 'hex')),
-- Kamal’s Aussie Steakhouse
('77777777-7777-7777-7777-777777777777', 'kamal.steakhouse@example.com',
 decode('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' || lpad('', 256*2 - 64, '0'), 'hex'),
 decode('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' || lpad('', 128*2 - 64, '0'), 'hex')),
-- Pâtisserie Chaos
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'patisserie.chaos@example.com',
 decode('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' || lpad('', 256*2 - 64, '0'), 'hex'),
 decode('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' || lpad('', 128*2 - 64, '0'), 'hex')),
-- Vegan Vortex
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vegan.vortex@example.com',
 decode('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || lpad('', 256*2 - 64, '0'), 'hex'),
 decode('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' || lpad('', 128*2 - 64, '0'), 'hex'));

-- ===== AVAILABILITY =====
INSERT INTO availability (id, monday_hour_mask, tuesday_hour_mask, wednesday_hour_mask, thursday_hour_mask,
                          friday_hour_mask, saturday_hour_mask, sunday_hour_mask)
VALUES
-- Queen’s Regret: 24/7
('22222222-2222-2222-2222-222222222222', 16777215,16777215,16777215,16777215,16777215,16777215,16777215),
-- Derulo: 6pm–2am
('55555555-5555-5555-5555-555555555555', 16777155,16777155,16777155,16777155,16777155,16777155,16777155),
-- Kamal: 24/7
('88888888-8888-8888-8888-888888888888', 16777215,16777215,16777215,16777215,16777215,16777215,16777215),
-- Pâtisserie Chaos: 9am–6pm
('99999999-9999-9999-9999-999999999998', 262143,262143,262143,262143,262143,262143,262143),
-- Vegan Vortex: 10am–8pm
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 1023*1024,1023*1024,1023*1024,1023*1024,1023*1024,1023*1024,1023*1024);

-- ===== RESTAURANTS =====
INSERT INTO restaurant (id, account_id, availability_id, name, email, phone, description, location_text,
                        location_url, frontpage_markdown, max_party_size, booking_capacity, booking_length, tags)
VALUES
-- Queen’s Regret
('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'The Queen’s Regret','british.grub@example.com','+44 20 7946 0958','Authentic British cuisine, served without remorse.',
 '221B Baker Street, London','https://goo.gl/maps/fakebritishrestaurant',
 '### About Us
Our food is so undeniably British that most people can’t keep it down.
Perfect if you’re looking for an unforgettable (and slightly regrettable) dining experience.
Fish, chips, mushy peas, and guaranteed regret in every bite.',8,20,90,'{"british", "vomit-inducing"}'),
-- Derulo
('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555',
 'Derulo’s Midnight Munchies','derulo.dines@example.com','+1 305-555-0101','Celebrity-owned late-night hotspot serving dishes with rhythm and soul.',
 'Miami Beach, Florida','https://goo.gl/maps/jasondereulo',
 '## Welcome to Derulo’s Midnight Munchies 🎤
Jason Derulo’s culinary stage — open when the rest of the world sleeps.
Expect flashy cocktails, remixed comfort food, and live mic moments where Jason himself might sing your order.
Come hungry, leave singing “Jason Deruuulooooo!”.',12,50,120,'{"celebrity-owned", "late-night", "derulo"}'),
-- Kamal
('99999999-9999-9999-9999-999999999999','77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888888',
 'Kamal’s Aussie Steakhouse','kamal.steakhouse@example.com','+61 2 5555 1212','All the steaks, all the Kamals.',
 'Sydney, Australia','https://goo.gl/maps/fakekamalsteakhouse',
 '### Kamal’s Aussie Steakhouse
Every staff member is named Kamal.
Expect premium steaks, zero surprises (except maybe their names).',10,30,120,'{"steakhouse", "australian", "kamal"}'),
-- Pâtisserie Chaos
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','99999999-9999-9999-9999-999999999998',
 'Pâtisserie Chaos','patisserie.chaos@example.com','+33 1 2345 6789','Over-the-top French desserts.',
 'Paris, France','https://goo.gl/maps/fakepatisserie',
 '### Pâtisserie Chaos
Croissants that could collapse your will to live, macarons that might start a small fire in your mouth.
Bon appétit, if you dare.',6,15,90,'{"french", "dessert", "chaotic"}'),
-- Vegan Vortex
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
 'Vegan Vortex','vegan.vortex@example.com','+44 20 1234 5678','Experimental plant-based cuisine.',
 'London, UK','https://goo.gl/maps/fakeveganvortex',
 '### Vegan Vortex
Where kale meets chaos. Only the brave leave smiling. No animals harmed, some egos destroyed.',8,20,60, '{"vegan", "experimental", "plant-based"}');

-- ===== EXTRA BOOKINGS: James Chrongus, Michael Cuxley, Bruce Bloje, Marques Brownlee =====

-- Customer contact records
INSERT INTO customer_contact (id, given_name, family_name, phone, email) VALUES
('00000000-0000-0000-0000-000000000008', 'James', 'Chrongus', '+1 555-0108', 'james.chrongus@example.com'),
('00000000-0000-0000-0000-000000000009', 'Michael', 'Cuxley', '+1 555-0109', 'michael.cuxley@example.com'),
('00000000-0000-0000-0000-000000000010', 'Bruce', 'Bloje', '+1 555-0110', 'bruce.bloje@example.com'),
('00000000-0000-0000-0000-000000000011', 'Marques', 'Brownlee', '+1 555-0111', 'marques.brownlee@example.com');

