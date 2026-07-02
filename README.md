# CBI Save All Buttons + Supabase captain images

This package keeps the Supabase captain image upload system and removes the admin page autosave behavior.

Every save button now does the exact same thing: it saves the entire admin draft to Firestore.

That means any one of the repeated **Save All Changes** buttons will save:

```txt
captains
team names
match scores
```

The buttons are repeated at the end of different sections only for convenience, so you do not have to scroll all the way up or down.

## Files to replace or add

Replace these existing files:

```txt
src/app/firebase.ts
src/app/lib/firebase.ts
src/app/league-store.ts
src/app/lib/league-store.ts
src/app/page.tsx
src/app/admin/page.tsx
firestore.rules
```

Add this file if it is not already in your project:

```txt
src/app/api/captain-image/upload/route.ts
```

## What changed in this version

- Removed the autosave timer from the admin page.
- Typing in captain names, team names, and scores now only changes the draft on the admin page.
- The live homepage updates only after pressing a save button.
- All section save buttons are now labeled **Save All Changes**.
- Every **Save All Changes** button saves the full draft, not just the section it appears in.
- Captain images still upload to Supabase immediately after drag/drop or click upload, but the image URL is only saved to Firestore after pressing any **Save All Changes** button.

## Vercel environment variables still needed

Keep your Firebase variables and add these Supabase variables:

```txt
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SUPABASE-SERVICE-ROLE-KEY
SUPABASE_STORAGE_BUCKET=captain-images
ADMIN_EMAIL=admin@cbi.com
```

Redeploy after changing files or environment variables.

## Firestore rules

Paste `firestore.rules` into:

```txt
Firebase Console → Cloud Firestore → Rules
```

This app no longer needs Firebase Storage rules because captain images are stored in Supabase Storage.
