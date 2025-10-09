import { z } from "zod";

export const ContactFormSchema = z.object({
  name: z.string({
    required_error: "Name is required"
  }).min(1),
  email: z.string({
    required_error: "Email is required"
  }).email(),
  message: z.string({
    required_error: "Message is required"
  }).min(1),
});

export const ProposalFormSchema = z.object({
  name: z.string({
    required_error: "Name is required"
  }).min(1),
  email: z.string({
    required_error: "Email is required"
  }).email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  serviceCategory: z.string({
    required_error: "Service category is required"
  }).min(1),
  projectTitle: z.string({
    required_error: "Project title is required"
  }).min(1),
  projectDescription: z.string({
    required_error: "Project description is required"
  }).min(10),
  budget: z.string({
    required_error: "Budget range is required"
  }).min(1),
  timeline: z.string({
    required_error: "Timeline is required"
  }).min(1),
  technicalRequirements: z.string().optional(),
  additionalInfo: z.string().optional(),
});