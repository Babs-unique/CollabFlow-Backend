// This template renders the password reset email that allows a user to recover access to their account.
// It includes the recipient name and the secure reset URL that should be opened in the browser.
import { renderEmailLayout } from './baseEmailLayout.js';

// This function builds the reset-password email from the user name and reset URL.
export const passwordResetTemplate = ({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) => {
  // Use a friendly fallback if the account owner name is unavailable.
  const safeName = name.trim() || 'there';

  // Render the reset email with a direct instruction to continue the reset flow.
  return renderEmailLayout({
    title: 'Reset your CollabFlow password',
    preview: 'Use the secure link below to reset your password.',
    heading: `Hello ${safeName},`,
    body: `
      <p>You recently requested a password reset for your CollabFlow account.</p>
      <p>Click the button below to choose a new password and continue securely.</p>
      <p>If you did not request this change, you can ignore this email and your password will remain unchanged.</p>
    `,
    primaryButtonText: 'Reset Password',
    primaryButtonUrl: resetUrl,
  });
};
