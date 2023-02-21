// import { APIGroup, APIResponse } from "../types/api";

export const API_URL = typeof location != 'undefined' && ['localhost', '127.0.0.1', 'dev.puff.social'].includes(location.hostname) ? (location.hostname == 'dev.puff.social' ? 'https://kief.puff.social' : 'http://127.0.0.1:8000') : 'https://hash.puff.social';

export async function sendFeedback(content: string) {
  await fetch(`${API_URL}/v1/feedback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: content }) });
}
