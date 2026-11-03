create table tatamis (
    id bigserial primary key,
    event_id bigint not null references events(id) on delete cascade,
    number integer not null,
    name varchar(80) not null,
    live_url varchar(500),
    is_active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uk_tatami_event_number unique (event_id, number)
);

create index idx_tatamis_event on tatamis (event_id);
