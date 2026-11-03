import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Judo Club Constantine",
  description: "Événements, directs et administration du Judo Club Constantine.",
  openGraph: {
    title: "Judo Club Constantine",
    description: "Suivez les événements et les directs des trois tapis.",
    siteName: "Judo Club Constantine",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
