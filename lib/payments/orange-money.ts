const IS_MOCK = process.env.NODE_ENV !== "production" || !process.env.ORANGE_MONEY_CLIENT_ID;

interface OrangeMoneyPayment {
  txnId: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  amount: number;
  phone: string;
}

export async function initiateOrangeMoneyPayment(
  phone: string,
  amount: number,
  reference: string
): Promise<{ txnId: string; status: string }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    const txnId = `OM-MOCK-${Date.now()}`;
    console.log(`[MOCK Orange Money] Paiement initié`);
    console.log(`  → Téléphone: ${phone}`);
    console.log(`  → Montant: ${amount} GNF`);
    console.log(`  → Référence: ${reference}`);
    console.log(`  → TxnId: ${txnId}`);
    return { txnId, status: "PENDING" };
  }

  const tokenRes = await fetch(`${process.env.ORANGE_MONEY_API_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.ORANGE_MONEY_CLIENT_ID}:${process.env.ORANGE_MONEY_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  const res = await fetch(`${process.env.ORANGE_MONEY_API_URL}/webpayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
      currency: "GNF",
      order_id: reference,
      amount,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders`,
      notif_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/orange-money`,
      lang: "fr",
    }),
  });

  const data = await res.json();
  return { txnId: data.pay_token, status: data.status };
}

export async function checkOrangeMoneyStatus(
  txnId: string
): Promise<{ status: "SUCCESS" | "PENDING" | "FAILED"; amount?: number }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    console.log(`[MOCK Orange Money] Vérification statut: ${txnId} → SUCCESS`);
    return { status: "SUCCESS", amount: 0 };
  }

  const res = await fetch(`${process.env.ORANGE_MONEY_API_URL}/transactionstatus/${txnId}`);
  const data = await res.json();
  return { status: data.status, amount: data.amount };
}

export async function refundOrangeMoney(
  txnId: string
): Promise<{ status: string }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    console.log(`[MOCK Orange Money] Remboursement: ${txnId}`);
    return { status: "SUCCESS" };
  }

  const res = await fetch(`${process.env.ORANGE_MONEY_API_URL}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pay_token: txnId }),
  });
  const data = await res.json();
  return { status: data.status };
}

export function verifyOrangeMoneyWebhook(
  body: string,
  signature: string
): boolean {
  if (IS_MOCK) return true;
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.ORANGE_MONEY_MERCHANT_KEY ?? "")
    .update(body)
    .digest("hex");
  return signature === expected;
}
