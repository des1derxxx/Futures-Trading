import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  AuthResponse,
  ProfileStats,
  TradesResponse,
  TournamentsResponse,
  TournamentDetailResponse,
  TournamentTradesResponse,
  AdminTournament,
  AdminParticipant,
  Trade,
  OpenTradeBody,
} from "./api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface CreateTournamentBody {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants?: number | null;
  prize_pool?: number | null;
  starting_balance?: number | null;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    document.cookie = "auth_token=; path=/; max-age=0";
    if (!window.location.pathname.startsWith("/auth")) {
      window.location.replace("/auth");
    }
  }
  return result;
};

export const tradingApi = createApi({
  reducerPath: "tradingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Trade", "Tournament", "Profile", "AdminTournament", "Me"],
  endpoints: (builder) => ({
    getMe: builder.query<
      AuthResponse["user"] & { is_admin?: boolean },
      void
    >({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),

    getProfile: builder.query<ProfileStats, void>({
      query: () => "/profile/stats",
      providesTags: ["Profile"],
    }),

    listTrades: builder.query<TradesResponse, number | undefined>({
      query: (tournamentId) =>
        tournamentId ? `/trades?tournament_id=${tournamentId}` : "/trades",
      providesTags: ["Trade"],
    }),

    openTrade: builder.mutation<
      { trade: Trade; balance: number; reserved_balance: number },
      OpenTradeBody
    >({
      query: (body) => ({ url: "/trades", method: "POST", body }),
      invalidatesTags: ["Trade"],
    }),

    closeTrade: builder.mutation<
      { trade: Trade; balance: number; reserved_balance: number },
      number
    >({
      query: (id) => ({ url: `/trades/${id}`, method: "DELETE" }),
      invalidatesTags: ["Trade"],
    }),

    listTournaments: builder.query<TournamentsResponse, void>({
      query: () => "/tournaments",
      providesTags: ["Tournament"],
    }),

    getTournament: builder.query<TournamentDetailResponse, number>({
      query: (id) => `/tournaments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Tournament", id }],
    }),

    joinTournament: builder.mutation<{ message: string }, number>({
      query: (id) => ({ url: `/tournaments/${id}/join`, method: "POST" }),
      invalidatesTags: ["Tournament"],
    }),

    getMyTournamentTrades: builder.query<TournamentTradesResponse, number>({
      query: (id) => `/tournaments/${id}/my-trades`,
      providesTags: ["Trade"],
    }),

    getUserTournamentTrades: builder.query<
      TournamentTradesResponse,
      { tournamentId: number; userId: number }
    >({
      query: ({ tournamentId, userId }) =>
        `/tournaments/${tournamentId}/participants/${userId}/trades`,
    }),

    getAdminTournaments: builder.query<
      { tournaments: AdminTournament[] },
      void
    >({
      query: () => "/admin/tournaments",
      providesTags: ["AdminTournament"],
    }),

    createTournament: builder.mutation<
      { tournament: AdminTournament },
      CreateTournamentBody
    >({
      query: (body) => ({ url: "/admin/tournaments", method: "POST", body }),
      invalidatesTags: ["AdminTournament"],
    }),

    updateTournament: builder.mutation<
      { tournament: AdminTournament },
      { id: number; body: Partial<CreateTournamentBody> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/tournaments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AdminTournament"],
    }),

    deleteTournament: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/tournaments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminTournament"],
    }),

    getAdminParticipants: builder.query<
      { tournament: AdminTournament; participants: AdminParticipant[] },
      number
    >({
      query: (id) => `/admin/tournaments/${id}/participants`,
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetProfileQuery,
  useListTradesQuery,
  useOpenTradeMutation,
  useCloseTradeMutation,
  useListTournamentsQuery,
  useGetTournamentQuery,
  useJoinTournamentMutation,
  useGetMyTournamentTradesQuery,
  useGetUserTournamentTradesQuery,
  useGetAdminTournamentsQuery,
  useCreateTournamentMutation,
  useUpdateTournamentMutation,
  useDeleteTournamentMutation,
  useGetAdminParticipantsQuery,
} = tradingApi;
