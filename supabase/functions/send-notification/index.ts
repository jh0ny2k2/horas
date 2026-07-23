import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { google } from "https://esm.sh/googleapis@128"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const getAccessToken = async () => {
  const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!)
  
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"]
  )

  const { token } = await jwtClient.authorize()
  return token
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { user_id, title, body, data } = await req.json()

    const { data: profile } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", user_id)
      .single()

    if (!profile?.fcm_token) {
      return new Response(
        JSON.stringify({ error: "User has no FCM token" }),
        { status: 400 }
      )
    }

    const accessToken = await getAccessToken()
    const projectId = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!).project_id

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            notification: { title, body },
            data: data || {},
            android: {
              priority: "high",
              notification: { channelId: "default" },
            },
          },
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: result }),
        { status: response.status }
      )
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
