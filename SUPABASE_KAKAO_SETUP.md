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
- keep Kakao login separate from workspace membership
- join a workspace only through an invite code/link or a queued KakaoTalk invite
- create a server-ready workspace row and owner membership during upload
- upload the current ProjectOS snapshot to Supabase
- load the snapshot from Supabase
- save snapshot versions for audit/history
- keep decision logs and activity timeline data inside the project snapshot
- block Viewer users from editing project artifacts in the client
- keep local fallback behavior when Supabase is not configured

Recommended product rule:
- Kakao Login identifies the person.
- Workspace invite code/link grants project access.
- KakaoTalk is only a delivery channel for the invite link/message.
- A user should not join a project automatically just because they logged in with Kakao.

## 4. Collaboration model

ProjectOS is designed as a traceable collaboration OS, not a generic note app. The collaboration surface should preserve:
- Comments and mentions on project artifacts
- Decision logs with target type and target ID
- Activity timeline entries for requirement, task, test case, API, risk, and meeting changes
- Traceability health metrics such as Requirements covered by both Tasks and Test Cases
- Production Readiness checks for backend, auth, role model, audit trail, release readiness, and GitHub evidence

Practical production rule:
- Owner and Manager can manage workspace members.
- Owner, Manager, and Member can edit project artifacts.
- Viewer can read but should not edit artifacts.
- Server RLS is the source of truth; client-side button guards are only a UX layer.

## 5. KakaoTalk invite/message

KakaoTalk message sending requires Kakao API permissions and user consent. Do not put Kakao admin keys or service role keys in `index.html`.

Use a server-side function for sending messages:

```text
supabase/functions/kakao-invite/index.ts
```

Required function environment variables:
- `KAKAO_REST_API_KEY`
- `PROJECTOS_APP_URL`

Message sending remains queued until:
- Supabase Kakao login is configured
- Kakao `talk_message` consent is approved
- Receiver UUIDs are obtained through Kakao Friends picker or friends list API
- `Kakao Message Function URL` is set in ProjectOS Settings

The browser calls the Edge Function with the signed-in user's Kakao provider access token. Do not expose Kakao admin keys or Supabase service role keys in `index.html`.

## 6. GitHub private repo/write access

ProjectOS can read public GitHub repositories directly from the browser. For private repositories or write actions such as creating issues, use the Edge Function:

```text
supabase/functions/github-proxy/index.ts
```

Recommended production setup:
- Create a GitHub App with repository-scoped permissions.
- Use short-lived GitHub App installation tokens in the server function.
- Do not store GitHub tokens in `localStorage`.
- Set the deployed function URL in ProjectOS Settings as `GitHub API Function URL`.

MVP/testing setup:
- Create a fine-grained GitHub token with the minimum required repository permissions.
- Store it as a Supabase secret named `GITHUB_TOKEN`.
- Deploy `github-proxy`.

Supported proxy operations:
- Read repository metadata
- Read issues
- Read pull requests
- Read commits
- Create issues

ProjectOS client features:
- Load private/public repo through the proxy
- Create GitHub Issues from ProjectOS Tasks
- Sync linked PR state back to Task status
- Auto-link commits whose first line contains a Task ID such as `TASK-001`
