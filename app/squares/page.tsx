import { redirect } from "next/navigation";

export default function SquaresPage() {
  // Redirect to the default game
  redirect("/squares/default");
}
