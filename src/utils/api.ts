import { APIGroup, APIResponse } from "../types/api";

export const API_URL = typeof location != 'undefined' && ['localhost', 'dev.puff.social'].includes(location.hostname) ? (location.hostname == 'dev.puff.social' ? 'https://flower.puff.social' : 'http://127.0.0.1:9000') : process.env.DEV == '1' ? 'http://127.0.0.1:9000' : 'https://rosin.puff.social';

export async function getGroups() {
  const req: APIResponse<APIGroup[]> = await fetch(`${API_URL}/v1/groups`).then(r => r.json());
  if ('error' in req) throw req.error;
  return req.data;
}

export async function getGroupById(id: string) {
  const req = await fetch(`${API_URL}/v1/groups/${id}`);;
  const body: APIResponse<APIGroup> = await req.json();
  if (req.status != 200) throw { code: 'not_found' };
  if ('error' in req) throw req.error;
  return body.data;
}