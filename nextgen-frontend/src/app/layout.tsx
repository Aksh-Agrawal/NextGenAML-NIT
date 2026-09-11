import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-jetbrains",
  display: "swap",
});

const plusJakartaSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-heading",
  display: "swap",
});

const robotoMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextGenAML — AI-Powered Anti-Money Laundering",
  description:
    "Graph Neural Network based AML Detection System for X-Bank of India. Real-time transaction monitoring, fund flow analysis, and automated SAR reporting.",
  keywords:
    "AML, Anti-Money Laundering, GNN, Graph Neural Network, Financial Crime, X-Bank",
  openGraph: {
    title: "NextGenAML — AI-Powered AML Detection",
    description:
      "Graph Neural Network based Anti-Money Laundering system for X-Bank of India",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} ${robotoMono.variable}`}
      style={{ scrollBehavior: "smooth" }}
    >
      <body
        style={{
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          overflowX: "hidden",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
