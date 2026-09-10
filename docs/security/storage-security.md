# Storage security

**Not applied at original writing.** Local private bucket `member-documents` exists after the Database Gate. Storage HTTP was **EXECUTED** in Phase 4 (anon denied, owner allowed, cross-user denied, EXCO review read only). Signed URL helpers are **not** implemented.

| Topic | Contract |
| --- | --- |
| Bucket | `member-documents`, `public: false` |
| Objects | CV, PROFESSIONAL_CERTIFICATE, BUSINESS_REGISTRATION, OTHER |
| Path | `documents/{auth.uid()}/{document_id}` — second segment must equal authenticated uid |
| Metadata | `documents` row; `storage_key` is SYSTEM — never directory JSON |
| Upload | Authenticated owner; server validates size/MIME/extension independently of client `Content-Type`; max size TBD; sanitize filename |
| Access | Authorize in application, then short-lived signed URL |
| View-only | No product **download** action for EXCO; in-app view via signed URL. **Does not** make copying in a browser impossible |
| Replacement | New object + metadata; old object deleted server-side |
| Deletion | Retention OPEN (LEGAL REVIEW REQUIRED); no public ACL |
| Malware | V1 none; future scanner before `UNDER_REVIEW` |
| Anon | No storage policies for `anon` |

Trust not: filename, extension, client MIME.

Headshots use `profile_image_storage_key` (private). They are not public objects on `member-documents`.
