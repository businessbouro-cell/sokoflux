const IS_MOCK = process.env.NODE_ENV !== "production" || !process.env.AT_API_KEY || process.env.AT_API_KEY === "mock-at-api-key";

export async function sendOTP(phone: string, code: string): Promise<void> {
  const message = `SokoFlux: Votre code de vérification est ${code}. Valable 10 minutes. Ne le partagez pas.`;

  if (IS_MOCK) {
    console.log(`\n[📱 SMS OTP → ${phone}]`);
    console.log(`  Code: ${code}`);
    console.log(`  Message: "${message}"\n`);
    return;
  }

  await sendViaSMSGateway(phone, message);
}

export async function sendSMSNotification(phone: string, message: string): Promise<void> {
  if (IS_MOCK) {
    console.log(`\n[📱 SMS → ${phone}]`);
    console.log(`  Message: "${message}"\n`);
    return;
  }

  await sendViaSMSGateway(phone, message);
}

async function sendViaSMSGateway(phone: string, message: string): Promise<void> {
  // Production: uses Africa's Talking REST API directly (no SDK needed at build time)
  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: process.env.AT_API_KEY!,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: process.env.AT_USERNAME ?? "sokoflux",
      to: phone,
      message,
      from: process.env.AT_SENDER_ID ?? "SokoFlux",
    }),
  });
  if (!res.ok) throw new Error(`SMS failed: ${res.status}`);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
