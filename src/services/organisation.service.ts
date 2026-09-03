import { prisma } from "../lib/prisma.js";
import crypto from "node:crypto";
import type { CreateOrganizationInput } from "../schema/organisation.schema.js";
import { createHttpError } from "../utils/httpError.js";
import emailService from "./email.service.js";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 255);

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const createOrganization = async (
  data: CreateOrganizationInput,
  userId: string
) => {
  // 1. Prepare data for database operations
  const orgData = data.organization;
  const wsData = data.workspace;
  const invitationsData = data.invitations ?? [];
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours

  const processedList = invitationsData.map((inv) => {
    const plainToken = crypto.randomInt(100000, 999999).toString();
    return {
      email: inv.email,
      roleId: inv.roleId,
      plainToken, // Kept to use in email step below
      tokenHash: hashToken(plainToken),
    };
  });



  // 2. Execute database operations inside the transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the Organization
    const organization = await tx.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug ?? slugify(orgData.name),
        logoUrl: orgData.logoUrl ?? null,
        userId,
      },
    });

    // Create the Workspace
    const workspace = await tx.workspace.create({
      data: {
        name: wsData.name,
        slug: wsData.slug ?? slugify(wsData.name),
        description: wsData.description ?? null,
        type: wsData.type ?? undefined,
        organizationId: organization.id,
      },
    });

    // Batch insert invitations using createMany (PostgreSQL compatible)
    if (processedList.length > 0) {
      await tx.invitation.createMany({
        data: processedList.map((inv) => ({
          organizationId: organization.id,
          email: inv.email,
          roleId: inv.roleId,
          tokenHash: inv.tokenHash,
          expiresAt,
        })),
      });
    }

    // Ensure an OWNER role exists and create a membership for the creator
    let ownerRole = await tx.role.findUnique({ where: { name: 'OWNER' } });
    if (!ownerRole) {
      ownerRole = await tx.role.create({
        data: {
          name: 'OWNER',
          description: 'Organization owner',
        },
      });
    }

    await tx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        roleId: ownerRole.id,
        status: 'ACTIVE',
      },
    });

    return { organization, workspace };
  });

  // 3. Send emails AFTER the transaction completes successfully
  if (processedList.length > 0) {
    const workspaceSlug = result.workspace.slug;
    
    // Using Promise.allSettled so one failing email delivery doesn't crash the request
    await Promise.allSettled(
      processedList.map((inv) =>
        emailService.sendWorkspaceInvitationEmail({
          to: inv.email,
          inviterName: "Your App Name", 
          workspaceName: wsData.name,
          // Append the plain text 6-digit token to the URL parameters
          invitationUrl: `${process.env.CLIENT_URL}/invite/${workspaceSlug}?token=${inv.plainToken}`,
        })
      )
    );
  }

  // Send a welcome email to the organization creator (best-effort)
  try {
    const creator = await prisma.user.findUnique({ where: { id: userId } });
    if (creator && creator.email) {
      await emailService.sendWelcomeEmail({ to: creator.email, firstName: creator.firstName });
    }
  } catch (e) {
    console.warn('Failed to send welcome email to organization creator', e);
  }

  // 4. Return clean response data
  return {
    organization: result.organization,
    workspace: result.workspace,
  };
};

export const getOrganizations = async (userId: string) => {
  return prisma.organization.findMany({
    where: {
      OR: [
        { userId },
        { memberships: { some: { userId } } },
      ],
    },
    include: {
      workspaces: true,
      memberships: {
        where: { userId },
        include: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const joinOrganization = async (userId: string, organizationId: string, invitationCode: string) => {
  const tokenHash = hashToken(invitationCode);

  const invitation = await prisma.invitation.findFirst({
    where: {
      organizationId,
      tokenHash,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
  });

  if (!invitation) {
    throw createHttpError('Invalid or expired invitation', 400);
  }

  // Check existing membership
  const existing = await prisma.membership.findFirst({ where: { userId, organizationId } });
  if (existing) {
    // mark invitation accepted if still pending
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED' } });
    return existing;
  }

  // Create membership
  const membership = await prisma.membership.create({
    data: {
      userId,
      organizationId,
      roleId: invitation.roleId,
      status: 'ACTIVE',
    },
  });

  // Mark invitation accepted
  await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED' } });

  // Send welcome email (best-effort)
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.email) {
      await emailService.sendWelcomeEmail({ to: user.email, firstName: user.firstName });
    }
  } catch (e) {
    // ignore email failures — membership already created
    console.warn('Failed to send welcome email', e);
  }

  return membership;
};

export const deleteOrganization = async (userId: string, organizationId: string) => {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw createHttpError('Organization not found', 404);

    // Permission check: owner (userId) or membership role OWNER/ADMIN
    if (organization.userId !== userId) {
      const membership = await tx.membership.findFirst({ where: { userId, organizationId }, include: { role: true } });
      if (!membership || (membership.role.name !== 'OWNER' && membership.role.name !== 'ADMIN')) {
        throw createHttpError('Forbidden: insufficient permissions', 403);
      }
    }

    const now = new Date();

    // Soft-delete: mark invitations cancelled, memberships suspended, workspaces and organization deletedAt
    await tx.invitation.updateMany({ where: { organizationId }, data: { status: 'CANCELLED' } });
    await tx.membership.updateMany({ where: { organizationId }, data: { status: 'SUSPENDED' } });
    await tx.workspace.updateMany({ where: { organizationId }, data: { deletedAt: now } });
    await tx.organization.update({ where: { id: organizationId }, data: { deletedAt: now } });

    return { success: true };
  });
};


