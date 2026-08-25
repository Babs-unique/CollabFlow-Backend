// This template renders the first welcome email a newly registered user receives.
// The template stays intentionally simple so it can be redesigned later without touching the queue logic.
import { renderEmailLayout } from './baseEmailLayout.js';

// This function turns a user name into the HTML body for the welcome email.
export const welcomeTemplate = ({
  name,
}: {
  name: string;
}) => {
  // Keep the display name friendly, even when the user data is missing or empty.
  const safeName = name.trim() || 'friend';

  // Render the welcome email using the shared base layout and a friendly tone.
  return renderEmailLayout({
    title: 'Welcome to CollabFlow',
    preview: 'Your account is ready. Start building your next workspace.',
    heading: `Welcome, ${safeName}!`,
    body: `
      <p>Your CollabFlow account has been created successfully.</p>
      <p>Start by creating your first workspace, inviting your team, and turning ideas into progress.</p>
      <p>We are happy to have you here.</p>
    `,
  });
};
