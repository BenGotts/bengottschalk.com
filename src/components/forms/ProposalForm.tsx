'use client'

import { submitProposal } from "@/actions/proposal";
import { ProposalFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

const serviceOptions: SelectOption[] = [
  { value: '', label: 'Select a service category' },
  { value: 'Web & Application Development', label: 'Web & Application Development' },
  { value: 'Custom Software & Automation', label: 'Custom Software & Automation' },
  { value: 'Cloud & DevOps', label: 'Cloud & DevOps' },
  { value: 'Other', label: 'Other' },
];

const budgetRanges: SelectOption[] = [
  { value: '', label: 'Select budget range' },
  { value: 'Under $2,000', label: 'Under $2,000' },
  { value: '$2,000 - $5,000', label: '$2,000 - $5,000' },
  { value: '$5,000 - $10,000', label: '$5,000 - $10,000' },
  { value: '$10,000 - $25,000', label: '$10,000 - $25,000' },
  { value: '$25,000 - $50,000', label: '$25,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
  { value: 'Not sure yet', label: 'Not sure yet' },
];

const timelineOptions: SelectOption[] = [
  { value: '', label: 'Select timeline' },
  { value: 'ASAP (1-2 weeks)', label: 'ASAP (1-2 weeks)' },
  { value: '1 month', label: '1 month' },
  { value: '2-3 months', label: '2-3 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6+ months', label: '6+ months' },
  { value: 'Flexible', label: 'Flexible' },
];

export default function ProposalForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");

    const proposalData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: (formData.get('company') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      serviceCategory: formData.get('serviceCategory') as string,
      projectTitle: formData.get('projectTitle') as string,
      projectDescription: formData.get('projectDescription') as string,
      budget: formData.get('budget') as string,
      timeline: formData.get('timeline') as string,
      technicalRequirements: (formData.get('technicalRequirements') as string) || undefined,
      additionalInfo: (formData.get('additionalInfo') as string) || undefined,
    }

    const result = ProposalFormSchema.safeParse(proposalData);
    if (!result.success) {
      console.log(result.error.issues);
      setError("Please check your inputs and try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await submitProposal(result.data);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError("An error occurred while submitting your proposal. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="py-8 px-6 bg-white rounded-lg shadow-lg">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <svg className="w-20 h-20 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-600 mb-4">Proposal Submitted Successfully!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your detailed proposal. I'll review your project requirements and get back to you within 24-48 hours with next steps.
          </p>
          <p className="text-base text-gray-600 mb-8">
            In the meantime, feel free to reach out directly at <a href="mailto:ben@bengottschalk.com" className="text-blue-600 hover:underline">ben@bengottschalk.com</a> if you have any questions.
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            size="lg"
          >
            Submit Another Proposal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 bg-white rounded-lg shadow-lg">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-blue-600 mb-4">Submit a Project Proposal</h2>
          <p className="text-lg text-gray-600">
            Fill out this form with as much detail as possible so I can provide you with an accurate quote and timeline.
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <form action={clientAction} className="space-y-6">
          {/* Contact Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization (Optional)
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Project Details Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="serviceCategory"
                  name="serviceCategory"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectTitle"
                  name="projectTitle"
                  type="text"
                  required
                  placeholder="e.g., E-commerce Website for Local Bakery"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  rows={6}
                  required
                  placeholder="Describe your project in detail. What problem are you trying to solve? What are your goals? What features do you need?"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    required
                    className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {budgetRanges.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Timeline <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    required
                    className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {timelineOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="technicalRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Requirements (Optional)
                </label>
                <textarea
                  id="technicalRequirements"
                  name="technicalRequirements"
                  rows={4}
                  placeholder="Any specific technologies, integrations, or technical constraints? (e.g., must integrate with Shopify, needs to support 10,000+ users, requires AWS deployment)"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Anything Else I Should Know? (Optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={4}
                  placeholder="Any other details, concerns, or questions you'd like to share?"
                  className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? 'Submitting Proposal...' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


