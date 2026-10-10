import { Link, Section, Text } from "@react-email/components";
import { C, EmailLayout, serif } from "./Layout";

export type DigestDay = {
  label: string; // "Sunday, October 12"
  coptic: string; // "2 Paopi 1743 A.M."
  fast: string | null;
  events: { title: string; time: string; church: string; location: string | null; url: string; categories: string[] }[];
};

type Props = { siteUrl: string; weekLabel: string; days: DigestDay[]; preferencesUrl: string; calendarUrl: string };

export default function DigestEmail({ siteUrl, weekLabel, days, preferencesUrl, calendarUrl }: Props) {
  const count = days.reduce((n, d) => n + d.events.length, 0);
  return (
    <EmailLayout
      siteUrl={siteUrl}
      preview={`${count} event${count === 1 ? "" : "s"} this week across DFW Coptic churches`}
      footer={
        <>
          You chose these categories. <Link href={preferencesUrl} style={{ color: C.oxblood }}>Change preferences or unsubscribe</Link>.
        </>
      }
    >
      <Text style={{ fontFamily: serif, fontSize: 19, margin: "0 0 4px" }}>The week ahead</Text>
      <Text style={{ color: C.soft, margin: "0 0 20px", fontSize: 14 }}>{weekLabel}</Text>

      {days.map((day) => (
        <Section key={day.label} style={{ marginBottom: 18 }}>
          <Text style={{ fontFamily: serif, fontSize: 17, margin: "0", borderBottom: `1px solid ${C.rule}`, paddingBottom: 4 }}>
            {day.label}
            <span style={{ color: C.soft, fontSize: 13 }}>
              {"  ·  "}
              {day.coptic}
              {day.fast ? `  ·  ${day.fast}` : ""}
            </span>
          </Text>
          {day.events.map((e, i) => (
            <Section key={i} style={{ padding: "8px 0 0 10px", borderLeft: `2px solid ${C.oxblood}`, marginTop: 8 }}>
              <Text style={{ margin: 0, fontSize: 15 }}>
                <Link href={e.url} style={{ color: C.ink, textDecoration: "none", fontWeight: 600 }}>
                  {e.title}
                </Link>
              </Text>
              <Text style={{ margin: "2px 0 0", fontSize: 13, color: C.soft }}>
                {e.time} · {e.church}
                {e.location ? ` · ${e.location}` : ""}
              </Text>
              <Text style={{ margin: "2px 0 0", fontSize: 12, color: C.gold }}>{e.categories.join(" · ")}</Text>
            </Section>
          ))}
        </Section>
      ))}

      <Text style={{ textAlign: "center", marginTop: 24 }}>
        <Link href={calendarUrl} style={{ color: C.oxblood }}>
          Open the full calendar
        </Link>
      </Text>
    </EmailLayout>
  );
}

DigestEmail.PreviewProps = {
  siteUrl: "http://localhost:3000",
  weekLabel: "October 12 – 18",
  preferencesUrl: "#",
  calendarUrl: "#",
  days: [
    {
      label: "Friday, October 17",
      coptic: "7 Paopi 1743 A.M.",
      fast: "Friday fast",
      events: [{ title: "Young Adults Meeting", time: "7:30 PM", church: "St. Mark", location: null, url: "#", categories: ["Young Adults"] }],
    },
  ],
} satisfies Props;
