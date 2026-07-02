# CBI captain photo upload with Supabase Storage

This replacement package moves the captain image file uploads away from Firebase Storage and into Supabase Storage.

Your app still uses Firebase for:

- Firebase Auth admin login
- Firestore live league data
- team names
- scores
- captain names
- the saved captain image URL/path

Supabase is used only for the actual captain image files.

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

Add this new file:

```txt
src/app/api/captain-image/upload/route.ts
```

## Supabase setup

1. Create a free Supabase project.
2. Go to Storage.
3. Create a bucket named:

```txt
captain-images
```

4. Make the bucket public.

The bucket only stores public captain photos for the golf trip website. The upload route uses your private Supabase service role key on the server, so public visitors cannot upload from the homepage.

## Vercel environment variables

Add these to Vercel > Project Settings > Environment Variables:

```txt
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SUPABASE-SERVICE-ROLE-KEY
SUPABASE_STORAGE_BUCKET=captain-images
ADMIN_EMAIL=admin@cbi.com
```

Important:

```txt
SUPABASE_SERVICE_ROLE_KEY must NOT start with NEXT_PUBLIC_.
```

The service role key must stay server-only.

Keep your existing Firebase environment variables too:

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

You no longer need this variable for this website:

```txt
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```

## Firebase rules

Paste `firestore.rules` into Firebase Console > Cloud Firestore > Rules.

Do not paste Supabase or Storage rules into the Firestore rules page.

## How uploading works

```txt
Admin page drag/drop image
→ browser sends image to /api/captain-image/upload
→ API route verifies the Firebase admin login token
→ API route uploads the image to Supabase Storage using the private service role key
→ Supabase public image URL is returned
→ admin page saves imageUrl and imagePath into Firestore
→ homepage displays the image from Supabase
```

## Uploaded file paths

Images are saved in Supabase Storage like this:

```txt
captain-images/captains/cbi-2026/A/...
captain-images/captains/cbi-2026/B/...
captain-images/captains/cbi-2026/C/...
captain-images/captains/cbi-2026/D/...
```

## Local development

For local testing, add these same variables to `.env.local`.

The uploaded project originally had `env.local` without the leading dot. Next.js expects:

```txt
.env.local
```

## Notes

- Firestore is still the database for names and scores.
- Supabase is now the file storage for captain photos.
- The uploaded captain image limit is 8 MB.
- Removed Firebase Storage from the app, so you can stay on Firebase Spark for Auth/Firestore.
