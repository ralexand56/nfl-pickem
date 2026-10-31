import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import { getViewerId } from "@/lib/group";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Stripe sends the buyer here after paying. We confirm the payment with
// Stripe directly (never trusting the URL alone) and create the group if the
// webhook hasn't already.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const viewerId = await getViewerId();
  if (!viewerId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/start/success?session_id=${session_id ?? ""}`)}`);
  }
  if (!session_id) redirect("/");

  const session = await getStripe()
    .checkout.sessions.retrieve(session_id)
    .catch(() => null);

  // Only the person who paid can claim the session.
  const slug =
    session && session.client_reference_id === viewerId
      ? await fulfillCheckout(session)
      : null;

  if (slug) redirect(`/g/${slug}/admin?welcome=1`);

  return (
    <main className="max-w-md mx-auto p-6">
      <Card className="p-6 text-center">
        <h1 className="text-xl font-semibold text-text mb-2">
          {session?.payment_status === "unpaid" ? "Payment processing" : "We couldn't find that payment"}
        </h1>
        <p className="text-text-muted">
          {session?.payment_status === "unpaid"
            ? "Your payment is still being confirmed. Refresh this page in a minute."
            : "If you were charged, email us and we'll sort it out right away."}
        </p>
      </Card>
    </main>
  );
}
