import { renderEmailLayout } from './baseEmailLayout.js';

export const verifyEmailTemplate = ({
  name,
  verificationUrl,
}: {
  name: string;
  verificationUrl: string;
}) => {
  const safeName = name.trim() || 'there';

  return renderEmailLayout({
    title: 'Verify your CollabFlow email',
    preview: 'Please confirm your email address to activate your account.',
    heading: `Hello ${safeName},`,
    body: `
      <p>Please verify your email address to finish setting up your CollabFlow account.</p>
      <p>Once you confirm your email, you can create workspaces, invite teammates, and start collaborating.</p>
      <p>If you did not create this account, you can safely ignore this message.</p>
    `,
    primaryButtonText: 'Verify Email',
    primaryButtonUrl: verificationUrl,
  });
};
