import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata: Metadata = {
  title: "Snip.ly — URL Shortener",
  description:
    "A production-grade URL shortener powered by polyglot microservices. Shorten, redirect, and track links with real-time analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen relative flex flex-col">
        <BackgroundOrbs />
        <Navbar />
        <main className="relative z-10 pt-20 flex-1">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(21, 23, 61, 0.92)",
              color: "#F1E9E9",
              border: "1px solid rgba(152, 37, 152, 0.25)",
              backdropFilter: "blur(16px)",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            },
            success: {
              iconTheme: { primary: "#4ade80", secondary: "#15173d" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#15173d" },
            },
          }}
        />
      </body>
    </html>
  );
}
