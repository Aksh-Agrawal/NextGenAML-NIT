import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

const inter = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-jetbrains",
  display: "swap",
});

const plusJakartaSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-heading",
  display: "swap",
});

const robotoMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextGenAML — Graph Neural Network AML Intelligence | X-Bank of India",
  description:
    "Next-generation Anti-Money Laundering system powered by Graph Neural Networks. 93% precision, 12ms inference, detecting 5 AML typologies in real-time. .",
  keywords:
    "AML, Anti-Money Laundering, GNN, Graph Neural Network, LineMVGNN, Memgraph, Financial Crime Detection, X-Bank of India",
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} ${robotoMono.variable}`}
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
