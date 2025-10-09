import { Body, Container, Head, Hr, Html, Section, Tailwind, Text } from "@react-email/components";
import * as React from "react";

interface ProposalEmailTemplateProps {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  serviceCategory: string;
  projectTitle: string;
  projectDescription: string;
  budget: string;
  timeline: string;
  technicalRequirements?: string;
  additionalInfo?: string;
}

export default function ProposalEmailTemplate(props: ProposalEmailTemplateProps) {
  const {
    name,
    email,
    company,
    phone,
    serviceCategory,
    projectTitle,
    projectDescription,
    budget,
    timeline,
    technicalRequirements,
    additionalInfo
  } = props;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-blue-50 font-sans">
          <Container className="mx-auto px-6 py-8">
            <Section className="bg-white border border-blue-200 rounded-lg shadow-md p-6">
              <Text className="text-3xl font-bold text-center mb-8 text-blue-700">
                New Project Proposal
              </Text>
              <Hr className="border-blue-200 my-6" />
              
              {/* Contact Information */}
              <Section className="mb-6">
                <Text className="text-xl font-semibold mb-4 text-blue-700">
                  Contact Information
                </Text>
                <Text className="text-base mb-2 text-blue-800">
                  <strong>Name:</strong> {name}
                </Text>
                <Text className="text-base mb-2 text-blue-800">
                  <strong>Email:</strong> {email}
                </Text>
                {company && (
                  <Text className="text-base mb-2 text-blue-800">
                    <strong>Company:</strong> {company}
                  </Text>
                )}
                {phone && (
                  <Text className="text-base mb-2 text-blue-800">
                    <strong>Phone:</strong> {phone}
                  </Text>
                )}
              </Section>

              <Hr className="border-blue-200 my-6" />

              {/* Project Details */}
              <Section className="mb-6">
                <Text className="text-xl font-semibold mb-4 text-blue-700">
                  Project Details
                </Text>
                <Text className="text-base mb-2 text-blue-800">
                  <strong>Service Category:</strong> {serviceCategory}
                </Text>
                <Text className="text-base mb-2 text-blue-800">
                  <strong>Project Title:</strong> {projectTitle}
                </Text>
                <Text className="text-base mb-2 text-blue-800">
                  <strong>Budget Range:</strong> {budget}
                </Text>
                <Text className="text-base mb-4 text-blue-800">
                  <strong>Timeline:</strong> {timeline}
                </Text>
              </Section>

              <Hr className="border-blue-200 my-6" />

              {/* Project Description */}
              <Section className="mb-6">
                <Text className="text-xl font-semibold mb-2 text-blue-700">
                  Project Description
                </Text>
                <Text className="bg-blue-100 p-4 rounded-lg text-base text-blue-900 whitespace-pre-wrap">
                  {projectDescription}
                </Text>
              </Section>

              {technicalRequirements && (
                <>
                  <Hr className="border-blue-200 my-6" />
                  <Section className="mb-6">
                    <Text className="text-xl font-semibold mb-2 text-blue-700">
                      Technical Requirements
                    </Text>
                    <Text className="bg-blue-100 p-4 rounded-lg text-base text-blue-900 whitespace-pre-wrap">
                      {technicalRequirements}
                    </Text>
                  </Section>
                </>
              )}

              {additionalInfo && (
                <>
                  <Hr className="border-blue-200 my-6" />
                  <Section className="mb-6">
                    <Text className="text-xl font-semibold mb-2 text-blue-700">
                      Additional Information
                    </Text>
                    <Text className="bg-blue-100 p-4 rounded-lg text-base text-blue-900 whitespace-pre-wrap">
                      {additionalInfo}
                    </Text>
                  </Section>
                </>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

