import { Body, Container, Head, Hr, Html, Section, Tailwind, Text } from "@react-email/components";
import * as React from "react";

interface ContactEmailTemplateProps {
  name: string;
  message: string;
}

export default function ContactEmailTemplate({ name, message }: ContactEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-blue-50 font-sans">
          <Container className="mx-auto px-6 py-8">
            <Section className="bg-white border border-blue-200 rounded-lg shadow-md p-6">
              <Text className="text-3xl font-bold text-center mb-8 text-blue-700">
                New Contact Form Submission
              </Text>
              <Hr className="border-blue-200 my-6" />
              <Text className="text-base mb-4 text-blue-800">
                <strong>Name:</strong> {name}
              </Text>
              <Text className="text-base mb-2 text-blue-800">
                <strong>Message:</strong>
              </Text>
              <Text className="bg-blue-100 p-4 rounded-lg text-base text-blue-900">
                {message}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
