// import { APIGroup, APIResponse } from "../types/api";

const API_URL = typeof location != 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8000' : 'https://hash.puff.social';

export async function sendFeedback(content: string) {
  await fetch(`${API_URL}/v1/feedback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: content }) });
}
