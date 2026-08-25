// This template renders the email that invites a user to join a specific workspace.
// It receives the inviter name, workspace name, and the join URL that should be opened by the recipient.
import { renderEmailLayout } from './baseEmailLayout.js';

// This function returns the workspace invitation HTML based on the invite details.
export const workspaceInvitationTemplate = ({
  inviterName,
  workspaceName,
  invitationUrl,
}: {
  inviterName: string;
  workspaceName: string;
  invitationUrl: string;
}) => {
  // Normalize the names so the email reads naturally even with minimal input.
  const safeInviterName = inviterName.trim() || 'A team member';
  const safeWorkspaceName = workspaceName.trim() || 'a workspace';

  // Render the invitation with a clear call to action for joining the new workspace.
  return renderEmailLayout({
    title: `Invitation to join ${safeWorkspaceName}`,
    preview: `${safeInviterName} invited you to join ${safeWorkspaceName}.`,
    heading: `You’ve been invited to join ${safeWorkspaceName}`,
    body: `
      <p>${safeInviterName} invited you to collaborate on <strong>${safeWorkspaceName}</strong>.</p>
      <p>Use the button below to accept the invitation and join the workspace.</p>
    `,
    primaryButtonText: 'Join Workspace',
    primaryButtonUrl: invitationUrl,
  });
};
