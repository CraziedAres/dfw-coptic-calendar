import type { Metadata } from "next";
import Link from "next/link";
import { ChurchMapLazy } from "@/components/ChurchMapLazy";
import { db } from "@/lib/db";
import { directionsUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Churches" };
export const revalidate = 3600;

export default async function ChurchesPage() {
  const churches = await db().listChurches();
  return (
    <main className="container">
      <h1>Churches</h1>
      <p className="lede">The Coptic Orthodox parishes of the Dallas–Fort Worth area.</p>
      <div className="church-layout">
        <div className="map-box">
          <ChurchMapLazy churches={churches.map(({ slug, name, city, lat, lng }) => ({ slug, name, city, lat, lng }))} />
        </div>
        <ul className="church-list">
          {churches.map((c) => (
            <li key={c.slug}>
              <h3>
                <Link href={`/churches/${c.slug}`}>{c.name}</Link>
              </h3>
              <div className="muted">{c.address}</div>
              {c.liturgy_times && <div className="muted">{c.liturgy_times}</div>}
              <div className="links">
                <Link href={`/?church=${c.slug}`}>Calendar</Link>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
                <a href={directionsUrl(c.address)} target="_blank" rel="noreferrer">
                  Directions
                </a>
              </div>
            </li>
          ))}
          {!churches.length && <li className="muted">No churches loaded yet. Run <code>npm run seed</code>.</li>}
        </ul>
      </div>
    </main>
  );
}
