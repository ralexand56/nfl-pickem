import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import { getViewerId } from "@/lib/group";
import StartForm from "./start-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start your group",
  robots: { index: false, follow: false },
};

export default async function StartPage() {
  if (!(await getViewerId())) redirect("/signin?callbackUrl=/start");

  return (
    <main className="max-w-md mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-text mb-1">Start your NFL pick&apos;em group</h1>
        <p className="text-text-muted mb-6">
          You&apos;ll be the admin. After checkout you&apos;ll get an invite link to
          share with your family and friends. They play free.
        </p>
        <StartForm />
      </Card>
    </main>
  );
}
