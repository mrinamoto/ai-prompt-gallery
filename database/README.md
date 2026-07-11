# Database Files

Run these files in Supabase SQL Editor during Phase 5.

1. `schema.sql`
   Creates the project tables, relationships, validation checks, indexes, triggers, storage bucket, and Row Level Security policies.

2. `make-admin.sql`
   Promotes your own Supabase Auth user to admin after you create the user.

Never paste a Supabase `service_role` key into frontend JavaScript or GitHub.

Phase 6 adds one extra profile insert policy to `schema.sql` so the protected account page can safely create the signed-in user's own profile if it is missing. If you already ran the Phase 5 schema, see `docs/phase-06-authentication.md` for the small SQL update.

Phase 7 uses the existing `likes`, `ratings`, `comments`, `saved_posts`, and `views` tables. It also adds triggers that prevent normal users from moving ratings or comments to a different post/user during updates. If your database was created before Phase 7, see `docs/phase-07-likes-ratings-comments-saves.md` for the SQL update.

Phase 8 adds search and recommendation SQL functions: `search_posts`, `get_recommended_posts`, and `get_related_searches`. If your database was created before Phase 8, run the latest `database/schema.sql` search helper block or see `docs/phase-08-search-recommendations.md`.

Phase 9 expands profile and collection visibility for public profile pages and private owner libraries. It adds collection indexes, grants anon read access to public profile and collection rows, and tightens collection-post visibility so public users only see published posts in visible collections. If your database was created before Phase 9, run the SQL update in `docs/phase-09-user-profiles-collections.md`.

Phase 10 uses the existing admin policies and `post-images` storage bucket. No service role key is needed in the frontend. To access the dashboard, create your auth user first, then run `make-admin.sql` with your email.

Phase 11 tightens grants, profile role access, admin role changes, post validation, system-managed counters, and Storage folder policies. If your database was created before Phase 11, run the latest `schema.sql` again or follow `docs/phase-11-security-rls.md`.
