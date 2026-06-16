import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StableBonds — Smart Business Payments",
  description: "Schedule vendor payments, earn interest while you wait, and guarantee on-time delivery. Your business cash works harder, automatically.",
  keywords: ["business payments", "vendor payments", "earn interest", "scheduled payments", "automated payroll"],
  openGraph: {
    title: "StableBonds — Smart Business Payments",
    description: "Hold your business cash securely, earn 5% interest, and automate vendor payouts. Zero manual work required.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#18181b" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        
        {/* Favicon Suite - Swiss Institutional Quality */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-128x128.png" />
        
        {/* Apple Touch Icon for iOS Devices */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Safari Pinned Tab Icon */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#18181b" />
        
        {/* Android PWA Web Manifest & Color config */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#18181b" />
        <meta name="apple-mobile-web-app-title" content="StableBonds" />
        <meta name="application-name" content="StableBonds" />
      </head>
      <body>
        <Toaster 
          position="bottom-right" 
          richColors 
          theme="light"
          toastOptions={{
            style: {
              fontFamily: "'Inter', system-ui, sans-serif",
              borderRadius: '8px',
              border: '1px solid #e4e4e7',
              fontSize: '13px',
            },
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
