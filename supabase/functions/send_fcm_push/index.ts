import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { token, title, body } = await req.json();

    if (!token || !title || !body) {
      return new Response("Missing fields", { status: 400 });
    }

    const apiKey = Deno.env.get("FCM_SERVER_KEY");
    if (!apiKey) {
      return new Response("Missing FCM key", { status: 500 });
    }

    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `key=${apiKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          sound: "default",
        },
      }),
    });

    const data = await res.text();
    return new Response(data, { status: res.status });
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

