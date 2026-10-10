import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrossRule } from "@/components/CopticCross";
import { getCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { directionsUrl, formatDay, formatTime } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const church = await db().getChurchBySlug((await params).slug);
  return { title: church?.name ?? "Church" };
}

export default async function ChurchPage({ params }: Params) {
  const church = await db().getChurchBySlug((await params).slug);
  if (!church) notFound();

  const from = new Date();
  const to = new Date(from.getTime() + 60 * 86_400_000);
  const events = (await db().listEvents({ from, to })).filter((e) => e.church_id === church.id);

  return (
    <main className="container">
      <p className="small-caps">
        <Link href="/churches">Churches</Link>
      </p>
      <h1>{church.name}</h1>
      <p className="muted">{church.address}</p>
      {church.liturgy_times && <p className="muted">{church.liturgy_times}</p>}
      <div className="links">
        {church.website && (
          <a href={church.website} target="_blank" rel="noreferrer">
            Website
          </a>
        )}
        <a href={directionsUrl(church.address)} target="_blank" rel="noreferrer">
          Directions
        </a>
        <Link href={`/?church=${church.slug}`}>Open in calendar</Link>
      </div>

      <CrossRule />

      <h2>Coming up</h2>
      {events.length ? (
        <ul className="upcoming">
          {events.map((e) => (
            <li key={e.id}>
              <div className="small-caps">
                {formatDay(e.start)}
                {!e.all_day && <div>{formatTime(e.start)}</div>}
              </div>
              <div>
                <strong>{e.title}</strong>
                {e.location && <div className="muted">{e.location}</div>}
                <div>
                  {e.categories.map((c) => (
                    <span key={c} className="tag">
                      {getCategory(c)?.label ?? c}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Nothing listed for the next two months. Know of something? <Link href="/submit">Submit an event</Link>.
        </p>
      )}
    </main>
  );
}
