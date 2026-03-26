const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export interface AuthResponse {
  token: string
  token_type: string
  expires_in: number
  user: {
    id: number
    name: string
    email: string
    balance: string
    reserved_balance: string
  }
}

export interface ApiError {
  message?: string
  errors?: Record<string, string[]>
}

export interface Trade {
  id: number
  symbol: string
  direction: 'long' | 'short'
  margin: number
  leverage: number
  position_size: number
  entry_price: number
  liquidation_price: number
  stop_loss: number | null
  take_profit: number | null
  close_price: number | null
  pnl: number | null
  status: 'open' | 'closed' | 'liquidated'
  close_reason: 'manual' | 'stop_loss' | 'take_profit' | 'liquidation' | null
  opened_at: string
  closed_at: string | null
}

export interface TradesResponse {
  trades: Trade[]
  balance: number
  reserved_balance: number
}

export interface ProfileStats {
  user: {
    id: number
    name: string
    email: string
    balance: number
    reserved_balance: number
  }
  stats: {
    total_trades: number
    open_trades: number
    closed_trades: number
    liquidations: number
    winners: number
    losers: number
    win_rate: number
    total_pnl: number
    total_volume: number
    avg_leverage: number
    long_count: number
    short_count: number
    best_trade_pnl: number | null
    worst_trade_pnl: number | null
    max_win_streak: number
    avg_pnl: number
  }
  trades: Trade[]
}

export interface OpenTradeBody {
  direction: 'long' | 'short'
  margin: number
  leverage: number
  take_profit?: number | null
  stop_loss?: number | null
  symbol?: string
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) throw data as ApiError

  return data as T
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    ...options,
  })

  const data = await res.json()

  if (!res.ok) throw data as ApiError

  return data as T
}

export const api = {
  register: (body: { name: string; email: string; password: string; password_confirmation: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => authRequest<AuthResponse['user']>('/auth/me'),

  profile: () => authRequest<ProfileStats>('/profile/stats'),

  trades: {
    list: () => authRequest<TradesResponse>('/trades'),
    open: (body: OpenTradeBody) =>
      authRequest<{ trade: Trade; balance: number; reserved_balance: number }>('/trades', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    close: (id: number) =>
      authRequest<{ trade: Trade; balance: number; reserved_balance: number }>(`/trades/${id}`, {
        method: 'DELETE',
      }),
  },
}
