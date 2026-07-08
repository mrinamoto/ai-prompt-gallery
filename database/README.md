# Database Files

Run these files in Supabase SQL Editor during Phase 5.

1. `schema.sql`
   Creates the project tables, relationships, validation checks, indexes, triggers, storage bucket, and Row Level Security policies.

2. `make-admin.sql`
   Promotes your own Supabase Auth user to admin after you create the user.

Never paste a Supabase `service_role` key into frontend JavaScript or GitHub.

Phase 6 adds one extra profile insert policy to `schema.sql` so the protected account page can safely create the signed-in user's own profile if it is missing. If you already ran the Phase 5 schema, see `docs/phase-06-authentication.md` for the small SQL update.
