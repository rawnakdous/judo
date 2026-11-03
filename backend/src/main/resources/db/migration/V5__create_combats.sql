create table combats (
    id bigserial primary key,
    event_id bigint not null references events(id) on delete cascade,
    tatami_id bigint not null references tatamis(id) on delete cascade,
    athlete_1_id bigint not null references athletes(id),
    athlete_2_id bigint not null references athletes(id),
    combat_number integer not null,
    weight_category varchar(40) not null,
    age_category varchar(80) not null,
    status varchar(30) not null check (status in ('UPCOMING', 'IN_PROGRESS', 'FINISHED')),
    scheduled_start_time timestamptz,
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chk_distinct_athletes check (athlete_1_id <> athlete_2_id)
);

create index idx_combats_event_tatami on combats (event_id, tatami_id);
create index idx_combats_status on combats (status);
create index idx_combats_schedule on combats (scheduled_start_time);
