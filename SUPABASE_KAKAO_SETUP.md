# DevGym ProjectOS Supabase + Kakao Setup

## 1. Supabase project

Create a Supabase project for `devgym-project-os`.

Recommended settings:
- Project name: `devgym-project-os`
- Region: closest available Asia region
- Database password: store it in a password manager, never in this repository

After the project is ready:
1. Open **SQL Editor**
2. Run `supabase-schema.sql`
3. Open **Project Settings > API**
4. Copy:
   - Project URL
   - Publishable key, or anon public key
5. In ProjectOS, open **Settings** and paste those values

## 2. Kakao Developers app

Create or use a Kakao Developers app.

In Kakao Developers:
1. Enable **Kakao Login**
2. Add the Supabase callback URL:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
3. Copy:
   - REST API key
   - Kakao Login Client Secret

In Supabase:
1. Open **Authentication > Providers**
2. Enable **Kakao**
3. Paste the REST API key as the client ID
4. Paste the Kakao client secret as the client secret
5. Add your deployed ProjectOS URL to allowed redirect URLs

## 3. App flow

The current `index.html` uses:

```js
supabase.auth.signInWithOAuth({
  provider: "kakao",
  options: { redirectTo: location.href.split("#")[0] }
})
```

Once Supabase is configured, the **Collaboration** page can:
- sign in with Kakao
- upload the current ProjectOS snapshot to Supabase
- load the snapshot from Supabase
- keep decision logs and activity timeline data inside the project snapshot
- keep local fallback behavior when Supabase is not configured

## 4. Collaboration model

ProjectOS is designed as a traceable collaboration OS, not a generic note app. The collaboration surface should preserve:
- Comments and mentions on project artifacts
- Decision logs with target type and target ID
- Activity timeline entries for requirement, task, test case, API, risk, and meeting changes
- Traceability health metrics such as Requirements covered by both Tasks and Test Cases

## 5. KakaoTalk invite/message

KakaoTalk message sending requires Kakao API permissions and user consent. Do not put Kakao admin keys or service role keys in `index.html`.

Use a server-side function for sending messages:

```text
supabase/functions/kakao-invite/index.ts
```

Required function environment variables:
- `KAKAO_REST_API_KEY`
- `PROJECTOS_APP_URL`

Message sending should remain queued until Kakao permissions are approved.
