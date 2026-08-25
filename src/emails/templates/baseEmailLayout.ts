// This file keeps the shared HTML structure in one place so the individual templates stay readable.
// The layout is deliberately simple at first, and it can be refactored later into a more advanced design system.

// Escape HTML characters before injecting user-generated values into email markup.
export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Render the common email shell used by all templates so the body looks consistent across messages.
export const renderEmailLayout = ({
  title,
  preview,
  heading,
  body,
  primaryButtonText,
  primaryButtonUrl,
}: {
  title: string;
  preview: string;
  heading: string;
  body: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
}) => {
  // Keep the main button optional so some templates can send simple informational emails without a CTA.
  const buttonMarkup = primaryButtonText && primaryButtonUrl
    ? `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto 0;">
            <tr>
              <td style="border-radius: 8px; background-color: #4f46e5; text-align: center;">
                <a href="${escapeHtml(primaryButtonUrl)}" style="display: inline-block; padding: 14px 24px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                  ${escapeHtml(primaryButtonText)}
                </a>
              </td>
            </tr>
          </table>
        `
    : '';

  // Return the final HTML string for the email body.
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif; color: #111827;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          ${escapeHtml(preview)}
        </div>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7fb; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px 32px 16px; text-align: left;">
                    <div style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.03em;">
                      CollabFlow
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 32px;">
                    <div style="font-size: 26px; line-height: 1.3; font-weight: 700; color: #111827; margin-bottom: 16px;">
                      ${escapeHtml(heading)}
                    </div>
                    <div style="font-size: 16px; line-height: 1.7; color: #374151;">
                      ${body}
                    </div>
                    ${buttonMarkup}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 32px 32px; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    This email was sent by CollabFlow. If you did not request this action, you can safely ignore it.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
