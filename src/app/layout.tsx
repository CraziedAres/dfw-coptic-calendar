import type { Metadata } from "next";
import { EB_Garamond, Source_Sans_3, Noto_Sans_Coptic } from "next/font/google";
import Link from "next/link";
import { CopticCross } from "@/components/CopticCross";
import { formatCoptic, fastFor, isSeasonalFast } from "@/lib/coptic-date";
import { emailEnabled, SITE_NAME, TIME_ZONE } from "@/lib/site";
import "./globals.css";

const display = EB_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500"] });
const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"] });
const coptic = Noto_Sans_Coptic({ variable: "--font-coptic", subsets: ["coptic"], weight: "400" });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "Events across the Coptic Orthodox churches of Dallas–Fort Worth: youth, couples, liturgical and service.",
};

// Header shows today's date, so re-render at least hourly.
export const revalidate = 3600;

function todayInDallas(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE }).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const today = todayInDallas();
  const fast = fastFor(today);
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${coptic.variable}`}>
        <header className="site-header">
          <div className="container bar">
            <Link href="/" className="brand">
              <CopticCross size={30} />
              <span className="brand-name">{SITE_NAME}</span>
            </Link>
            <nav className="site-nav" aria-label="Main">
              <Link href="/">Calendar</Link>
              <Link href="/churches">Churches</Link>
              {emailEnabled() && <Link href="/subscribe">Weekly email</Link>}
              <Link href="/submit">Submit an event</Link>
            </nav>
          </div>
          <div className="container header-date small-caps">
            <span>
              {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {formatCoptic(today)}
            </span>
            {isSeasonalFast(fast) && <span className="fast">{fast}</span>}
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container">
            <span className="coptic" lang="cop">Ⲕⲩⲣⲓⲉ ⲉⲗⲉⲏⲥⲟⲛ</span>
            Lord, have mercy. Events are gathered from each church&rsquo;s public pages and from servants. Please confirm details with the church.
          </div>
        </footer>
      </body>
    </html>
  );
}
