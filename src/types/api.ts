export interface APIResponse<T> {
  data: T;
  error?: {
    code: string;
    message?: string;
    issues?: any;
  },
  success: boolean;
}

export interface APIGroup {
  group_id: string;
  member_count: number;
  name: string;
  visibility: string;
  state: string;
}
