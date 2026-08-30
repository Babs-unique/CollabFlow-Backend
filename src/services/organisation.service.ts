import { prisma } from "../lib/prisma.js";
import crypto from "node:crypto";
import type { CreateOrganizationInput } from "../schema/organisation.schema.js";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 255);

export const createOrganization = async (
  data: CreateOrganizationInput,
  userId: string
) => {
  return prisma.$transaction(async (tx) => {
    const orgData = data.organization;
    const wsData = data.workspace;

    // 1. Create the Organization
    const organization = await tx.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug ?? slugify(orgData.name),
        logoUrl: orgData.logoUrl ?? null,
        userId,
      },
    });

    // 2. Create the Workspace linked to the Organization
    const workspace = await tx.workspace.create({
      data: {
        name: wsData.name,
        slug: wsData.slug ?? slugify(wsData.name),
        description: wsData.description ?? null,
        type: wsData.type ?? undefined,
        organizationId: organization.id,
      },
    });
    return {
      organization,
      workspace
    };
  });
};
