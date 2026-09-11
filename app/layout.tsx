import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Interview Agent — ABTalks",
  description:
    "Enterprise-grade AI Interview Agent that simulates a real technical interviewer for the ABTalks AI Cohort. Adaptive questions, real-time evaluation, and structured feedback.",
  keywords: ["AI Interview", "Technical Interview", "ABTalks", "AI Cohort", "Machine Learning"],
  openGraph: {
    title: "AI Interview Agent — ABTalks",
    description: "Simulate a real technical interview powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
