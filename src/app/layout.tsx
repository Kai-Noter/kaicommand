import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme-context";
import { Providers } from "@/components/providers";
import { CommandMenu } from "@/components/CommandMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaiCommand - AI Command Center",
  description: "Your personal AI Command Center for managing apps, emails, tasks, finances, and brain wellness with the Play Centre.",
  keywords: ["KaiCommand", "AI Command Center", "Brain Games", "Mental Health", "Productivity", "App Manager", "Email Hub", "Finance"],
  authors: [{ name: "KaiCommand Team" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "KaiCommand - AI Command Center",
    description: "Your personal AI Command Center for productivity, management, and brain wellness",
    url: "https://kaicommand.com",
    siteName: "KaiCommand",
    type: "website",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "KaiCommand - AI Command Center",
    description: "Your personal AI Command Center for productivity and brain wellness",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <Providers>
            {children}
            <CommandMenu />
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
