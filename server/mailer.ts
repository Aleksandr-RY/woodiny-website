import nodemailer from "nodemailer";
import { storage } from "./storage";

async function getSmtpConfig() {
  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || "0");
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let to = process.env.SMTP_TO;

  try {
    const settings = await storage.getSettings();
    const get = (key: string) => settings.find((s) => s.key === key)?.value || "";

    if (!host)  host  = get("smtp_host");
    if (!port)  port  = parseInt(get("smtp_port") || "465");
    if (!user)  user  = get("smtp_user");
    if (!pass)  pass  = get("smtp_pass");
    if (!to)    to    = get("smtp_to");
  } catch (e) {
    console.error("[mailer] ошибка чтения настроек из БД:", e);
  }

  return { host, port: port || 465, user, pass, to };
}

async function createTransport() {
  const { host, port, user, pass } = await getSmtpConfig();

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendInquiryEmail(inquiry: {
  fio: string;
  phone: string;
  email?: string | null;
  message?: string | null;
}) {
  const config = await getSmtpConfig();
  const transport = await createTransport();
  if (!transport) {
    console.log("[mailer] SMTP не настроен, письмо не отправлено");
    return;
  }

  const to = config.to || config.user;
  const from = config.user;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2C1D0E; border-bottom: 2px solid #C4975A; padding-bottom: 10px;">
        Новая заявка с сайта Woodiny
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; background: #f5f0eb; font-weight: bold; width: 140px;">Имя</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e8e0d8;">${inquiry.fio}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f5f0eb; font-weight: bold;">Телефон</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e8e0d8;">
            <a href="tel:${inquiry.phone}" style="color: #C4975A;">${inquiry.phone}</a>
          </td>
        </tr>
        ${inquiry.email ? `
        <tr>
          <td style="padding: 8px 12px; background: #f5f0eb; font-weight: bold;">Email</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e8e0d8;">
            <a href="mailto:${inquiry.email}" style="color: #C4975A;">${inquiry.email}</a>
          </td>
        </tr>` : ""}
        ${inquiry.message ? `
        <tr>
          <td style="padding: 8px 12px; background: #f5f0eb; font-weight: bold; vertical-align: top;">Сообщение</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e8e0d8;">${inquiry.message.replace(/\n/g, "<br>")}</td>
        </tr>` : ""}
      </table>
      <p style="margin-top: 24px; color: #888; font-size: 13px;">
        Письмо отправлено автоматически с сайта woodiny.ru
      </p>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"Woodiny" <${from}>`,
      to,
      subject: `Новая заявка от ${inquiry.fio}`,
      html,
    });
    console.log(`[mailer] письмо отправлено на ${to}`);
  } catch (e: any) {
    console.error("[mailer] ошибка отправки:", e.message);
  }
}
