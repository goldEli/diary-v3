import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import { Diary, QueryDiaryParams, PaginatedResponse, CreateDiaryData, UpdateDiaryData } from '@/types';

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export function useDiaries(params?: QueryDiaryParams) {
  const queryString = params ? new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString() : '';

  const url = `/diaries${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, mutate } = useSWR<PaginatedResponse<Diary>>(url, fetcher);

  const isLoading = !data && !error;

  console.log("服务端返回的数据结构:", data)

  return {
    diaries: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || Math.ceil((data?.total || 0) / (data?.limit || 10)),
    isLoading,
    error,
    mutate,
  };
}

export function useDiary(id: string) {
  const { data, error, mutate } = useSWR<Diary>(
    id ? `/diaries/${id}` : null,
    fetcher
  );

  const isLoading = !data && !error;

  return {
    diary: data,
    isLoading,
    error,
    mutate,
  };
}

export async function createDiary(data: CreateDiaryData) {
  const response = await apiClient.post<Diary>('/diaries', data);
  return response.data;
}

export async function updateDiary(id: string, data: UpdateDiaryData) {
  const response = await apiClient.patch<Diary>(`/diaries/${id}`, data);
  return response.data;
}

export async function deleteDiary(id: string) {
  await apiClient.delete(`/diaries/${id}`);
}