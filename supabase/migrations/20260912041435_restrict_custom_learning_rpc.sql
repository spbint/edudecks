-- Keep the custom learning creation RPC parent-authenticated only.
revoke execute on function public.mylearna_create_custom_learning_queue_item(uuid, uuid, text, text, text) from public;
revoke execute on function public.mylearna_create_custom_learning_queue_item(uuid, uuid, text, text, text) from anon;
grant execute on function public.mylearna_create_custom_learning_queue_item(uuid, uuid, text, text, text) to authenticated;
