ALTER TABLE "User"
ADD COLUMN "emailVerificationToken" VARCHAR(255),
ADD COLUMN "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN "passwordResetToken" VARCHAR(255),
ADD COLUMN "passwordResetExpires" TIMESTAMP(3);
