interface EmailVerificationTemplateInput {
  recipientName: string;
  code: string;
  expiresInMinutes: number;
  brandName: string;
  appUrl?: string;
  supportEmail?: string;
}

interface EmailVerificationTemplate {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildEmailVerificationTemplate(
  input: EmailVerificationTemplateInput,
): EmailVerificationTemplate {
  const safeName = escapeHtml(input.recipientName);
  const safeCode = escapeHtml(input.code);
  const safeBrandName = escapeHtml(input.brandName);
  const safeSupportEmail = input.supportEmail ? escapeHtml(input.supportEmail) : undefined;
  const safeAppUrl = input.appUrl ? escapeHtml(input.appUrl) : undefined;

  const subject = `${input.brandName} - Codigo de verificacion`;

  const textLines = [
    `Hola ${input.recipientName},`,
    '',
    `Tu codigo de verificacion para ${input.brandName} es: ${input.code}`,
    `Expira en ${input.expiresInMinutes} minutos.`,
  ];

  if (input.appUrl) {
    textLines.push('', `Accede a tu cuenta: ${input.appUrl}`);
  }

  if (input.supportEmail) {
    textLines.push('', `Soporte: ${input.supportEmail}`);
  }

  const text = textLines.join('\n');

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeBrandName}</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f3f5f8;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:24px;background:linear-gradient(135deg,#1f6feb 0%,#0f9d7a 100%);color:#ffffff;">
          <p style="margin:0;font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">${safeBrandName}</p>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;">Verificacion de correo</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:16px;">Hola ${safeName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Usa este codigo para terminar de verificar tu cuenta.</p>
          <p style="margin:0 0 20px;padding:14px 18px;border:1px solid #dbe3ef;border-radius:10px;background:#f8fbff;font-size:28px;font-weight:700;letter-spacing:.12em;text-align:center;">${safeCode}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">Este codigo expira en <strong>${input.expiresInMinutes} minutos</strong>.</p>
          ${safeAppUrl ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Puedes continuar en <a href="${safeAppUrl}" style="color:#1f6feb;">${safeAppUrl}</a>.</p>` : ''}
          ${safeSupportEmail ? `<p style="margin:0;font-size:13px;color:#6b7280;">Si no solicitaste este codigo, ignora este mensaje o escribe a <a href="mailto:${safeSupportEmail}" style="color:#1f6feb;">${safeSupportEmail}</a>.</p>` : ''}
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    text,
    html,
  };
}
