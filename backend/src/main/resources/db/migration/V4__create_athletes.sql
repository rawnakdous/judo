create table athletes (
    id bigserial primary key,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    club varchar(160) not null,
    country varchar(120),
    profile_image_url varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_athletes_name on athletes (last_name, first_name);
