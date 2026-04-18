import nodemailer from "nodemailer";
import { storage } from "./storage";

export async function getSmtpConfig() {
  let host = "";
  let portStr = "";
  let user = "";
  let pass = "";
  let to = "";
  let fromName = "";
  let subject = "";
  let cc = "";
  let bcc = "";
  let secure = "";

  try {
    const settings = await storage.getSettings();
    const get = (key: string) => settings.find((s) => s.key === key)?.value || "";

    host     = get("smtp_host");
    portStr  = get("smtp_port");
    user     = get("smtp_user");
    pass     = get("smtp_pass");
    to       = get("smtp_to");
    fromName = get("smtp_from_name");
    subject  = get("smtp_subject");
    cc       = get("smtp_cc");
    bcc      = get("smtp_bcc");
    secure   = get("smtp_secure");
  } catch (e) {
    console.error("[mailer] ошибка чтения настроек из БД:", e);
  }

  // Env vars used only as fallback when DB is empty
  if (!host)    host    = process.env.SMTP_HOST || "";
  if (!portStr) portStr = process.env.SMTP_PORT || "";
  if (!user)    user    = process.env.SMTP_USER || "";
  if (!pass)    pass    = process.env.SMTP_PASS || "";
  if (!to)      to      = process.env.SMTP_TO   || "";

  const portNum = parseInt(portStr || "465") || 465;
  const isSecure = secure === "" ? portNum === 465 : secure === "1";

  return { host, port: portNum, user, pass, to, fromName, subject, cc, bcc, isSecure };
}

async function createTransport() {
  const { host, port, user, pass, isSecure } = await getSmtpConfig();

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
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

  const to = config.to || config.user!;
  const fromLabel = config.fromName || "Woodiny";
  const subjectText = config.subject
    ? config.subject.replace("{name}", inquiry.fio)
    : `Новая заявка от ${inquiry.fio}`;

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

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${fromLabel}" <${config.user}>`,
    to,
    subject: subjectText,
    html,
  };
  if (config.cc)  mailOptions.cc  = config.cc;
  if (config.bcc) mailOptions.bcc = config.bcc;

  try {
    await transport.sendMail(mailOptions);
    console.log(`[mailer] письмо отправлено на ${to}`);
  } catch (e: any) {
    console.error("[mailer] ошибка отправки:", e.message);
  }
}

export async function sendTestEmail(): Promise<void> {
  const config = await getSmtpConfig();

  if (!config.host || !config.user || !config.pass) {
    throw new Error("SMTP не настроен. Заполните сервер, email и пароль.");
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.isSecure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });

  const to = config.to || config.user;
  const fromLabel = config.fromName || "Woodiny";

  await transport.sendMail({
    from: `"${fromLabel}" <${config.user}>`,
    to,
    subject: "Тест — Email уведомления Woodiny",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2C1D0E; border-bottom: 2px solid #C4975A; padding-bottom: 10px;">
          Тестовое письмо
        </h2>
        <p style="color: #444; line-height: 1.6;">
          Это тестовое письмо отправлено из панели администратора <strong>Woodiny</strong>.<br>
          Если вы его получили — настройки SMTP работают корректно.
        </p>
        <p style="margin-top: 24px; color: #888; font-size: 13px;">
          woodiny.ru
        </p>
      </div>
    `,
  });
}
