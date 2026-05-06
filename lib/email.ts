import { Resend } from "resend";

const FROM_DEFAULT = "Aloha Reunion <onboarding@resend.dev>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function from() {
  return process.env.RESEND_FROM || FROM_DEFAULT;
}

function siteUrl(host: string | null) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (!host) return "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export type ConfirmationArgs = {
  to: string;
  name: string;
  editToken: string;
  host: string | null;
};

export async function sendConfirmationEmail({
  to,
  name,
  editToken,
  host,
}: ConfirmationArgs) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping confirmation email");
    return { ok: false, skipped: true as const };
  }

  const editUrl = `${siteUrl(host)}/edit/${editToken}`;
  const subject = "Aloha Batch Reunion 2026 — registration confirmed";
  const html = renderEmailHtml({ name, editUrl, intro: "Thank you for registering for the Aloha Batch 35th Year Reunion." });
  const text = renderEmailText({ name, editUrl, intro: "Thank you for registering for the Aloha Batch 35th Year Reunion." });

  try {
    const { error } = await resend.emails.send({
      from: from(),
      to,
      subject,
      html,
      text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true as const };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function sendEditLinkEmail({
  to,
  name,
  editToken,
  host,
}: ConfirmationArgs) {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };

  const editUrl = `${siteUrl(host)}/edit/${editToken}`;
  const subject = "Update your Aloha Reunion registration";
  const intro =
    "If you'd like to update your registration for the Aloha Batch 35th Year Reunion, please use the link below.";
  const html = renderEmailHtml({ name, editUrl, intro });
  const text = renderEmailText({ name, editUrl, intro });

  try {
    const { error } = await resend.emails.send({
      from: from(),
      to,
      subject,
      html,
      text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true as const };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function renderEmailHtml({
  name,
  editUrl,
  intro,
}: {
  name: string;
  editUrl: string;
  intro: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="560" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;max-width:560px;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;">
                <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">Aloha Batch</p>
                <h1 style="margin:4px 0 0;font-size:20px;font-weight:600;color:#18181b;">Get-Together 35th Year Reunion</h1>
                <p style="margin:6px 0 0;font-size:13px;color:#52525b;">17 – 19 July 2026 · Spice Village, Thekkady</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 12px;font-size:15px;">Hi ${escapeHtml(name)},</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">${escapeHtml(intro)}</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.55;">You can review or update your details any time using your personal link below — adding family members, changing meal preferences, travel times, or trek/boat opt-ins.</p>
                <p style="margin:24px 0;text-align:center;">
                  <a href="${editUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:500;">Open my registration</a>
                </p>
                <p style="margin:0 0 12px;font-size:12px;color:#71717a;">Or paste this link in your browser:</p>
                <p style="margin:0 0 24px;font-size:12px;color:#52525b;word-break:break-all;font-family:Menlo,monospace;">${editUrl}</p>
                <p style="margin:0 0 0;font-size:13px;color:#52525b;line-height:1.55;">Please complete or update your registration by <strong>10 July 2026</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
                Questions? Rajan +91-7708366999 · Dinesh +91-9894636331
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderEmailText({
  name,
  editUrl,
  intro,
}: {
  name: string;
  editUrl: string;
  intro: string;
}) {
  return [
    `Hi ${name},`,
    "",
    intro,
    "",
    "You can review or update your details any time using the link below.",
    "",
    editUrl,
    "",
    "Please complete or update your registration by 10 July 2026.",
    "",
    "Aloha Batch · 35th Year Reunion",
    "17 – 19 July 2026 · Spice Village, Thekkady",
    "",
    "Questions? Rajan +91-7708366999 · Dinesh +91-9894636331",
  ].join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
