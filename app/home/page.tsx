import { redirect } from "next/navigation";

// Redirect /home → /
export default function HomeRedirect() {
  redirect("/");
}
