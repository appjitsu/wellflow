import { z } from 'zod';

/**
 * Address schema for partners
 */
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().optional(),
});

/**
 * Partner-related Zod schemas for validation
 */
export const partnerSchemas = {
  // Create partner schema
  createPartner: z.object({
    partnerName: z.string().min(1, 'Partner name is required').max(255),
    partnerCode: z.string().min(1, 'Partner code is required').max(50),
    taxId: z.string().optional(),
    billingAddress: addressSchema.optional(),
    remitAddress: addressSchema.optional(),
    contactEmail: z.string().min(1).optional(),
    contactPhone: z.string().optional(),
    isActive: z.boolean().default(true),
  }),

  // Update partner schema (all fields optional)
  updatePartner: z.object({
    partnerName: z.string().min(1).max(255).optional(),
    partnerCode: z.string().min(1).max(50).optional(),
    taxId: z.string().optional(),
    billingAddress: addressSchema.optional(),
    remitAddress: addressSchema.optional(),
    contactEmail: z.string().min(1).optional(),
    contactPhone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),

  // Partner response schema
  partnerResponse: z.object({
    id: z.string().uuid(),
    partnerName: z.string(),
    partnerCode: z.string(),
    taxId: z.string().nullable(),
    billingAddress: z
      .object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string().nullable(),
      })
      .nullable(),
    remitAddress: z
      .object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string().nullable(),
      })
      .nullable(),
    contactEmail: z.string().nullable(),
    contactPhone: z.string().nullable(),
    isActive: z.boolean(),
    organizationId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
};
