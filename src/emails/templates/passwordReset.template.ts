import { renderEmailLayout } from './baseEmailLayout.js';

export const passwordResetTemplate = ({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}) => {
  const safeName = name.trim() || 'there';

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
