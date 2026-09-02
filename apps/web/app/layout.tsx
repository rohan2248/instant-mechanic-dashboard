import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster, ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Live vehicle service operations — bookings, revenue, and mechanic availability.";

export const metadata: Metadata = {
  // Relative OG/Twitter image paths need an absolute base to resolve against.
  // Falls back to localhost so `next build` doesn't warn on a dev machine.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Instant Mechanic · Live Dashboard",
    // Route segments set only their own name; the suffix is applied here.
    template: "%s · Instant Mechanic",
  },
  description: DESCRIPTION,
  applicationName: "Instant Mechanic",
  openGraph: {
    title: "Instant Mechanic · Live Dashboard",
    description: DESCRIPTION,
    siteName: "Instant Mechanic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instant Mechanic · Live Dashboard",
    description: DESCRIPTION,
  },
  // An internal operations console has nothing to gain from being indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Two entries so the browser chrome tracks the theme instead of staying
  // light while the app is dark.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c20" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes writes the theme class onto <html> before paint, which the
    // server render cannot know about — suppressHydrationWarning scopes the
    // expected mismatch to this one element.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* First focusable element on the page: a keyboard user can jump the
            sidebar and header rather than tabbing through every nav item to
            reach the table. Visually hidden until focused. */}
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-index-overlay)"
        >
          Skip to content
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ToastProvider>
        </ThemeProvider>

        {/* Sits above everything and receives no pointer events — purely the
            surface texture. See the `grain` utility in globals.css. */}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
