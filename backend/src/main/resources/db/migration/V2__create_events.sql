create table events (
    id bigserial primary key,
    title varchar(180) not null,
    description text not null,
    image_url varchar(500),
    location varchar(220) not null,
    start_datetime timestamptz not null,
    end_datetime timestamptz not null,
    organizer_name varchar(160) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_event_dates check (end_datetime > start_datetime)
);

create index idx_events_dates on events (start_datetime, end_datetime);
