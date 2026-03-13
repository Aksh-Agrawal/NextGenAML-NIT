import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextGenAML — Graph Neural Network AML Intelligence | Union Bank of India",
  description:
    "Next-generation Anti-Money Laundering system powered by Graph Neural Networks. 93% precision, 12ms inference, detecting 5 AML typologies in real-time. Union Bank of India · Hackathon 2026.",
  keywords:
    "AML, Anti-Money Laundering, GNN, Graph Neural Network, LineMVGNN, Memgraph, Financial Crime Detection, Union Bank of India",
  openGraph: {
    title: "NextGenAML — GNN-Based AML Intelligence",
    description:
      "Graph Neural Networks that trace every rupee through the financial system. 93% precision · 12ms inference · FIU-IND compliant.",
    type: "website",
    images: [
      {
        url: "/og-nextgenaml.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextGenAML — GNN-Based AML Intelligence",
    description:
      "Graph Neural Networks detecting money laundering in real-time.",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={{ scrollBehavior: "smooth" }}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{
          background: "#06070B",
          color: "#EDF0F7",
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