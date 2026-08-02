import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const protocol = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "GridLab — Learn to Think Like a Protection Engineer";
  const description = "Predict faults, observe relays, and protect communities through interactive power-system protection missions.";
  return { title, description, icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" }, openGraph: { title, description, images: [{ url: `${origin}/og-missions.png`, width: 1536, height: 1024 }] }, twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-missions.png`] } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
