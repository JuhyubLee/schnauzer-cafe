-- 꼬순내 분식 서버 쪽. Supabase(Postgres)에서 한 번 실행한다. 다시 실행해도 된다.
-- 가게 모습을 맡아 두었다가 놀러 온 친구에게 최신 모습을 주고, 신고를 받는다.
-- 표는 kkosunnae 스키마에 두고 밖에서는 직접 읽거나 쓸 수 없다. 게임은 아래 public.kk_* 함수만 부른다.
-- 로그인이 없으므로, 가게마다 기기에서 만든 열쇠(p_key)를 처음 올릴 때 적어 두고 그 열쇠로만 고치거나 지울 수 있다.

create schema if not exists kkosunnae;
create extension if not exists pg_net with schema extensions;

create table if not exists kkosunnae.shops (
  id text primary key check (id ~ '^[a-z0-9]{6,24}$'),
  key_hash text not null,
  snap jsonb not null,                       -- 초대장과 같은 모양의 가게 겉모습
  hidden boolean not null default false,     -- 신고가 맞으면 운영자가 true로 바꿔 가린다
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shops_updated_at on kkosunnae.shops (updated_at);

create table if not exists kkosunnae.reports (
  id bigint generated always as identity primary key,
  shop_id text not null,
  reason text not null,
  reporter text,                             -- 신고한 쪽의 가게 번호(있으면)
  snap jsonb,                                -- 신고할 때 보고 있던 모습
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table kkosunnae.shops enable row level security;
alter table kkosunnae.reports enable row level security;
revoke all on schema kkosunnae from anon, authenticated;
revoke all on all tables in schema kkosunnae from anon, authenticated;

-- 가게 모습에서 사람이 지은 이름만 뽑는다: 가게 이름, 동물 친구 이름, 직접 만든 메뉴 이름
create or replace function kkosunnae.names_of(p_snap jsonb) returns text
language sql immutable set search_path = '' as $$
  select coalesce(p_snap->>'n', '') || ' '
    || coalesce((select string_agg(e->>1, ' ') from jsonb_array_elements(
         case when jsonb_typeof(p_snap->'p') = 'array' then p_snap->'p' else '[]'::jsonb end) e), '') || ' '
    || coalesce((select string_agg(e->>0, ' ') from jsonb_array_elements(
         case when jsonb_typeof(p_snap->'c') = 'array' then p_snap->'c' else '[]'::jsonb end) e), '')
$$;

-- 욕설 거르기. 이름에 이런 말이 있으면 올려 주지 않는다. (그림은 걸러지지 않으므로 신고로 다룬다)
create or replace function kkosunnae.has_bad_words(p_text text) returns boolean
language sql immutable set search_path = '' as $$
  select regexp_replace(p_text, '[\s._\-*~!@#$%^&()+=]', '', 'g')
    ~* '(씨발|시발|씨바|씨팔|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|좆|존나|졸라|개새끼|개새|지랄|ㅈㄹ|닥쳐|꺼져|fuck|shit|bitch|asshole)'
$$;

-- 가게 모습을 올리거나 고친다. 돌려주는 말: ok, bad(값이 이상함), big(너무 큼), words(욕설), denied(열쇠가 다름), full(자리가 없음)
create or replace function public.kk_put_shop(p_id text, p_key text, p_snap jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_old kkosunnae.shops%rowtype;
begin
  if p_id is null or p_id !~ '^[a-z0-9]{6,24}$' or p_key is null or length(p_key) not between 16 and 64 then return 'bad'; end if;
  if p_snap is null or jsonb_typeof(p_snap) <> 'object' or p_snap->>'s' is distinct from p_id then return 'bad'; end if;
  if length(p_snap::text) > 12000 then return 'big'; end if;
  if kkosunnae.has_bad_words(kkosunnae.names_of(p_snap)) then return 'words'; end if;
  v_hash := encode(extensions.digest(p_key, 'sha256'), 'hex');
  select * into v_old from kkosunnae.shops where id = p_id;
  if found then
    if v_old.key_hash <> v_hash then return 'denied'; end if;
    update kkosunnae.shops set snap = p_snap, updated_at = now() where id = p_id;
    return 'ok';
  end if;
  -- 새 가게를 받을 때마다, 반년 동안 고쳐지지 않은 가게를 지운다.
  delete from kkosunnae.shops where updated_at < now() - interval '180 days';
  if (select count(*) from kkosunnae.shops) >= 20000 then return 'full'; end if;
  insert into kkosunnae.shops (id, key_hash, snap) values (p_id, v_hash, p_snap);
  return 'ok';
end $$;

-- 가게의 최신 모습. 없으면 null, 가려진 가게면 {"hidden": true}, 있으면 {"snap": ..., "at": 고친 시각}
create or replace function public.kk_get_shop(p_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when hidden then jsonb_build_object('hidden', true)
              else jsonb_build_object('snap', snap, 'at', updated_at) end
  from kkosunnae.shops where id = p_id
$$;

-- 올려 둔 가게 모습을 지운다(공유 끄기). 돌려주는 말: ok, none(없거나 열쇠가 다름)
create or replace function public.kk_delete_shop(p_id text, p_key text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or p_key is null then return 'none'; end if;
  delete from kkosunnae.shops where id = p_id and key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if found then return 'ok'; end if;
  return 'none';
end $$;

-- 신고를 받는다. 받으면 운영자 휴대전화로 알림을 보낸다(알림 주제는 vault의 kk_ntfy_topic. 저장소에는 적지 않는다).
-- 돌려주는 말: ok, bad, busy(하루에 받을 수 있는 신고를 넘김)
create or replace function public.kk_report_shop(p_id text, p_reason text, p_reporter text, p_snap jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_reason text := left(coalesce(nullif(trim(p_reason), ''), '(사유를 적지 않음)'), 200);
  v_snap jsonb := p_snap;
  v_topic text;
begin
  if p_id is null or p_id !~ '^[a-z0-9]{6,24}$' then return 'bad'; end if;
  if p_reporter is not null and p_reporter !~ '^[a-z0-9]{6,24}$' then p_reporter := null; end if;
  if v_snap is not null and (jsonb_typeof(v_snap) <> 'object' or length(v_snap::text) > 12000) then v_snap := null; end if;
  if (select count(*) from kkosunnae.reports where created_at > now() - interval '1 day') >= 200 then return 'busy'; end if;
  if p_reporter is not null and (select count(*) from kkosunnae.reports
      where reporter = p_reporter and created_at > now() - interval '1 day') >= 10 then return 'busy'; end if;
  if v_snap is null then select snap into v_snap from kkosunnae.shops where id = p_id; end if;
  insert into kkosunnae.reports (shop_id, reason, reporter, snap) values (p_id, v_reason, p_reporter, v_snap);
  begin
    select decrypted_secret into v_topic from vault.decrypted_secrets where name = 'kk_ntfy_topic';
    if v_topic is not null then
      perform net.http_post(
        url := 'https://ntfy.sh/',
        body := jsonb_build_object('topic', v_topic, 'title', '꼬순내 분식 신고',
          'message', format('가게 %s (%s) · %s', p_id, coalesce(v_snap->>'n', '이름 모름'), v_reason)),
        headers := '{"Content-Type": "application/json"}'::jsonb);
    end if;
  exception when others then null; -- 알림이 안 가도 신고는 남긴다
  end;
  return 'ok';
end $$;

revoke execute on function public.kk_put_shop(text, text, jsonb) from public;
revoke execute on function public.kk_get_shop(text) from public;
revoke execute on function public.kk_delete_shop(text, text) from public;
revoke execute on function public.kk_report_shop(text, text, text, jsonb) from public;
grant execute on function public.kk_put_shop(text, text, jsonb) to anon, authenticated;
grant execute on function public.kk_get_shop(text) to anon, authenticated;
grant execute on function public.kk_delete_shop(text, text) to anon, authenticated;
grant execute on function public.kk_report_shop(text, text, text, jsonb) to anon, authenticated;

-- 보관 기간(개인정보 처리방침에 적은 대로): 180일 동안 고쳐지지 않은 가게 모습과 1년 지난 신고를 날마다 지운다.
create extension if not exists pg_cron;
select cron.schedule('kk-cleanup', '20 18 * * *', $cleanup$
  delete from kkosunnae.shops where updated_at < now() - interval '180 days';
  delete from kkosunnae.reports where created_at < now() - interval '365 days';
$cleanup$);

-- 운영자가 쓰는 것 (Supabase SQL 편집기에서):
--   신고 보기:   select id, shop_id, reason, created_at from kkosunnae.reports where not handled order by id desc;
--   가게 가리기: update kkosunnae.shops set hidden = true where id = '가게 번호';
--   처리 표시:   update kkosunnae.reports set handled = true where shop_id = '가게 번호';
