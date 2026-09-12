-- 3K.2B.1: Supabase Storage may update object metadata during a normal upload.
-- Keep that update limited to the exact reserved family resource object.
drop policy if exists "mylearna learning resources update reserved" on storage.objects;
create policy "mylearna learning resources update reserved"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'learning-resources'
  and (storage.foldername(name))[1] = 'family'
  and public.is_family_member(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.family_resource_files file_row
    join public.resource_file_upload_reservations reservation
      on reservation.resource_file_id = file_row.id
     and reservation.object_path = file_row.object_path
     and reservation.created_by_user_id = auth.uid()
     and reservation.status in ('reserved', 'uploaded')
     and reservation.expires_at >= now()
    where file_row.family_id = ((storage.foldername(name))[2])::uuid
      and file_row.object_path = name
      and file_row.created_by_user_id = auth.uid()
      and file_row.status in ('pending', 'ready')
  )
)
with check (
  bucket_id = 'learning-resources'
  and (storage.foldername(name))[1] = 'family'
  and public.is_family_member(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.family_resource_files file_row
    join public.resource_file_upload_reservations reservation
      on reservation.resource_file_id = file_row.id
     and reservation.object_path = file_row.object_path
     and reservation.created_by_user_id = auth.uid()
     and reservation.status in ('reserved', 'uploaded')
     and reservation.expires_at >= now()
    where file_row.family_id = ((storage.foldername(name))[2])::uuid
      and file_row.object_path = name
      and file_row.created_by_user_id = auth.uid()
      and file_row.status in ('pending', 'ready')
  )
);
