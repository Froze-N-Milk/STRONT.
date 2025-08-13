CREATE TABLE event (
	id INTEGER PRIMARY KEY,
	name STRING NOT NULL,
	start_time INTEGER NOT NULL, -- number of hours from the start of day
	duration INTEGETER NOT NULL CHECK ( duration > 0 ), -- number of hours to add to start_time
	start_date INTEGER NOT NULL, -- unix timestamp day
	days INTEGER NOT NULL -- number of days
);

CREATE TABLE person (
	id INTEGER PRIMARY KEY,
	event_id INTEGER REFERENCES event ( id ) ON DELETE CASCADE ON UPDATE CASCADE,
	name STRING NOT NULL
);

CREATE TABLE availability (
	event_id INTEGER REFERENCES event ( id ) ON DELETE CASCADE ON UPDATE CASCADE,
	person_id INTEGER REFERENCES person ( id ) ON DELETE CASCADE ON UPDATE CASCADE,
	start_time INTEGER NOT NULL, -- number of chunks from the start of day
	duration INTEGETER NOT NULL CHECK ( duration > 0 ) -- number of chunks to add to start_time
);
