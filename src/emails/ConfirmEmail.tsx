import { Button, Text } from "@react-email/components";
import { C, EmailLayout, serif } from "./Layout";

type Props = { siteUrl: string; confirmUrl: string; categories: string[]; alreadySubscribed?: boolean };

export default function ConfirmEmail({ siteUrl, confirmUrl, categories, alreadySubscribed }: Props) {
  if (alreadySubscribed) {
    return (
      <EmailLayout siteUrl={siteUrl} preview="Manage your weekly DFW Coptic events email" footer="If you didn't ask for this, you can ignore this email.">
        <Text style={{ fontFamily: serif, fontSize: 19, margin: "0 0 12px" }}>You&rsquo;re already subscribed</Text>
        <Text style={{ fontSize: 15, lineHeight: "22px" }}>
          You currently receive: <strong>{categories.join(", ")}</strong>. Use the link below to change that.
        </Text>
        <Button href={confirmUrl} style={{ backgroundColor: C.oxblood, color: C.parchment, padding: "10px 20px", borderRadius: 4, fontSize: 15, marginTop: 8 }}>
          Manage preferences
        </Button>
      </EmailLayout>
    );
  }
  return (
    <EmailLayout siteUrl={siteUrl} preview="Confirm your weekly DFW Coptic events email" footer="If you didn't ask for this, you can ignore this email.">
      <Text style={{ fontFamily: serif, fontSize: 19, margin: "0 0 12px" }}>Confirm your weekly email</Text>
      <Text style={{ fontSize: 15, lineHeight: "22px" }}>
        Each Monday morning you&rsquo;ll receive the week&rsquo;s events for: <strong>{categories.join(", ")}</strong>.
      </Text>
      <Button
        href={confirmUrl}
        style={{ backgroundColor: C.oxblood, color: C.parchment, padding: "10px 20px", borderRadius: 4, fontSize: 15, marginTop: 8 }}
      >
        Confirm subscription
      </Button>
    </EmailLayout>
  );
}
