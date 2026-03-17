import { redirect } from "next/navigation";

/**
 * Root page: redirect logged-in users to /scan (the primary experience),
 * and new users to /onboarding.
 * For SSR we redirect to /scan; the client-side onboarding check is in the
 * scan page itself.
 */
export default function RootPage() {
  redirect("/scan");
}
