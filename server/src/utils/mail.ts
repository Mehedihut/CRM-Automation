import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user ?? undefined,
      pass: env.smtp.password ?? undefined,
    },
  });
  return _transporter;
}

interface ResetEmailArgs {
  to: string;
  toName: string;
  rawToken: string;
}

function buildResetUrl(rawToken: string): string {
  const base = env.appBaseUrl.replace(/\/$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

const SUBJECT = "Reset your CRM-Automation password";

function textBody(args: ResetEmailArgs): string {
  const url = buildResetUrl(args.rawToken);
  return [
    `Hi ${args.toName},`,
    "",
    "Someone (hopefully you) requested a password reset for your CRM-Automation account.",
    `Open this link within the next hour to choose a new password: ${url}`,
    "",
    "If you didn't request this, you can safely ignore this email.",
    "— CRM-Automation",
  ].join("\n");
}

function htmlBody(args: ResetEmailArgs): string {
  const url = buildResetUrl(args.rawToken);
  const safeName = args.toName.replace(/[<&>]/g, "");
  return `<!doctype html>
<html><body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2937;">
  <p>Hi ${safeName},</p>
  <p>Someone (hopefully you) requested a password reset for your CRM-Automation account.</p>
  <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
  <p style="color:#6b7280;font-size:13px;">If the button doesn't work, paste this URL into your browser:<br>${url}</p>
  <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
</body></html>`;
}

/**
 * Send (or in dev, log) a password-reset email. Never throws — a failed
 * email should not 500 the forgot-password endpoint.
 */
export async function sendPasswordResetEmail(args: ResetEmailArgs): Promise<void> {
  if (!env.smtp.enabled) {
    logger.warn(
      "[dev] SMTP not configured — would have emailed a reset link. URL: " +
        buildResetUrl(args.rawToken),
      { to: args.to },
    );
    return;
  }

  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: args.to,
      subject: SUBJECT,
      text: textBody(args),
      html: htmlBody(args),
    });
    logger.info("Password reset email sent", { to: args.to });
  } catch (err) {
    logger.error("Failed to send password reset email", { to: args.to, err });
    // Swallow: forgot-password must look identical success/failure to the
    // caller (no email enumeration). The user just won't get an email.
  }
}
