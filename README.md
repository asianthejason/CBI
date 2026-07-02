# Captain image upload replacement files

Replace these files in your project:

- `src/app/firebase.ts`
- `src/app/lib/firebase.ts`
- `src/app/league-store.ts`
- `src/app/page.tsx`
- `src/app/admin/page.tsx`

Also add the included `storage.rules` to Firebase Storage rules.

## What this adds

- Captain cards on the admin page now let you drag/drop an image or click to upload.
- Images upload to Firebase Storage at `captains/cbi-2026/<captain-slot>/...`.
- The Storage download URL and Storage path are saved in Firestore under `/leagues/cbi-2026`.
- The homepage uses the saved URL to display the captain photo.
- The old manual Photo URL input is removed.
- A Remove Photo button clears the Firestore image fields and attempts to delete the Storage file.

## Firebase setup needed

1. Go to Firebase Console.
2. Open your project.
3. Enable Storage.
4. Paste/deploy the included `storage.rules`.
5. Make sure your deployed environment variables include `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

Your current Firestore rules can stay the same.
