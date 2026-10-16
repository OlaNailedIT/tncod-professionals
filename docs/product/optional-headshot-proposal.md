# Optional headshot — proposal only

**Status:** NOT APPROVED / NOT IMPLEMENTED  
**Date:** 2026-10-16  
**Does not block** the EXCO navigation fix.

This is the smallest useful version that can ship before launch if the scope is approved. It does not change completion percentage, verification, publication, or directory visibility.

## What exists

- `profiles.profile_image_storage_key` is already on the profile. Profile edit explicitly refuses to write it, including a client-supplied key.
- Completion treats a headshot as display-only and keeps it out of the percentage denominator (`headshotDeferred: true`).
- Spotlight eligibility already treats a non-empty key as “headshot on file.” It does not display the file.
- Directory and visibility projections omit storage keys. Phase 14 marks headshot exposure as deferred.
- Private files already use the `member-documents` bucket. Business documents are stored at `documents/{auth user id}/{document id}`, with the key chosen on the server, magic-byte checks, and a 10 MB cap.

## Smallest version

A member can upload, preview, replace, and remove one image on their own profile. The file is private. It does not appear in the directory, and it does not change completion, verification, or publication.

## Files

| Change | Path |
| --- | --- |
| Server command: validate, store, replace, remove | `src/features/profile/headshot.ts` (new) |
| JPEG/PNG/WebP sniff and 2 MB cap | `src/features/profile/headshot-schema.ts` (new) |
| Server action used by the profile editor | `src/features/profile/headshot-actions.ts` (new) |
| Preview, replace, and remove controls | `src/app/profile/edit/page.tsx` and a small client control beside the existing editor |
| Owner-only signed preview | generated in the profile page from the stored key. No public URL |
| Storage policies | new SQL migration under `supabase/migrations/` for prefix `headshots/{auth.uid()}/` in `member-documents` |
| Tests | command tests for ownership, sniff, size, replacement, removal, and rejection of a client-supplied key |

No Prisma migration. The column already exists. No change to `src/features/profile/completion.ts`.

## Storage

- Bucket: existing private `member-documents`. No new public bucket.
- Key, always server-built: `headshots/{session user id}/current`.
- Upload uses the service role after the session user is resolved, matching business documents.
- Replace deletes the previous object, then writes the new bytes to the same key, then leaves the column set.
- Remove deletes the object and sets `profile_image_storage_key` to null.
- Policies allow `authenticated` insert, select, update, and delete only when the first folder is `headshots` and the second folder is `auth.uid()`. No anon policy. No policy that accepts an arbitrary key.

## Validation and ownership

- Session user only. `rejectClientIdentity` discards a claimed user id.
- The update writes `profile_image_storage_key` only on the profile whose `userId` is the session user.
- The profile-edit schema continues to strip `profile_image_storage_key`. The headshot action does not accept a key field.
- Allowed types after magic-byte sniff: JPEG, PNG, WebP. The browser `Content-Type` is not trusted.
- Maximum size: 2 MB.
- Empty files are rejected.
- A failed storage write does not update the profile row. A failed profile update deletes the object just written.

## Where it appears

| Surface | Proposed rule |
| --- | --- |
| Own profile and profile editor | Signed preview for the signed-in owner |
| Public directory and member directory cards | **Not shown.** No new projection field |
| EXCO professional record | Unchanged. Existing “headshot on file” boolean may become true. The image itself is not added |
| Spotlight | Unchanged. Eligibility can see that a key exists. No new public spotlight image |

Visibility rule: **owner-only until a later, separate visibility decision.** Presence of a key does not publish the profile and does not satisfy directory exposure.

## Tests

- MEMBER can upload, replace, and remove only their own key.
- A second member cannot read, replace, or clear the first member’s key.
- A client-supplied storage key is ignored.
- Oversize, empty, and non-image bytes are rejected and leave the column unchanged.
- Completion percent is unchanged when a key is added or removed.
- Directory projection fixtures still omit `profileImageStorageKey` and any image URL.

## Effort and dependencies

About two to three days after approval, including the storage migration and tests.

Depends on an approved storage migration for the `headshots/` prefix. Does not depend on the EXCO navigation fix. Does not require a completion, verification, or directory change.

Do not implement this document until the scope is explicitly approved.
