import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// Ensure cookies are sent with all fetch requests (same- and cross-origin).
const originalFetch = window.fetch
window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  originalFetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
  })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
