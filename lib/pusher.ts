import Pusher from "pusher";
import PusherJs from "pusher-js";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? "mock",
  key: process.env.PUSHER_KEY ?? "mock",
  secret: process.env.PUSHER_SECRET ?? "mock",
  cluster: process.env.PUSHER_CLUSTER ?? "eu",
  useTLS: true,
});

export function getPusherClient(): PusherJs {
  return new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY ?? "mock", {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu",
  });
}
