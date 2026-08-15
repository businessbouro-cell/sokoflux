import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_mock");
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@sokoflux.com";
const IS_MOCK = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_mock_key";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (IS_MOCK) {
    console.log(`\n[📧 Email → ${to}]`);
    console.log(`  Sujet: "${subject}"`);
    console.log(`  (Corps HTML omis en mode dev)\n`);
    return;
  }

  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  await sendEmail(
    to,
    "Bienvenue sur SokoFlux !",
    `<p>Bonjour ${name},</p><p>Bienvenue sur SokoFlux, la marketplace e-commerce d'Afrique de l'Ouest.</p>`
  );
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderRef: string,
  totalGNF: number
): Promise<void> {
  const { formatGNF } = await import("@/lib/utils/currency");
  await sendEmail(
    to,
    `Confirmation de commande ${orderRef}`,
    `<p>Bonjour ${name},</p><p>Votre commande <strong>${orderRef}</strong> d'un montant de <strong>${formatGNF(totalGNF)}</strong> a été confirmée.</p>`
  );
}

export async function sendPaymentReleasedEmail(
  to: string,
  name: string,
  orderRef: string,
  amount: number
): Promise<void> {
  const { formatGNF } = await import("@/lib/utils/currency");
  await sendEmail(
    to,
    `Paiement libéré - ${orderRef}`,
    `<p>Bonjour ${name},</p><p>Le paiement de <strong>${formatGNF(amount)}</strong> pour la commande <strong>${orderRef}</strong> a été libéré sur votre portefeuille SokoFlux.</p>`
  );
}
