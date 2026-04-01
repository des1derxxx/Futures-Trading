<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\TournamentParticipant;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TournamentController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth('api')->user();

        $tournaments = Tournament::withCount('participants')
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($t) use ($user) {
                $joined = TournamentParticipant::where('tournament_id', $t->id)
                    ->where('user_id', $user->id)
                    ->exists();
                return [
                    'id'                => $t->id,
                    'name'              => $t->name,
                    'description'       => $t->description,
                    'start_date'        => $t->start_date,
                    'end_date'          => $t->end_date,
                    'status'            => $t->status,
                    'max_participants'  => $t->max_participants,
                    'prize_pool'        => $t->prize_pool ? (float) $t->prize_pool : null,
                    'participants_count'=> $t->participants_count,
                    'joined'            => $joined,
                ];
            });

        // Check if user has any active tournament
        $activeParticipation = TournamentParticipant::where('user_id', $user->id)
            ->whereHas('tournament', fn($q) => $q->where('status', 'active'))
            ->exists();

        return response()->json([
            'tournaments'         => $tournaments,
            'has_active_tournament' => $activeParticipation,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = auth('api')->user();
        $tournament = Tournament::findOrFail($id);

        $participants = TournamentParticipant::with('user')
            ->where('tournament_id', $tournament->id)
            ->get();

        $leaderboard = $participants->map(function ($participant) use ($tournament) {
            $trades = Trade::where('user_id', $participant->user_id)
                ->where('opened_at', '>=', $participant->joined_at)
                ->where('opened_at', '>=', $tournament->start_date)
                ->where('opened_at', '<=', $tournament->end_date)
                ->whereIn('status', ['closed', 'liquidated'])
                ->get();

            $totalPnl   = round((float) $trades->sum('pnl'), 2);
            $tradeCount = $trades->count();
            $winners    = $trades->where('pnl', '>', 0)->count();
            $winRate    = $tradeCount > 0 ? round($winners / $tradeCount * 100, 1) : 0;

            return [
                'user_id'     => $participant->user_id,
                'user_name'   => $participant->user->name,
                'total_pnl'   => $totalPnl,
                'trade_count' => $tradeCount,
                'win_rate'    => $winRate,
                'joined_at'   => $participant->joined_at,
            ];
        })->sortByDesc('total_pnl')->values();

        $myParticipation = $participants->firstWhere('user_id', $user->id);

        return response()->json([
            'tournament'  => [
                'id'                => $tournament->id,
                'name'              => $tournament->name,
                'description'       => $tournament->description,
                'start_date'        => $tournament->start_date,
                'end_date'          => $tournament->end_date,
                'status'            => $tournament->status,
                'max_participants'  => $tournament->max_participants,
                'prize_pool'        => $tournament->prize_pool ? (float) $tournament->prize_pool : null,
                'starting_balance'  => (float) $tournament->starting_balance,
                'participants_count'=> $participants->count(),
            ],
            'leaderboard'                => $leaderboard,
            'joined'                     => $myParticipation !== null,
            'joined_at'                  => $myParticipation?->joined_at,
            'tournament_balance'         => $myParticipation ? (float) $myParticipation->tournament_balance : null,
            'tournament_reserved_balance'=> $myParticipation ? (float) $myParticipation->tournament_reserved_balance : null,
        ]);
    }

    public function join(int $id): JsonResponse
    {
        $user = auth('api')->user();
        $tournament = Tournament::findOrFail($id);

        if ($tournament->status !== 'active') {
            return response()->json(['message' => 'Турнир не активен'], 422);
        }

        // Check if user already joined this tournament
        $alreadyJoined = TournamentParticipant::where('tournament_id', $id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyJoined) {
            return response()->json(['message' => 'Вы уже участвуете в этом турнире'], 422);
        }

        // Check if user already has an active tournament
        $hasActiveTournament = TournamentParticipant::where('user_id', $user->id)
            ->whereHas('tournament', fn($q) => $q->where('status', 'active'))
            ->exists();

        if ($hasActiveTournament) {
            return response()->json(['message' => 'У вас уже есть активный турнир. Завершите его перед вступлением в новый.'], 422);
        }

        // Check max participants
        if ($tournament->max_participants !== null) {
            $count = TournamentParticipant::where('tournament_id', $id)->count();
            if ($count >= $tournament->max_participants) {
                return response()->json(['message' => 'Турнир заполнен'], 422);
            }
        }

        TournamentParticipant::create([
            'tournament_id'               => $id,
            'user_id'                     => $user->id,
            'joined_at'                   => Carbon::now(),
            'tournament_balance'          => (float) $tournament->starting_balance,
            'tournament_reserved_balance' => 0,
        ]);

        return response()->json(['message' => 'Вы успешно вступили в турнир']);
    }

    public function myTrades(int $id): JsonResponse
    {
        $user = auth('api')->user();
        return $this->participantTrades($id, $user->id);
    }

    public function userTrades(int $id, int $userId): JsonResponse
    {
        // Any tournament participant can view other participants' trades
        $viewer = auth('api')->user();
        $viewerParticipates = TournamentParticipant::where('tournament_id', $id)
            ->where('user_id', $viewer->id)
            ->exists();

        if (!$viewerParticipates) {
            return response()->json(['message' => 'Вы не участвуете в этом турнире'], 403);
        }

        return $this->participantTrades($id, $userId);
    }

    private function participantTrades(int $tournamentId, int $userId): JsonResponse
    {
        $tournament = Tournament::findOrFail($tournamentId);

        $participation = TournamentParticipant::where('tournament_id', $tournamentId)
            ->where('user_id', $userId)
            ->first();

        if (!$participation) {
            return response()->json(['message' => 'Участник не найден в турнире'], 404);
        }

        $trades = Trade::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->orderByDesc('opened_at')
            ->get();

        $closed   = $trades->whereIn('status', ['closed', 'liquidated']);
        $totalPnl = round((float) $closed->sum('pnl'), 2);
        $winners  = $closed->where('pnl', '>', 0)->count();
        $winRate  = $closed->count() > 0 ? round($winners / $closed->count() * 100, 1) : 0;

        return response()->json([
            'trades' => $trades->values(),
            'stats'  => [
                'total_pnl'    => $totalPnl,
                'trade_count'  => $trades->count(),
                'closed_count' => $closed->count(),
                'open_count'   => $trades->where('status', 'open')->count(),
                'win_rate'     => $winRate,
            ],
        ]);
    }
}
