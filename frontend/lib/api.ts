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
    is_admin?: boolean
  }
}

export interface ApiError {
  message?: string
  errors?: Record<string, string[]>
}

export interface Trade {
  id: number
  tournament_id: number | null
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
  tournament_id?: number | null
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

export interface Tournament {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: 'upcoming' | 'active' | 'finished'
  max_participants: number | null
  prize_pool: number | null
  participants_count: number
  joined: boolean
}

export interface TournamentsResponse {
  tournaments: Tournament[]
  has_active_tournament: boolean
}

export interface LeaderboardEntry {
  user_id: number
  user_name: string
  total_pnl: number
  trade_count: number
  win_rate: number
  joined_at: string
}

export interface TournamentDetailResponse {
  tournament: Omit<Tournament, 'joined'> & { starting_balance: number }
  leaderboard: LeaderboardEntry[]
  joined: boolean
  joined_at: string | null
  tournament_balance: number | null
  tournament_reserved_balance: number | null
}

export interface TournamentTradesResponse {
  trades: Trade[]
  stats: {
    total_pnl: number
    trade_count: number
    closed_count: number
    open_count: number
    win_rate: number
  }
}

export interface AdminParticipant {
  participant_id: number
  user_id: number
  user_name: string
  user_email: string
  joined_at: string
  total_pnl: number
  trade_count: number
  win_rate: number
}

export interface AdminTournament extends Omit<Tournament, 'joined'> {
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  user_id: number
  user_name: string
  message: string
  created_at: string
}

export const api = {
  register: (body: { name: string; email: string; password: string; password_confirmation: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => authRequest<AuthResponse['user'] & { is_admin?: boolean }>('/auth/me'),

  profile: () => authRequest<ProfileStats>('/profile/stats'),

  trades: {
    list: (tournamentId?: number) =>
      authRequest<TradesResponse>(tournamentId ? `/trades?tournament_id=${tournamentId}` : '/trades'),
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

  tournaments: {
    list: () => authRequest<TournamentsResponse>('/tournaments'),
    get: (id: number) => authRequest<TournamentDetailResponse>(`/tournaments/${id}`),
    join: (id: number) => authRequest<{ message: string }>(`/tournaments/${id}/join`, { method: 'POST' }),
    myTrades: (id: number) => authRequest<TournamentTradesResponse>(`/tournaments/${id}/my-trades`),
    userTrades: (id: number, userId: number) =>
      authRequest<TournamentTradesResponse>(`/tournaments/${id}/participants/${userId}/trades`),
  },

  chat: {
    messages: () => authRequest<{ messages: ChatMessage[] }>('/chat/messages'),
    send: (message: string) =>
      authRequest<ChatMessage>('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },

  admin: {
    tournaments: () => authRequest<{ tournaments: AdminTournament[] }>('/admin/tournaments'),
    createTournament: (body: {
      name: string
      description?: string
      start_date: string
      end_date: string
      status: string
      max_participants?: number | null
      prize_pool?: number | null
    }) => authRequest<{ tournament: AdminTournament }>('/admin/tournaments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    updateTournament: (id: number, body: Partial<{
      name: string
      description: string
      start_date: string
      end_date: string
      status: string
      max_participants: number | null
      prize_pool: number | null
    }>) => authRequest<{ tournament: AdminTournament }>(`/admin/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
    deleteTournament: (id: number) =>
      authRequest<{ message: string }>(`/admin/tournaments/${id}`, { method: 'DELETE' }),
    participants: (id: number) =>
      authRequest<{ tournament: AdminTournament; participants: AdminParticipant[] }>(`/admin/tournaments/${id}/participants`),
  },
}
