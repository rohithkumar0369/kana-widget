import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // cacheTime: 1000 * 60 * 60 * 24, // 24 hours
            suspense: false,
            retry: false, // No retry mode for the demo
        },
    },
});
