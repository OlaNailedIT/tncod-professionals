-- Private Storage policies (DESIGN ONLY, NOT APPLIED)
-- Bucket: member-documents (private = public:false). No anon policies = default deny.
-- Path: documents/{auth.uid()}/{document_id}
-- Path segments are compared exactly to auth.uid(); UUID possession of another user
-- does not satisfy foldername[2]. Reject names with extra segments in Phase 4 app validation.
-- View-only means: no product download action + short-lived signed URL after authorize.
-- It does NOT make browser copying impossible.

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('member-documents', 'member-documents', false);

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

-- No policy for role anon on this bucket.
-- Signed URLs are minted only by the application after domain authorization.
