export type EmailType = 'VERIFY_EMAIL' | 'WELCOME' | 'WORKSPACE_INVITATION' | 'PASSWORD_RESET';
export type BaseEmailJob<T extends EmailType, D> = {
  type: T;
  to: string;
  data: D;
};
export type VerifyEmailData = {
  firstName: string;
  verificationUrl: string;
};

export type WelcomeEmailData = {
  firstName: string;
};

export type WorkspaceInvitationData = {
  inviterName: string;
  workspaceName: string;
  invitationUrl: string;
  invitationCode?: string;
};

export type PasswordResetData = {
  firstName: string;
  resetUrl: string;
};

export type EmailJob =
  | BaseEmailJob<'VERIFY_EMAIL', VerifyEmailData>
  | BaseEmailJob<'WELCOME', WelcomeEmailData>
  | BaseEmailJob<'WORKSPACE_INVITATION', WorkspaceInvitationData>
  | BaseEmailJob<'PASSWORD_RESET', PasswordResetData>;

export type EmailJobType = EmailJob['type'];

export type EmailJobDataByType = {
  VERIFY_EMAIL: VerifyEmailData;
  WELCOME: WelcomeEmailData;
  WORKSPACE_INVITATION: WorkspaceInvitationData;
  PASSWORD_RESET: PasswordResetData;
};
