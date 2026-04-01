<?php

namespace App\Services;

use App\Events\TradeUpdated;
use App\Models\Trade;
use App\Models\TournamentParticipant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PositionService
{
    public function open(User $user, array $data, ?TournamentParticipant $participant = null): Trade
    {
        $margin       = (float) $data['margin'];
        $leverage     = (int)   $data['leverage'];
        $direction    = $data['direction'];
        $symbol       = strtoupper($data['symbol'] ?? 'BTCUSDT');
        $entryPrice   = (float) $data['entry_price'];
        $positionSize = $margin * $leverage;

        if ($participant) {
            if ((float) $participant->tournament_balance < $margin) {
                throw new \RuntimeException('Недостаточно средств в турнире.');
            }
        } else {
            if ((float) $user->balance < $margin) {
                throw new \RuntimeException('Недостаточно средств на балансе.');
            }
        }

        $liquidationPrice = $this->calcLiquidationPrice($direction, $entryPrice, $leverage);

        $trade = DB::transaction(function () use (
            $user, $participant, $margin, $leverage, $direction,
            $symbol, $entryPrice, $positionSize, $liquidationPrice, $data
        ) {
            if ($participant) {
                $participant->decrement('tournament_balance', $margin);
                $participant->increment('tournament_reserved_balance', $margin);
            } else {
                $user->decrement('balance', $margin);
                $user->increment('reserved_balance', $margin);
            }

            return Trade::create([
                'user_id'           => $user->id,
                'tournament_id'     => $participant?->tournament_id,
                'symbol'            => $symbol,
                'direction'         => $direction,
                'margin'            => $margin,
                'leverage'          => $leverage,
                'position_size'     => $positionSize,
                'entry_price'       => $entryPrice,
                'liquidation_price' => $liquidationPrice,
                'stop_loss'         => isset($data['stop_loss']) && $data['stop_loss'] ? (float) $data['stop_loss'] : null,
                'take_profit'       => isset($data['take_profit']) && $data['take_profit'] ? (float) $data['take_profit'] : null,
                'status'            => 'open',
                'opened_at'         => now(),
            ]);
        });

        $trade->load('user');
        $this->broadcast($trade);

        return $trade;
    }

    public function close(Trade $trade, float $closePrice, string $reason): Trade
    {
        $trade = DB::transaction(function () use ($trade, $closePrice, $reason) {
            $trade->refresh();

            if ($trade->status !== 'open') {
                return $trade;
            }

            $pnl    = $this->calcPnl($trade, $closePrice);
            $margin = (float) $trade->margin;
            $payout = $reason === 'liquidation' ? 0 : max(0, $margin + $pnl);

            if ($trade->tournament_id) {
                $participant = TournamentParticipant::where('tournament_id', $trade->tournament_id)
                    ->where('user_id', $trade->user_id)
                    ->lockForUpdate()
                    ->first();

                if ($participant) {
                    $participant->decrement('tournament_reserved_balance', $margin);
                    if ($payout > 0) {
                        $participant->increment('tournament_balance', $payout);
                    }
                }
            } else {
                $user = User::lockForUpdate()->find($trade->user_id);
                $user->decrement('reserved_balance', $margin);
                if ($payout > 0) {
                    $user->increment('balance', $payout);
                }
            }

            $trade->update([
                'status'       => $reason === 'liquidation' ? 'liquidated' : 'closed',
                'close_reason' => $reason,
                'close_price'  => $closePrice,
                'pnl'          => $pnl,
                'closed_at'    => now(),
            ]);

            return $trade;
        });

        $trade->load('user');
        $this->broadcast($trade);

        return $trade;
    }

    public function checkPositions(string $symbol, float $currentPrice): void
    {
        $trades = Trade::where('symbol', $symbol)
            ->where('status', 'open')
            ->get();

        foreach ($trades as $trade) {
            $direction = $trade->direction;
            $liqPrice  = (float) $trade->liquidation_price;
            $tp        = $trade->take_profit ? (float) $trade->take_profit : null;
            $sl        = $trade->stop_loss   ? (float) $trade->stop_loss   : null;

            if ($direction === 'long') {
                if ($currentPrice <= $liqPrice) {
                    $this->close($trade, $currentPrice, 'liquidation');
                } elseif ($tp !== null && $currentPrice >= $tp) {
                    $this->close($trade, $currentPrice, 'take_profit');
                } elseif ($sl !== null && $currentPrice <= $sl) {
                    $this->close($trade, $currentPrice, 'stop_loss');
                }
            } else {
                if ($currentPrice >= $liqPrice) {
                    $this->close($trade, $currentPrice, 'liquidation');
                } elseif ($tp !== null && $currentPrice <= $tp) {
                    $this->close($trade, $currentPrice, 'take_profit');
                } elseif ($sl !== null && $currentPrice >= $sl) {
                    $this->close($trade, $currentPrice, 'stop_loss');
                }
            }
        }
    }

    private function broadcast(Trade $trade): void
    {
        try {
            TradeUpdated::dispatch($trade);
        } catch (\Throwable) {
            // Broadcasting failure must not affect the trade result
        }
    }

    private function calcLiquidationPrice(string $direction, float $entryPrice, int $leverage): float
    {
        if ($direction === 'long') {
            return $entryPrice * (1 - 1 / $leverage);
        }
        return $entryPrice * (1 + 1 / $leverage);
    }

    private function calcPnl(Trade $trade, float $closePrice): float
    {
        $entryPrice   = (float) $trade->entry_price;
        $positionSize = (float) $trade->position_size;

        if ($trade->direction === 'long') {
            return ($closePrice - $entryPrice) / $entryPrice * $positionSize;
        }
        return ($entryPrice - $closePrice) / $entryPrice * $positionSize;
    }
}
