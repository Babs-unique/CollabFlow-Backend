import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../utils/httpError.js";

export const createOrganization = async (
  data,
  userId: string
) => {
  return prisma.$transaction(async (tx) => {
    const organisation = await tx.organisation.create({
      data: {
        ...data,
        userId: userId,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: data.name,
        slug: data.
        organisationId: organisation.id,
      },
    });

    return {
      
    };
  });
};