create table users (
    id bigserial primary key,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(190) not null unique,
    password_hash varchar(255) not null,
    role varchar(20) not null check (role in ('USER', 'ADMIN')),
    profile_image_url varchar(500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index idx_users_email on users (lower(email));
