"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

/**
 * Client wrapper for PayPalScriptProvider.
 *
 * Place at the root layout level so PayPal's JS SDK is loaded once for the
 * whole app.  Uses vault=true + intent=subscription for recurring billing.
 * Falls back to "sb" (sandbox) if the env var is missing.
 */
export function PayPalProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "sb";

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        vault: true,
        intent: "subscription",
        currency: "EUR",
        locale: "it_IT",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
