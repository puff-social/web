import { APIGroup, APIResponse } from "../types/api";

const API_URL = typeof location != 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:9000' : 'https://rosin.puff.social';

export async function getGroups() {
  const req: APIResponse<APIGroup[]> = await fetch(`${API_URL}/v1/groups`).then(r => r.json());
  if ('error' in req) throw req.error;
  return req.data;
}

export async function getGroupById(id: string) {
  const req: APIResponse<APIGroup> = await fetch(`${API_URL}/v1/groups/${id}`).then(r => r.json());
  if ('error' in req) throw req.error;
  return req.data;
}