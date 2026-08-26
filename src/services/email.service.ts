import type { JobsOptions } from 'bullmq';
import emailQueue from '../emails/queue.js';
import type { EmailJob, EmailJobType } from '../emails/emailTypes.js';

const emailJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 1000 },
};

const queueEmail = async <T extends EmailJobType>(
  type: T,
  to: string,
  data: Extract<EmailJob, { type: T }>['data']
) => {
  const payload: Extract<EmailJob, { type: T }> = {
    type,
    to,
    data,
  } as Extract<EmailJob, { type: T }>;

  return emailQueue.add('send-email', payload, emailJobOptions);
};

export const emailService = {
  sendVerificationEmail: async ({
    to,
    firstName,
    verificationUrl,
  }: {
    to: string;
    firstName: string;
    verificationUrl: string;
  }) => {
    return queueEmail('VERIFY_EMAIL', to, {
      firstName,
      verificationUrl,
    });
  },
  sendWelcomeEmail: async ({
    to,
    firstName,
  }: {
    to: string;
    firstName: string;
  }) => {
    return queueEmail('WELCOME', to, {
      firstName,
    });
  },
  sendWorkspaceInvitationEmail: async ({
    to,
    inviterName,
    workspaceName,
    invitationUrl,
  }: {
    to: string;
    inviterName: string;
    workspaceName: string;
    invitationUrl: string;
  }) => {
    return queueEmail('WORKSPACE_INVITATION', to, {
      inviterName,
      workspaceName,
      invitationUrl,
    });
  },  sendPasswordResetEmail: async ({
    to,
    firstName,
    resetUrl,
  }: {
    to: string;
    firstName: string;
    resetUrl: string;
  }) => {
    return queueEmail('PASSWORD_RESET', to, {
      firstName,
      resetUrl,
    });
  },
};

export default emailService;
