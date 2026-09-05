revoke execute on function public.handle_new_user() from public;
revoke execute on function public.update_updated_at_column() from public;
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.get_electrician_id_for_user(uuid) from public;
revoke execute on function public.register_user(uuid, public.app_role, text) from public;

revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.update_updated_at_column() from anon;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.get_electrician_id_for_user(uuid) from anon;
revoke execute on function public.register_user(uuid, public.app_role, text) from anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_electrician_id_for_user(uuid) to authenticated;
grant execute on function public.register_user(uuid, public.app_role, text) to authenticated;

alter function public.update_updated_at_column() set search_path = public;