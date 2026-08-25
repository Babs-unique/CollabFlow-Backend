import { renderEmailLayout } from './baseEmailLayout.js';

export const workspaceInvitationTemplate = ({
  inviterName,
  workspaceName,
  invitationUrl,
}: {
  inviterName: string;
  workspaceName: string;
  invitationUrl: string;
}) => {
  const safeInviterName = inviterName.trim() || 'A team member';
  const safeWorkspaceName = workspaceName.trim() || 'a workspace';

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
