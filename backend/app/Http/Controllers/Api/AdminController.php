<?php

namespace App\Http\Controllers\Api;

use App\Events\TournamentEnded;
use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\TournamentParticipant;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function checkAdmin(): bool
    {
        return (bool) auth('api')->user()?->is_admin;
    }

    public function tournaments(): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tournaments = Tournament::withCount('participants')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['tournaments' => $tournaments]);
    }

    public function storeTournament(Request $request): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'description'       => 'nullable|string',
            'start_date'        => 'required|date',
            'end_date'          => 'required|date|after:start_date',
            'status'            => 'required|in:upcoming,active,finished',
            'max_participants'  => 'nullable|integer|min:2',
            'prize_pool'        => 'nullable|numeric|min:0',
            'starting_balance'  => 'nullable|numeric|min:100',
        ]);

        $tournament = Tournament::create($data);

        return response()->json(['tournament' => $tournament], 201);
    }

    public function updateTournament(Request $request, int $id): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tournament = Tournament::findOrFail($id);

        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'start_date'       => 'sometimes|date',
            'end_date'         => 'sometimes|date',
            'status'           => 'sometimes|in:upcoming,active,finished',
            'max_participants' => 'nullable|integer|min:2',
            'prize_pool'       => 'nullable|numeric|min:0',
            'starting_balance' => 'nullable|numeric|min:100',
        ]);

        $wasFinished = $tournament->status === 'finished';
        $tournament->update($data);

        if (!$wasFinished && $tournament->status === 'finished') {
            broadcast(new TournamentEnded($tournament));
        }

        return response()->json(['tournament' => $tournament]);
    }

    public function deleteTournament(int $id): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        Tournament::findOrFail($id)->delete();

        return response()->json(['message' => 'Турнир удалён']);
    }

    public function participants(int $id): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tournament = Tournament::findOrFail($id);

        $participants = TournamentParticipant::with('user')
            ->where('tournament_id', $id)
            ->get()
            ->map(function ($participant) use ($tournament) {
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
                    'participant_id' => $participant->id,
                    'user_id'        => $participant->user_id,
                    'user_name'      => $participant->user->name,
                    'user_email'     => $participant->user->email,
                    'joined_at'      => $participant->joined_at,
                    'total_pnl'      => $totalPnl,
                    'trade_count'    => $tradeCount,
                    'win_rate'       => $winRate,
                ];
            })
            ->sortByDesc('total_pnl')
            ->values();

        return response()->json([
            'tournament'   => $tournament,
            'participants' => $participants,
        ]);
    }

    public function setAdmin(Request $request, int $userId): JsonResponse
    {
        if (!$this->checkAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate(['is_admin' => 'required|boolean']);

        \App\Models\User::findOrFail($userId)->update(['is_admin' => $data['is_admin']]);

        return response()->json(['message' => 'Обновлено']);
    }
}
