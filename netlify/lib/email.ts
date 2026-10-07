import { env } from './http';

/** Sends the restore link with Resend (https://resend.com). */
export async function sendRestoreEmail(to: string, link: string): Promise<void> {
  const name = process.env.SITE_NAME || 'Calorie Guesser';
  const text = [
    `Here's your link to restore your ${name} purchase on this device:`,
    '',
    link,
    '',
    'The link works for 30 minutes. If you didn’t ask for it, you can ignore this email.',
  ].join('\n');
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#22160f">
  <h1 style="font-size:22px;margin:0 0 12px">Restore your purchase</h1>
  <p style="font-size:16px;line-height:1.5">Tap the button to unlock the full archive and bonus puzzles on this device.</p>
  <p style="margin:24px 0"><a href="${link}" style="background:#d13a22;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;display:inline-block">Restore my purchase</a></p>
  <p style="font-size:14px;color:#6b5546;line-height:1.5">The link works for 30 minutes. If you didn’t ask for it, you can ignore this email.</p>
</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env('EMAIL_FROM'), to: [to], subject: `Restore your ${name} purchase`, text, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
