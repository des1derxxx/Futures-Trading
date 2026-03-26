<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function stats(): JsonResponse
    {
        $user   = auth('api')->user();
        $trades = $user->trades()->orderByDesc('opened_at')->get();

        $closed      = $trades->whereIn('status', ['closed', 'liquidated']);
        $open        = $trades->where('status', 'open');
        $withPnl     = $closed->whereNotNull('pnl');
        $winners     = $withPnl->where('pnl', '>', 0);
        $losers      = $withPnl->where('pnl', '<', 0);
        $liquidated  = $trades->where('status', 'liquidated');

        $totalPnl    = $withPnl->sum('pnl');
        $totalVolume = $trades->sum('position_size');
        $winRate     = $closed->count() > 0
            ? round($winners->count() / $closed->count() * 100, 1)
            : 0;

        $bestTrade  = $withPnl->sortByDesc('pnl')->first();
        $worstTrade = $withPnl->sortBy('pnl')->first();

        $avgLeverage = $trades->count() > 0
            ? round($trades->avg('leverage'), 1)
            : 0;

        $longCount  = $trades->where('direction', 'long')->count();
        $shortCount = $trades->where('direction', 'short')->count();

        // Longest win streak
        $streak    = 0;
        $maxStreak = 0;
        foreach ($closed->sortBy('closed_at') as $t) {
            if ($t->pnl > 0) {
                $streak++;
                $maxStreak = max($maxStreak, $streak);
            } else {
                $streak = 0;
            }
        }

        return response()->json([
            'user' => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'balance'          => (float) $user->balance,
                'reserved_balance' => (float) $user->reserved_balance,
            ],
            'stats' => [
                'total_trades'      => $trades->count(),
                'open_trades'       => $open->count(),
                'closed_trades'     => $closed->count(),
                'liquidations'      => $liquidated->count(),
                'winners'           => $winners->count(),
                'losers'            => $losers->count(),
                'win_rate'          => $winRate,
                'total_pnl'         => round((float) $totalPnl, 2),
                'total_volume'      => round((float) $totalVolume, 2),
                'avg_leverage'      => $avgLeverage,
                'long_count'        => $longCount,
                'short_count'       => $shortCount,
                'best_trade_pnl'    => $bestTrade  ? round((float) $bestTrade->pnl, 2)  : null,
                'worst_trade_pnl'   => $worstTrade ? round((float) $worstTrade->pnl, 2) : null,
                'max_win_streak'    => $maxStreak,
                'avg_pnl'           => $closed->count() > 0 ? round((float) $totalPnl / $closed->count(), 2) : 0,
            ],
            'trades' => $trades->values(),
        ]);
    }
}
