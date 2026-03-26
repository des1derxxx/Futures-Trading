<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $user = auth('api')->user();

        $trades = $user->trades()
            ->orderByDesc('opened_at')
            ->get();

        return response()->json([
            'trades'            => $trades,
            'balance'           => (float) $user->balance,
            'reserved_balance'  => (float) $user->reserved_balance,
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $data = $request->validate([
            'symbol'      => 'sometimes|string|max:20',
            'direction'   => 'required|in:long,short',
            'margin'      => 'required|numeric|min:1',
            'leverage'    => 'required|integer|min:1|max:125',
            'take_profit' => 'nullable|numeric|min:0',
            'stop_loss'   => 'nullable|numeric|min:0',
        ]);

        $user  = auth('api')->user();
        $price = $this->priceService->getPrice();

        if ($price === null) {
            return response()->json(['message' => 'Цена недоступна, попробуйте позже.'], 503);
        }

        $data['entry_price'] = $price;
        $data['symbol']      = strtoupper($data['symbol'] ?? 'BTCUSDT');

        try {
            $trade = $this->positionService->open($user, $data);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
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
        $price = $this->priceService->getPrice();

        if ($price === null) {
            return response()->json(['message' => 'Цена недоступна.'], 503);
        }

        $trade = $this->positionService->close($trade, $price, 'manual');
        $user->refresh();

        return response()->json([
            'trade'            => $trade,
            'balance'          => (float) $user->balance,
            'reserved_balance' => (float) $user->reserved_balance,
        ]);
    }
}
