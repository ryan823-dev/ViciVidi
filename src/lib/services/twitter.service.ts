import crypto from "crypto";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const TWITTER_API_BASE = "https://api.twitter.com/2";
const TWITTER_AUTH_BASE = "https://twitter.com/i/oauth2";

export type TwitterTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type TwitterUserInfo = {
  id: string;
  username: string;
  name: string;
};

export type TwitterPublishResult = {
  tweetId: string;
};

// --- PKCE Helpers ---

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

// --- OAuth ---

export function getAuthUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`;
  const scopes = "tweet.read tweet.write users.read offline.access";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TWITTER_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Twitter OAuth error: ${data.error_description || data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Twitter refresh error: ${data.error_description || data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// --- API Calls ---

export async function getUserInfo(accessToken: string): Promise<TwitterUserInfo> {
  const res = await fetch(`${TWITTER_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();

  if (data.errors) {
    throw new Error(`Twitter user info error: ${data.errors[0]?.message}`);
  }

  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
  };
}

export async function publishTweet(params: {
  accessToken: string;
  text: string;
}): Promise<TwitterPublishResult> {
  if (isDemoMode) {
    return { tweetId: `demo_tw_${Date.now()}` };
  }

  if (params.text.length > 280) {
    throw new Error("Tweet exceeds 280 character limit");
  }

  const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: params.text }),
  });

  const data = await res.json();

  if (data.errors) {
    throw new Error(`Twitter publish error: ${data.errors[0]?.message}`);
  }

  if (res.status === 429) {
    throw new Error("Twitter rate limit reached. Please try again later.");
  }

  if (!res.ok) {
    throw new Error(`Twitter publish failed with status ${res.status}`);
  }

  return { tweetId: data.data.id };
}

export async function refreshTokenIfNeeded(account: {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
}): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date } | null> {
  if (!account.accessToken || !account.refreshToken) return null;

  // Twitter tokens expire in ~2 hours, refresh if expiring within 30 minutes
  if (account.expiresAt) {
    const thirtyMinFromNow = new Date(Date.now() + 30 * 60 * 1000);
    if (account.expiresAt > thirtyMinFromNow) return null;
  }

  try {
    const result = await refreshAccessToken(account.refreshToken);
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt,
    };
  } catch (error) {
    console.warn('[refreshTwitterToken] Token refresh failed:', error);
    return null;
  }
}
