import api from './axios';

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export async function getCategories(): Promise<CategoryResponse[]> {
  const { data } = await api.get<CategoryResponse[]>('/api/v1/categories');
  return data;
}
