import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * Elite Quests API — Pro-only landmark discovery endpoint.
 *
 * Returns landmarks tagged with isElite:true from the `landmarks` collection.
 * Access is gated by the `tier:"pro"` Firebase Custom Claim.
 *
 * The middleware (middleware.ts) pre-checks that an Authorization header is
 * present; this handler performs the full token + claim verification.
 */
export async function GET(req: NextRequest) {
  // ── Auth + Pro check ──────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const idToken    = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    // Check the `tier` custom claim set by activateProSubscription()
    if (decoded.tier !== "pro") {
      return NextResponse.json(
        { error: "Accesso riservato agli utenti Pro." },
        { status: 403 }
      );
    }
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token non valido." }, { status: 401 });
  }

  // ── Fetch elite landmarks ─────────────────────────────────────
  const snap = await adminDb()
    .collection("landmarks")
    .where("isElite", "==", true)
    .limit(20)
    .get();

  const landmarks = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ landmarks, uid });
}
