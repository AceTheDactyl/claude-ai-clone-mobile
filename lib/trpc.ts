import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Using base URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback for development
  const fallbackUrl = 'http://localhost:3000';
  console.log('No EXPO_PUBLIC_RORK_API_BASE_URL found, using fallback:', fallbackUrl);
  return fallbackUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('tRPC fetch:', url, options?.method || 'GET');
        
        const maxRetries = 3;
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
              },
              // Add timeout for web
              ...(Platform.OS === 'web' && {
                signal: AbortSignal.timeout(10000), // 10 second timeout
              }),
            });
            
            console.log(`tRPC response (attempt ${attempt}):`, response.status);
            
            if (!response.ok) {
              console.error('tRPC fetch error:', response.status, response.statusText);
              
              // Don't retry on client errors (4xx)
              if (response.status >= 400 && response.status < 500) {
                throw new Error(`Client error: ${response.status} ${response.statusText}`);
              }
              
              // Retry on server errors (5xx) or network issues
              if (attempt === maxRetries) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
              }
              
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
              continue;
            }
            
            return response;
          } catch (error) {
            console.error(`tRPC fetch error (attempt ${attempt}):`, error);
            lastError = error as Error;
            
            if (attempt === maxRetries) {
              throw lastError;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          }
        }
        
        throw lastError || new Error('Max retries exceeded');
      },
    }),
  ],
});