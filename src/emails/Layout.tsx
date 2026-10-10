import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

// Email clients ignore CSS variables and web fonts, so the palette is inlined here.
export const C = {
  parchment: "#f6f1e7",
  vellum: "#fbf8f2",
  ink: "#2b2420",
  soft: "#6b5f55",
  rule: "#ddd2bf",
  oxblood: "#6e1e1e",
  gold: "#a88b4a",
};
export const serif = "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif";
export const sans = "'Source Sans 3', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export function EmailLayout({ preview, siteUrl, children, footer }: { preview: string; siteUrl: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: C.parchment, margin: 0, padding: "24px 0", fontFamily: sans, color: C.ink }}>
        <Container style={{ maxWidth: 580, backgroundColor: C.vellum, border: `1px solid ${C.rule}`, padding: "28px 32px" }}>
          <Section style={{ textAlign: "center" }}>
            <Img src={`${siteUrl}/cross.png`} width="36" height="36" alt="" style={{ margin: "0 auto" }} />
            <Text style={{ fontFamily: serif, fontSize: 22, margin: "8px 0 0", color: C.ink }}>DFW Coptic Calendar</Text>
          </Section>
          <Hr style={{ borderColor: C.gold, opacity: 0.6, margin: "18px 0 22px" }} />
          {children}
          <Hr style={{ borderColor: C.rule, margin: "28px 0 14px" }} />
          <Text style={{ fontSize: 12, color: C.soft, textAlign: "center", margin: 0 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
