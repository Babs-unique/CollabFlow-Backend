import { renderEmailLayout } from './baseEmailLayout.js';

export const workspaceInvitationTemplate = ({
  inviterName,
  workspaceName,
  invitationUrl,
  invitationCode,
}: {
  inviterName: string;
  workspaceName: string;
  invitationUrl: string;
  invitationCode?: string;
}) => {
  const safeInviterName = inviterName.trim() || 'A team member';
  const safeWorkspaceName = workspaceName.trim() || 'a workspace';

  return renderEmailLayout({
    title: `Invitation to join ${safeWorkspaceName}`,
    preview: `${safeInviterName} invited you to join ${safeWorkspaceName}.`,
    heading: `You’ve been invited to join ${safeWorkspaceName}`,
    body: `
      <p>${safeInviterName} invited you to collaborate on <strong>${safeWorkspaceName}</strong>.</p>
      <p>Use the button below to accept the invitation and join the organization.</p>
      ${invitationCode ? `<p style="font-size:18px;margin:18px 0;padding:12px;background:#f6f8fa;border-radius:6px;text-align:center;font-weight:600">Your invitation code: ${invitationCode}</p>` : ''}
    `,
    primaryButtonText: 'Join Organization',
    primaryButtonUrl: invitationUrl,
  });
};
