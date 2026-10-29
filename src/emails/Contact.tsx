import { Body, Button, Column, Container, Head, Hr, Html, Link, Preview, Row, Section, Tailwind, Text } from "react-email";
import * as React from "react";

interface ContactEmailProps {
  name: string;
  email: string;
  message: string;
  topic?: string;
  /** When the form was sent; shown in Pacific time. */
  sentAt?: Date;
}

// The site's light theme and cube colors, written out since email clients
// don't support CSS variables.
const COLORS = {
  page: "#E6F0F1",
  text: "#0B2545",
  muted: "#4A5E6B",
  border: "#C8DCDF",
  blue: "#0051BA",
};
const STRIPE = [
  { color: "#0051BA", width: "36%" },
  { color: "#C41E3A", width: "9%" },
  { color: "#FFD500", width: "9%" },
  { color: "#009E60", width: "37%" },
  { color: "#FF5800", width: "9%" },
];
// Each contact topic in its cube color: text and a light background.
const TOPIC_COLORS: Record<string, { text: string; background: string }> = {
  Competitions: { text: "#00744A", background: "#DCF2E8" },
  Cubing: { text: "#0051BA", background: "#DDE8F8" },
  Software: { text: "#B84300", background: "#FBE6DA" },
  "Just saying hi": { text: "#8A6100", background: "#FBF0CC" },
};

const sentFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Los_Angeles",
});

/** The email the contact form sends to Ben: who wrote, about what, their message, and a reply button. */
export default function ContactEmailTemplate({ name, email, message, topic, sentAt }: ContactEmailProps) {
  const topicColors = topic ? TOPIC_COLORS[topic] : undefined;
  const firstName = name.trim().split(/\s+/)[0] || name;
  const replyHref = `mailto:${email}?subject=${encodeURIComponent(topic ? `Re: ${topic}` : "Re: your message")}`;

  return (
    <Html>
      <Head />
      <Preview>{`${topic ? `${topic} · ` : ""}${name}: ${message.slice(0, 120)}`}</Preview>
      <Tailwind>
        <Body className="m-0 font-sans" style={{ backgroundColor: COLORS.page, color: COLORS.text }}>
          <Container className="mx-auto max-w-[560px] px-4 py-8">
            <Section className="overflow-hidden rounded-xl bg-white" style={{ border: `1px solid ${COLORS.border}` }}>
              {/* The site's cube-sticker stripe, as table cells so every client draws it. */}
              <Row>
                {STRIPE.map((sticker) => (
                  <Column key={sticker.color} style={{ backgroundColor: sticker.color, width: sticker.width, height: "6px", lineHeight: "6px", fontSize: "1px" }}>
                    &nbsp;
                  </Column>
                ))}
              </Row>

              <Section className="px-8 pt-7 pb-2">
                <Text className="m-0 text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.muted }}>
                  bengottschalk.com · Contact form
                </Text>
                <Text className="mt-2 mb-0 text-2xl font-bold" style={{ color: COLORS.text }}>
                  New message from {name}
                </Text>
                {topic && topicColors && (
                  <Text className="mt-3 mb-0">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ color: topicColors.text, backgroundColor: topicColors.background, display: "inline-block" }}
                    >
                      {topic}
                    </span>
                  </Text>
                )}
              </Section>

              <Section className="px-8">
                <Text className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                  From
                </Text>
                <Text className="m-0 text-base">
                  <strong>{name}</strong>
                  {" · "}
                  <Link href={`mailto:${email}`} style={{ color: COLORS.blue }}>{email}</Link>
                </Text>

                <Text className="mt-6 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                  Message
                </Text>
                <Section className="rounded-lg" style={{ backgroundColor: "#F3F8F8", borderLeft: `4px solid ${COLORS.blue}` }}>
                  {/* Each line as its own break, since not every client keeps newlines. */}
                  <Text className="m-0 px-5 py-4 text-base leading-relaxed">
                    {message.split(/\r?\n/).map((line, i, lines) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </Text>
                </Section>

                <Section className="mt-7 mb-8">
                  <Button
                    href={replyHref}
                    className="rounded-lg px-5 py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: COLORS.blue }}
                  >
                    Reply to {firstName}
                  </Button>
                </Section>
              </Section>

              <Hr className="m-0" style={{ borderColor: COLORS.border }} />
              <Section className="px-8 py-4">
                <Text className="m-0 text-xs" style={{ color: COLORS.muted }}>
                  Sent from the contact form at bengottschalk.com{sentAt ? ` on ${sentFormat.format(sentAt)} (Pacific)` : ""}.
                  Replying to this email goes to {email}.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Sample data for the `npm run email` preview.
ContactEmailTemplate.PreviewProps = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  topic: "Competitions",
  message: "Hi Ben!\n\nI'm thinking about organizing a competition in Eugene next spring. Could we talk about what a Delegate needs from organizers?\n\nThanks,\nAda",
  sentAt: new Date("2026-10-29T18:30:00Z"),
} satisfies ContactEmailProps;
