<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\TournamentParticipant;
use App\Services\BinancePriceService;
use App\Services\PositionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TradeController extends Controller
{
    public function __construct(
        private readonly PositionService $positionService,
        private readonly BinancePriceService $priceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user         = auth('api')->user();
        $tournamentId = $request->query('tournament_id');

        $query = $user->trades()->orderByDesc('opened_at');

        if ($tournamentId) {
            $query->where('tournament_id', $tournamentId);

            $participant = TournamentParticipant::where('tournament_id', $tournamentId)
                ->where('user_id', $user->id)
                ->first();

            return response()->json([
                'trades'           => $query->get(),
                'balance'          => $participant ? (float) $participant->tournament_balance : 0,
                'reserved_balance' => $participant ? (float) $participant->tournament_reserved_balance : 0,
            ]);
        }

        return response()->json([
            'trades'           => $query->whereNull('tournament_id')->get(),
            'balance'          => (float) $user->balance,
            'reserved_balance' => (float) $user->reserved_balance,
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $supported = implode(',', \App\Services\BinancePriceService::SUPPORTED_SYMBOLS);

        $data = $request->validate([
            'symbol'        => "sometimes|string|in:{$supported}",
            'direction'     => 'required|in:long,short',
            'margin'        => 'required|numeric|min:1',
            'leverage'      => 'required|integer|min:1|max:125',
            'take_profit'   => 'nullable|numeric|min:0',
            'stop_loss'     => 'nullable|numeric|min:0',
            'tournament_id' => 'nullable|integer|exists:tournaments,id',
        ]);

        $symbol = strtoupper($data['symbol'] ?? 'BTCUSDT');
        $user   = auth('api')->user();
        $price  = $this->priceService->getPrice($symbol);

        if ($price === null) {
            return response()->json(['message' => 'Цена недоступна, попробуйте позже.'], 503);
        }

        $data['entry_price'] = $price;
        $data['symbol']      = $symbol;

        $participant = null;
        if (!empty($data['tournament_id'])) {
            $tournament = Tournament::find($data['tournament_id']);

            if ($tournament->status !== 'active') {
                return response()->json(['message' => 'Турнир не активен.'], 422);
            }

            $participant = TournamentParticipant::where('tournament_id', $data['tournament_id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$participant) {
                return response()->json(['message' => 'Вы не участвуете в этом турнире.'], 403);
            }
        }

        try {
            $trade = $this->positionService->open($user, $data, $participant);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($participant) {
            $participant->refresh();
            return response()->json([
                'trade'            => $trade,
                'balance'          => (float) $participant->tournament_balance,
                'reserved_balance' => (float) $participant->tournament_reserved_balance,
            ], 201);
        }

        $user->refresh();
        return response()->json([
            'trade'            => $trade,
            'balance'          => (float) $user->balance,
            'reserved_balance' => (float) $user->reserved_balance,
        ], 201);
    }

    public function close(Request $request, int $id): JsonResponse
    {
        $user  = auth('api')->user();
        $trade = $user->trades()->where('status', 'open')->findOrFail($id);
        $tradeSymbol = $trade->symbol ?? 'BTCUSDT';
        // Always fetch a fresh price when closing to avoid stale-cache PnL = 0
        $price = $this->priceService->fetchAndCachePrice($tradeSymbol) ?? $this->priceService->getCachedPrice($tradeSymbol);

        if ($price === null) {
            return response()->json(['message' => 'Цена недоступна.'], 503);
        }

        $trade = $this->positionService->close($trade, $price, 'manual');

        if ($trade->tournament_id) {
            $participant = TournamentParticipant::where('tournament_id', $trade->tournament_id)
                ->where('user_id', $user->id)
                ->first();
            return response()->json([
                'trade'            => $trade,
                'balance'          => $participant ? (float) $participant->tournament_balance : 0,
                'reserved_balance' => $participant ? (float) $participant->tournament_reserved_balance : 0,
            ]);
        }

        $user->refresh();
        return response()->json([
            'trade'            => $trade,
            'balance'          => (float) $user->balance,
            'reserved_balance' => (float) $user->reserved_balance,
        ]);
    }
}
