import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextGenAML — AI-Powered Anti-Money Laundering",
  description:
    "Graph Neural Network based AML Detection System for Union Bank of India. Real-time transaction monitoring, fund flow analysis, and automated SAR reporting.",
  keywords:
    "AML, Anti-Money Laundering, GNN, Graph Neural Network, Financial Crime, Union Bank",
  openGraph: {
    title: "NextGenAML — AI-Powered AML Detection",
    description:
      "Graph Neural Network based Anti-Money Laundering system for Union Bank of India",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
