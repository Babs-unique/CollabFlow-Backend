import { z } from 'zod'

const RoleName = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const createOrganizationSchema = z.object({
  organization: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    logoUrl: z.string().optional(),
  }),

  workspace: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(["SOFTWARE_ENGINEERING", "DESIGN_CREATIVE"]).optional(),
  }),

  // members/invites: frontend sends an array of invite objects
  members: z.array(
    z.object({
      email: z.string().email(),
      // accept role name and later resolve to roleId in service
      role: RoleName,
      // optional expiresAt ISO string; server may override
      expiresAt: z.string().optional(),
    })
  ).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;