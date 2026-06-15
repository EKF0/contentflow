const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] (no API key) To: ${to} | Subject: ${subject}`);
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'ContentFlow <notifications@contentflow.app>',
    to,
    subject,
    html,
  });
}

function baseHtml(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      ${content}
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        <a href="${APP_URL}" style="color: #9ca3af;">ContentFlow</a> — Editorial content planner
      </p>
    </div>
  `;
}

export async function sendMentionEmail(params: {
  to: string;
  mentionerName: string;
  recordTitle: string;
  workspaceName: string;
  recordUrl: string;
}): Promise<void> {
  const { to, mentionerName, recordTitle, workspaceName, recordUrl } = params;

  const html = baseHtml(`
    <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a1d27;">
      ${mentionerName} mentioned you
    </h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      in <strong>${workspaceName}</strong> &middot; "${recordTitle}"
    </p>
    <a href="${recordUrl}"
       style="display: inline-block; background: #1b61c9; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
      View Record
    </a>
  `);

  await sendEmail(to, `${mentionerName} mentioned you in "${recordTitle}"`, html);
}

export async function sendAssignmentEmail(params: {
  to: string;
  assignerName: string;
  recordTitle: string;
  workspaceName: string;
  recordUrl: string;
}): Promise<void> {
  const { to, assignerName, recordTitle, workspaceName, recordUrl } = params;

  const html = baseHtml(`
    <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a1d27;">
      You've been assigned a record
    </h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      <strong>${assignerName}</strong> assigned you to "${recordTitle}" in <strong>${workspaceName}</strong>
    </p>
    <a href="${recordUrl}"
       style="display: inline-block; background: #1b61c9; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
      View Record
    </a>
  `);

  await sendEmail(to, `${assignerName} assigned you to "${recordTitle}"`, html);
}

export async function sendStatusChangeEmail(params: {
  to: string;
  changerName: string;
  recordTitle: string;
  oldStatus: string;
  newStatus: string;
  recordUrl: string;
}): Promise<void> {
  const { to, changerName, recordTitle, oldStatus, newStatus, recordUrl } = params;

  const html = baseHtml(`
    <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a1d27;">
      Status updated
    </h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      <strong>${changerName}</strong> changed "${recordTitle}" status
    </p>
    <div style="margin: 16px 0; font-size: 14px;">
      <span style="background: #e5e7eb; padding: 4px 10px; border-radius: 4px; color: #374151;">${oldStatus}</span>
      <span style="margin: 0 8px; color: #9ca3af;">&rarr;</span>
      <span style="background: #dbeafe; padding: 4px 10px; border-radius: 4px; color: #1b61c9; font-weight: 500;">${newStatus}</span>
    </div>
    <a href="${recordUrl}"
       style="display: inline-block; background: #1b61c9; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
      View Record
    </a>
  `);

  await sendEmail(to, `"${recordTitle}" status changed to ${newStatus}`, html);
}
