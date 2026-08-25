// This template renders the email the user receives when they need to confirm a new account.
// It accepts the person's name and verification URL, then returns a ready-to-send HTML body.
import { renderEmailLayout } from './baseEmailLayout.js';

// This function turns a verification request into the full HTML email body.
export const verifyEmailTemplate = ({
  name,
  verificationUrl,
}: {
  name: string;
  verificationUrl: string;
}) => {
  // Escape the display name because user-provided data is injected into HTML.
  const safeName = name.trim() || 'there';

  // Build the full HTML email body with the shared layout and a strong call to action.
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
