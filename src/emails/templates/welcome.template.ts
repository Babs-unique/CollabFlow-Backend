import { renderEmailLayout } from './baseEmailLayout.js';

export const welcomeTemplate = ({
  name,
}: {
  name: string;
}) => {
  const safeName = name.trim() || 'friend';

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
