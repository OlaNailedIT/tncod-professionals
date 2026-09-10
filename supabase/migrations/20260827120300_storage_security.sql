-- Requires Supabase Storage (storage.buckets, storage.objects).
-- Do not apply on vanilla PostgreSQL.
-- Bucket is private. No anon policies.

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY storage_documents_insert_own
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND app.account_is_active()
  );

CREATE POLICY storage_documents_select_own
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_documents_select_review
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND app.has_permission('document.review')
  );

CREATE POLICY storage_documents_update_own
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY storage_documents_delete_own
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
