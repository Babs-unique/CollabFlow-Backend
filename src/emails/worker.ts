import { Worker } from 'bullmq';
import { Resend } from 'resend';
import logger from '../lib/logger.js';
import { connection } from './queue.js';
import type { EmailJob } from './emailTypes.js';
import { verifyEmailTemplate } from './templates/verifyEmail.template.js';
import { welcomeTemplate } from './templates/welcome.template.js';
import { workspaceInvitationTemplate } from './templates/workspaceInvitation.template.js';
import { passwordResetTemplate } from './templates/passwordReset.template.js';

const worker = new Worker<EmailJob>(
  'email',
  async (job) => {
    const { type, to, data } = job.data;

    let subject = '';
    let html = '';

    switch (type) {
      case 'VERIFY_EMAIL':
        subject = 'Verify your CollabFlow email';
        html = verifyEmailTemplate({
          name: data.firstName,
          verificationUrl: data.verificationUrl,
        });
        break;
      case 'WELCOME':
        subject = 'Welcome to CollabFlow';
        html = welcomeTemplate({
          name: data.firstName,
        });
        break;
      case 'WORKSPACE_INVITATION':
        subject = `Invitation to join ${data.workspaceName}`;
        html = workspaceInvitationTemplate({
          inviterName: data.inviterName,
          workspaceName: data.workspaceName,
          invitationUrl: data.invitationUrl,
        });
        break;
      case 'PASSWORD_RESET':
        subject = 'Reset your CollabFlow password';
        html = passwordResetTemplate({
          name: data.firstName,
          resetUrl: data.resetUrl,
        });
        break;
      default:
        throw new Error(`Unsupported email type: ${type as string}`);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is missing.');
    }

    const resend = new Resend(resendApiKey);

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    });

    logger.info(
      {
        jobId: job.id,
        type,
        to,
        responseId: response.data?.id,
      },
      'Email job processed successfully.'
    );

    return response;
  },
  {
    connection,
    autorun: true,
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, 'Email job completed.');
});

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, type: job?.data?.type, err: error }, 'Email job failed.');
});

worker.on('error', (error) => {
  logger.error({ err: error }, 'Email worker error.');
});

export default worker;
