import { createPublicKey, createVerify } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LEAGUE_ID = "cbi-2026";
const TEAM_IDS = new Set(["A", "B", "C", "D"]);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type FirebaseTokenPayload = {
  aud?: string;
  iss?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  email?: string;
};

type JwtHeader = {
  alg?: string;
  kid?: string;
};

function base64UrlToBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function parseJwtPart<T>(value: string): T {
  return JSON.parse(base64UrlToBuffer(value).toString("utf8")) as T;
}

async function getGoogleCertificate(kid: string) {
  const response = await fetch(GOOGLE_CERTS_URL, { next: { revalidate: 60 * 60 } });

  if (!response.ok) {
    throw new Error("Could not verify admin session right now.");
  }

  const certs = (await response.json()) as Record<string, string>;
  const cert = certs[kid];

  if (!cert) {
    throw new Error("Admin session could not be verified. Try signing out and back in.");
  }

  return cert;
}

async function verifyFirebaseIdToken(idToken: string) {
  const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!firebaseProjectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid admin session.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtPart<JwtHeader>(encodedHeader);
  const payload = parseJwtPart<FirebaseTokenPayload>(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid admin session.");
  }

  const cert = await getGoogleCertificate(header.kid);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const isValidSignature = verifier.verify(createPublicKey(cert), base64UrlToBuffer(encodedSignature));

  if (!isValidSignature) {
    throw new Error("Invalid admin session.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${firebaseProjectId}`;

  if (payload.aud !== firebaseProjectId || payload.iss !== expectedIssuer) {
    throw new Error("Invalid admin session.");
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid admin session.");
  }

  if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) {
    throw new Error("Admin session expired. Sign in again.");
  }

  if (typeof payload.iat !== "number" || payload.iat > nowSeconds + 60) {
    throw new Error("Invalid admin session.");
  }

  return payload;
}

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function joinStorageUrl(...parts: string[]) {
  return parts
    .map((part, index) => {
      const trimmed = index === 0 ? part.replace(/\/+$/g, "") : part.replace(/^\/+|\/+$/g, "");
      return trimmed;
    })
    .filter(Boolean)
    .join("/");
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cbi.com";
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "captain-images";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase Storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel." },
        { status: 500 },
      );
    }

    const authorization = request.headers.get("authorization") ?? "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

    if (!idToken) {
      return NextResponse.json({ error: "Missing admin session. Sign in again." }, { status: 401 });
    }

    const payload = await verifyFirebaseIdToken(idToken);

    if (payload.email !== adminEmail) {
      return NextResponse.json({ error: "This account is not allowed to upload captain photos." }, { status: 403 });
    }

    const formData = await request.formData();
    const team = formData.get("team");
    const file = formData.get("file");

    if (typeof team !== "string" || !TEAM_IDS.has(team)) {
      return NextResponse.json({ error: "Invalid captain slot." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Upload an image file, such as JPG, PNG, or WebP." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image is too large. Use an image under 8 MB." }, { status: 400 });
    }

    const extension = getExtensionFromMimeType(file.type);
    const imagePath = `captains/${LEAGUE_ID}/${team}/captain-${Date.now()}.${extension}`;
    const encodedPath = encodeStoragePath(imagePath);
    const uploadUrl = joinStorageUrl(supabaseUrl, "storage/v1/object", bucket, encodedPath);
    const arrayBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "3600",
      },
      body: Buffer.from(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return NextResponse.json(
        { error: `Supabase upload failed: ${errorText || uploadResponse.statusText}` },
        { status: 502 },
      );
    }

    const publicUrl = joinStorageUrl(supabaseUrl, "storage/v1/object/public", bucket, encodedPath);

    return NextResponse.json({
      imageUrl: publicUrl,
      imagePath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Captain photo upload failed." },
      { status: 500 },
    );
  }
}
