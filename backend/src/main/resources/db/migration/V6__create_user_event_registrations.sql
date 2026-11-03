create table user_event_registrations (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    event_id bigint not null references events(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint uk_user_event unique (user_id, event_id)
);
