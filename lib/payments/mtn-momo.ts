const IS_MOCK = process.env.NODE_ENV !== "production" || !process.env.MTN_MOMO_SUBSCRIPTION_KEY;

export async function requestToPayMTN(
  phone: string,
  amount: number,
  reference: string
): Promise<{ referenceId: string }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    const referenceId = `MTN-MOCK-${Date.now()}`;
    console.log(`[MOCK MTN MoMo] Demande de paiement`);
    console.log(`  → Téléphone: ${phone}`);
    console.log(`  → Montant: ${amount} GNF`);
    console.log(`  → Référence: ${reference}`);
    console.log(`  → ReferenceId: ${referenceId}`);
    return { referenceId };
  }

  const { v4: uuidv4 } = await import("uuid");
  const referenceId = uuidv4();

  await fetch(
    `${process.env.MTN_MOMO_API_URL}/collection/v1_0/requesttopay`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`).toString("base64")}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox",
        "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: "GNF",
        externalId: reference,
        payer: { partyIdType: "MSISDN", partyId: phone.replace("+", "") },
        payerMessage: `Paiement SokoFlux - ${reference}`,
        payeeNote: reference,
      }),
    }
  );

  return { referenceId };
}

export async function getMTNPaymentStatus(
  referenceId: string
): Promise<{ status: "SUCCESSFUL" | "PENDING" | "FAILED" }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    console.log(`[MOCK MTN MoMo] Statut: ${referenceId} → SUCCESSFUL`);
    return { status: "SUCCESSFUL" };
  }

  const res = await fetch(
    `${process.env.MTN_MOMO_API_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`).toString("base64")}`,
        "X-Target-Environment": process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox",
        "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
      },
    }
  );
  const data = await res.json();
  return { status: data.status };
}

export function verifyMTNWebhook(body: string, signature: string): boolean {
  if (IS_MOCK) return true;
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.MTN_MOMO_API_KEY ?? "")
    .update(body)
    .digest("hex");
  return signature === expected;
}
