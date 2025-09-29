# Requirements:
- go
- node
- make
- docker compose (podman-compose does not work for this)

# Commands:

## Building for production
`make build` -- builds all compose stages

`make run` -- runs the production compose configuration (embedded web app)

## Development
`make dev` -- runs the dev compose configuration (separate front-end and back-end containers)

This will host the server locally at http://localhost:3000 by default. You
should not access the vite (frontend) dev server directly, the go server will
proxy it.

## Other:
`make` -- will run production build by default

`make clean` -- removes local build outputs, stops and removes compose containers


//Quick seed (one-liner)
// NOTE FOR DEVELOPERS:
// If you are using the "Quick seed" instructions in README to insert demo data,
// you must adjust the slice initialization in this file.
//
// Original buggy code:
//     res := make([]T, 0, len(xs))  // causes "index out of range" if assigned by index
//
// Correct version:
//     res := make([]T, len(xs))     // ensures slice has the right length
//
// This applies to both backend/api/account.go and backend/api/restaurant.go.

docker compose -f compose.yaml -f compose.dev.yaml exec -T -e PGPASSWORD=password db sh -lc '
psql -U admin -d restaurant_db -v ON_ERROR_STOP=1 <<SQL
WITH av AS (
  INSERT INTO availability (
    monday_hour_mask, tuesday_hour_mask, wednesday_hour_mask,
    thursday_hour_mask, friday_hour_mask, saturday_hour_mask, sunday_hour_mask
  ) VALUES (0,0,0,0,0,0,0)
  RETURNING id
)
INSERT INTO restaurant (
  account_id, availability_id, name, description, location_text,
  max_party_size, booking_capacity, booking_length
)
SELECT (SELECT id FROM account WHERE email = '\''admin@example.com'\''), av.id,
       '\''Demo Resto'\'', '\''Seeded via SQL (demo)'\'', '\''123 Demo St, Sydney NSW'\'',
       10, 40, 60
FROM av
ON CONFLICT DO NOTHING;
SQL'