import { createCipheriv, createHash } from "crypto";
import {
  APIResponse,
  LeaderboardEntry,
  DiagData,
  User,
  DeviceInformation,
  Connection,
} from "../types/api";

export const API_URL =
  (typeof location != "undefined" &&
    ["localhost", "dev.puff.social"].includes(location.hostname)) ||
  process.env.DEV == "1"
    ? typeof location != "undefined" && location.hostname == "beta.puff.social"
      ? "https://hash.puff.social"
      : "http://127.0.0.1:8000"
    : "https://hash.puff.social";

function signRequest<T>(body: T): [string, string] {
  const signature = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("base64");
  const key = Buffer.from(process.env.NEXT_PUBLIC_METRICS_KEY);
  const iv = Buffer.alloc(16, 0);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let enc = cipher.update(JSON.stringify(body), "utf-8", "base64");
  enc += cipher.final("base64");

  return [signature, enc];
}

export async function sendFeedback(content: string) {
  const [signature, body] = signRequest({ message: content });
  await fetch(`${API_URL}/v1/feedback`, {
    method: "POST",
    headers: { "content-type": "text/plain", "x-signature": signature },
    body,
  });
}

export async function getLeaderboard() {
  return (await fetch(`${API_URL}/v1/leaderboard?limit=10`).then((r) =>
    r.json()
  )) as APIResponse<{ leaderboards: LeaderboardEntry[] }>;
}

export async function trackDevice(device: Partial<DeviceInformation>) {
  const [signature, body] = signRequest({ device, name: "unset" });
  const req = await fetch(`${API_URL}/v1/track`, {
    method: "POST",
    headers: {
      "content-type": "text/plain",
      "x-signature": signature,
      ...(localStorage.getItem("puff-social-auth")
        ? { authorization: localStorage.getItem("puff-social-auth") }
        : {}),
    },
    body,
  });
  return (await req.json()) as APIResponse<{
    device: LeaderboardEntry;
    position: number;
  }>;
}

export async function trackDiags(data: DiagData) {
  const [signature, body] = signRequest(data);
  fetch(`${API_URL}/v1/diag`, {
    method: "POST",
    headers: {
      "content-type": "text/plain",
      "x-signature": signature,
      ...(localStorage.getItem("puff-social-auth")
        ? { authorization: localStorage.getItem("puff-social-auth") }
        : {}),
    },
    body,
  });
}

export async function getLeaderboardDevice(id: string) {
  const req = await fetch(
    `${API_URL}/v1/device/${id.startsWith("device") ? id : `device_${id}`}`
  );
  if (req.status != 200) throw { code: "device_not_found" };
  return (await req.json()) as APIResponse<{
    device: LeaderboardEntry;
    position: number;
  }>;
}

export async function getDiscordOAuth() {
  const req = await fetch(`${API_URL}/v1/oauth/discord`);
  if (req.status != 200) throw { code: "invalid_oauth" };
  return (await req.json()) as APIResponse<{ url: string }>;
}

export async function callbackDiscordOAuth(code: string, state: string) {
  const req = await fetch(
    `${API_URL}/v1/oauth/discord?code=${code}&state=${state}`,
    { method: "POST" }
  );
  if (req.status != 200) throw { code: "invalid_oauth_state" };
  return (await req.json()) as APIResponse<{
    user: User;
    connection: Connection;
    token: string;
  }>;
}

export async function getCurrentUser() {
  const req = await fetch(`${API_URL}/v1/user`, {
    headers: { authorization: localStorage.getItem("puff-social-auth") },
  });
  if (req.status == 403) {
    const json: { error: boolean; code: string } = await req.json();
    if ("code" in json && json.code == "user_suspended")
      throw { code: json.code };
  }
  if (req.status != 200) throw { code: "invalid_authentication" };
  return (await req.json()) as APIResponse<{
    user: User;
    connection: Connection;
  }>;
}

export async function loginWithPuffco(email: string, password: string) {
  const req = await fetch(`${API_URL}/v1/auth/puffco`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (req.status != 200)
    throw {
      code: "invalid_auth",
      data: await req
        .json()
        .then((r) => r)
        .catch(() => null),
    };
  return (await req.json()) as APIResponse<{
    user: User;
    connection: Connection;
    token: string;
  }>;
}

export async function updateUser(object: Partial<User>) {
  const req = await fetch(`${API_URL}/v1/user`, {
    method: "PATCH",
    headers: {
      ...(localStorage.getItem("puff-social-auth")
        ? { authorization: localStorage.getItem("puff-social-auth") }
        : {}),
      "content-type": "application/json",
    },
    body: JSON.stringify(object),
  });
  if (req.status != 200) throw { code: "invalid_user_patch" };
  return (await req.json()) as APIResponse<{ user: User }>;
}
