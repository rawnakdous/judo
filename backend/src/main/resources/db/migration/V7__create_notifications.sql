create table notifications (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    title varchar(160) not null,
    message text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, created_at desc);
