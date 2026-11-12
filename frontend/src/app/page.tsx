import { redirect } from "next/navigation";

/** Visitors land directly on the events list; no login is needed to browse. */
export default function Home() {
  redirect("/events");
}
