import { Suspense } from "react";
import Link from "next/link";
import { CalendarBoard } from "@/components/CalendarBoard";
import { calendarWindow } from "@/lib/queries";
import { emailEnabled, shortChurchName } from "@/lib/site";

export const revalidate = 300;

export default async function Home() {
  const { churches, events } = await calendarWindow();
  return (
    <main className="container">
      <h1>Calendar</h1>
      <p className="lede">
        Gatherings across the Coptic Orthodox churches of Dallas–Fort Worth. Choose the kinds of events you care about
        {emailEnabled() ? (
          <>
            , or <Link href="/subscribe">receive them in a weekly email</Link>.
          </>
        ) : (
          "."
        )}
      </p>
      <Suspense>
        <CalendarBoard events={events} churches={churches.map((c) => ({ slug: c.slug, name: shortChurchName(c.name) }))} />
      </Suspense>
    </main>
  );
}
