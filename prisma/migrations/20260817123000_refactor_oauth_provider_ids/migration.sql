ALTER TABLE "Oauth"
DROP COLUMN IF EXISTS "googleId",
DROP COLUMN IF EXISTS "githubId",
ADD COLUMN "providerUserId" VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE "Oauth"
ALTER COLUMN "providerUserId" DROP DEFAULT;

CREATE UNIQUE INDEX "Oauth_provider_providerUserId_key" ON "Oauth"("provider", "providerUserId");
CREATE UNIQUE INDEX "Oauth_provider_userId_key" ON "Oauth"("provider", "userId");
