// app/partners/data/schema.ts
import { z } from "zod";

export const Evidence = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const Contact = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const PartnerSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  category: z.string().min(1),
  evidence: z.array(Evidence).default([]),
  contacts: z.array(Contact).default([]),
});

export const PartnerArray = z.array(PartnerSchema);

export type Partner = z.infer<typeof PartnerSchema>;

export function validatePartners(input: unknown) {
  return PartnerArray.parse(input);
}
