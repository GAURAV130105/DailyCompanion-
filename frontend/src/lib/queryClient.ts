import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Only retry network errors, never retry 4xx errors (404/PGRST205, 401, 429)
      retry: (failureCount, error: any) => {
        if (failureCount >= 1) return false;
        const msg = error?.message || '';
        const code = error?.code || '';
        if (
          code === 'PGRST205' ||
          msg.includes('schema cache') ||
          msg.includes('not found') ||
          msg.includes('rate limit') ||
          msg.includes('401') ||
          msg.includes('404')
        ) {
          return false;
        }
        return true;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
