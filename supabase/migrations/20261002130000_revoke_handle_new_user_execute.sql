-- handle_new_user()는 auth.users insert 트리거에서만 쓴다. SECURITY DEFINER 함수가
-- /rest/v1/rpc로 노출되지 않도록 실행 권한을 회수한다(Supabase advisor 0028, 0029).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
