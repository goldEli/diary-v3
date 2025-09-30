import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import { User } from '@/types';

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export function useAuth() {
  const { data, error, mutate } = useSWR<{ user: User }>('/auth/profile', fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  const isLoading = !data && !error;
  const isLoggedIn = !!data?.user;
  const user = data?.user;

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      mutate(undefined, false);
      window.location.href = '/auth/login';
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn,
    error,
    logout,
    mutate,
  };
}