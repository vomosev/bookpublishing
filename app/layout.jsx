import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import Footer from "../components/Footer";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://bookpublishing.geo-drops.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bookpublishing | Independent Publishing for Authors",
    template: "%s | Bookpublishing",
  },
  description:
    "Professional editorial, design, publishing, and distribution services created for independent writers and authors.",
  applicationName: "Bookpublishing",
  keywords: [
    "independent publishing",
    "book publishing",
    "author services",
    "manuscript submission",
    "professional editing",
    "book distribution",
  ],
  authors: [{ name: "Bookpublishing", url: siteUrl }],
  creator: "Bookpublishing",
  publisher: "Bookpublishing",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Bookpublishing",
    title: "Bookpublishing | Independent Publishing for Authors",
    description:
      "Bring your manuscript to readers with collaborative, transparent publishing services for independent authors.",
  },
  twitter: {
    card: "summary",
    title: "Bookpublishing | Independent Publishing for Authors",
    description:
      "Professional publishing support for independent writers, from editorial review to worldwide release.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>
          <div className="site-shell">
            <Header />
            <main id="main-content" className="site-main">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}