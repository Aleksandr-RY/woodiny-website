import nodemailer from "nodemailer";
import { storage } from "./storage";

export async function getSmtpConfig() {
  let host = "", portStr = "", user = "", pass = "", to = "";
  let fromName = "", subject = "", cc = "", bcc = "", secure = "";

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

  if (!host)    host    = process.env.SMTP_HOST || "";
  if (!portStr) portStr = process.env.SMTP_PORT || "";
  if (!user)    user    = process.env.SMTP_USER || "";
  if (!pass)    pass    = process.env.SMTP_PASS || "";
  if (!to)      to      = process.env.SMTP_TO   || "";

  const portNum = parseInt(portStr || "465") || 465;
  const isSecure = secure === "" ? portNum === 465 : secure === "1";

  return { host, port: portNum, user, pass, to, fromName, subject, cc, bcc, isSecure };
}

export async function getEmailProvider(): Promise<"smtp" | "brevo" | "unisender"> {
  try {
    const settings = await storage.getSettings();
    const val = settings.find((s) => s.key === "email_provider")?.value;
    if (val === "brevo") return "brevo";
    if (val === "unisender") return "unisender";
  } catch {}
  return "smtp";
}

async function getBrevoConfig() {
  try {
    const settings = await storage.getSettings();
    const get = (key: string) => settings.find((s) => s.key === key)?.value || "";
    return {
      apiKey:    get("brevo_api_key"),
      fromEmail: get("brevo_from_email"),
      fromName:  get("brevo_from_name") || get("smtp_from_name") || "Woodiny",
      to:        get("brevo_to") || get("smtp_to"),
      subject:   get("smtp_subject"),
      cc:        get("smtp_cc"),
      bcc:       get("smtp_bcc"),
    };
  } catch {
    return { apiKey: "", fromEmail: "", fromName: "Woodiny", to: "", subject: "", cc: "", bcc: "" };
  }
}

async function getUnisenderConfig() {
  try {
    const settings = await storage.getSettings();
    const get = (key: string) => settings.find((s) => s.key === key)?.value || "";
    return {
      apiKey:    get("unisender_api_key"),
      fromEmail: get("unisender_from_email"),
      fromName:  get("unisender_from_name") || get("smtp_from_name") || "Woodiny",
      to:        get("unisender_to") || get("smtp_to"),
      listId:    get("unisender_list_id") || "1",
      subject:   get("smtp_subject"),
      cc:        get("smtp_cc"),
    };
  } catch {
    return { apiKey: "", fromEmail: "", fromName: "Woodiny", to: "", listId: "1", subject: "", cc: "" };
  }
}

async function sendViaBrevo(opts: {
  apiKey: string;
  from: { name: string; email: string };
  to: string; subject: string; html: string;
  cc?: string; bcc?: string;
}) {
  const body: Record<string, unknown> = {
    sender: opts.from,
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
  };
  if (opts.cc)  body.cc  = [{ email: opts.cc }];
  if (opts.bcc) body.bcc = [{ email: opts.bcc }];

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": opts.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    let errMsg = `Brevo ошибка ${resp.status}`;
    try { errMsg = JSON.parse(errText).message || errMsg; } catch {}
    throw new Error(errMsg);
  }
}

async function sendViaUnisender(opts: {
  apiKey: string;
  fromEmail: string; fromName: string;
  to: string; subject: string; html: string;
  listId: string; cc?: string;
}) {
  const params = new URLSearchParams({
    api_key:      opts.apiKey,
    email:        opts.to,
    sender_name:  opts.fromName,
    sender_email: opts.fromEmail,
    subject:      opts.subject,
    body:         opts.html,
    list_id:      opts.listId,
    format:       "json",
  });

  const resp = await fetch(`https://api.unisender.com/ru/api/sendEmail?${params.toString()}`, {
    method: "POST",
  });

  const data = await resp.json() as any;
  if (data.error) {
    throw new Error(`Unisender: ${data.error}`);
  }
  if (!resp.ok) {
    throw new Error(`Unisender ошибка ${resp.status}`);
  }
}

async function createSmtpTransport() {
  const { host, port, user, pass, isSecure } = await getSmtpConfig();
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port, secure: isSecure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });
}

function buildInquiryHtml(inquiry: { fio: string; phone: string; email?: string | null; message?: string | null }) {
  return `
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
}

const testHtml = (via: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
    <h2 style="color: #2C1D0E; border-bottom: 2px solid #C4975A; padding-bottom: 10px;">
      Тестовое письмо
    </h2>
    <p style="color: #444; line-height: 1.6;">
      Это тестовое письмо отправлено через <strong>${via}</strong> из панели администратора <strong>Woodiny</strong>.<br>
      Если вы его получили — настройки работают корректно.
    </p>
    <p style="margin-top: 24px; color: #888; font-size: 13px;">woodiny.ru</p>
  </div>
`;

export async function sendInquiryEmail(inquiry: {
  fio: string; phone: string; email?: string | null; message?: string | null;
}) {
  const provider = await getEmailProvider();
  const html = buildInquiryHtml(inquiry);

  if (provider === "brevo") {
    const cfg = await getBrevoConfig();
    if (!cfg.apiKey || !cfg.fromEmail || !cfg.to) {
      console.log("[mailer] Brevo не настроен"); return;
    }
    const subj = cfg.subject ? cfg.subject.replace("{name}", inquiry.fio) : `Новая заявка от ${inquiry.fio}`;
    try {
      await sendViaBrevo({ apiKey: cfg.apiKey, from: { name: cfg.fromName, email: cfg.fromEmail }, to: cfg.to, subject: subj, html, cc: cfg.cc || undefined, bcc: cfg.bcc || undefined });
      console.log(`[mailer][brevo] отправлено на ${cfg.to}`);
    } catch (e: any) { console.error("[mailer][brevo]", e.message); }
    return;
  }

  if (provider === "unisender") {
    const cfg = await getUnisenderConfig();
    if (!cfg.apiKey || !cfg.fromEmail || !cfg.to) {
      console.log("[mailer] Unisender не настроен"); return;
    }
    const subj = cfg.subject ? cfg.subject.replace("{name}", inquiry.fio) : `Новая заявка от ${inquiry.fio}`;
    try {
      await sendViaUnisender({ apiKey: cfg.apiKey, fromEmail: cfg.fromEmail, fromName: cfg.fromName, to: cfg.to, subject: subj, html, listId: cfg.listId });
      console.log(`[mailer][unisender] отправлено на ${cfg.to}`);
    } catch (e: any) { console.error("[mailer][unisender]", e.message); }
    return;
  }

  // SMTP
  const config = await getSmtpConfig();
  const transport = await createSmtpTransport();
  if (!transport) { console.log("[mailer] SMTP не настроен"); return; }

  const subj = config.subject ? config.subject.replace("{name}", inquiry.fio) : `Новая заявка от ${inquiry.fio}`;
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${config.fromName || "Woodiny"}" <${config.user}>`,
    to: config.to || config.user,
    subject: subj,
    html,
  };
  if (config.cc)  mailOptions.cc  = config.cc;
  if (config.bcc) mailOptions.bcc = config.bcc;

  try {
    await transport.sendMail(mailOptions);
    console.log(`[mailer][smtp] отправлено на ${config.to}`);
  } catch (e: any) { console.error("[mailer][smtp]", e.message); }
}

export async function sendTestEmail(): Promise<void> {
  const provider = await getEmailProvider();

  if (provider === "brevo") {
    const cfg = await getBrevoConfig();
    if (!cfg.apiKey)    throw new Error("Brevo: API ключ не заполнен.");
    if (!cfg.fromEmail) throw new Error("Brevo: Email отправителя не заполнен.");
    if (!cfg.to)        throw new Error("Brevo: Email получателя не заполнен.");
    await sendViaBrevo({
      apiKey: cfg.apiKey,
      from: { name: cfg.fromName, email: cfg.fromEmail },
      to: cfg.to,
      subject: "Тест — Email уведомления Woodiny",
      html: testHtml("Brevo API"),
    });
    return;
  }

  if (provider === "unisender") {
    const cfg = await getUnisenderConfig();
    if (!cfg.apiKey)    throw new Error("Unisender: API ключ не заполнен.");
    if (!cfg.fromEmail) throw new Error("Unisender: Email отправителя не заполнен.");
    if (!cfg.to)        throw new Error("Unisender: Email получателя не заполнен.");
    await sendViaUnisender({
      apiKey: cfg.apiKey,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName,
      to: cfg.to,
      subject: "Тест — Email уведомления Woodiny",
      html: testHtml("Unisender API"),
      listId: cfg.listId,
    });
    return;
  }

  // SMTP
  const config = await getSmtpConfig();
  if (!config.host || !config.user || !config.pass) {
    throw new Error("SMTP не настроен. Заполните сервер, email и пароль.");
  }
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.isSecure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000, socketTimeout: 10000, greetingTimeout: 10000,
  });
  await transport.sendMail({
    from: `"${config.fromName || "Woodiny"}" <${config.user}>`,
    to: config.to || config.user,
    subject: "Тест — Email уведомления Woodiny",
    html: testHtml("SMTP"),
  });
}
