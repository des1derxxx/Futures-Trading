<?php

namespace App\Events;

use App\Models\Trade;
use App\Models\TournamentParticipant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TradeUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Trade $trade) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('trades.' . $this->trade->user_id);
    }

    public function broadcastAs(): string
    {
        return 'trade.updated';
    }

    public function broadcastWith(): array
    {
        $participant = null;
        if ($this->trade->tournament_id) {
            $participant = TournamentParticipant::where('tournament_id', $this->trade->tournament_id)
                ->where('user_id', $this->trade->user_id)
                ->first();
        }

        return [
            'trade' => [
                'id'                => $this->trade->id,
                'tournament_id'     => $this->trade->tournament_id,
                'symbol'            => $this->trade->symbol,
                'direction'         => $this->trade->direction,
                'margin'            => (float) $this->trade->margin,
                'leverage'          => $this->trade->leverage,
                'position_size'     => (float) $this->trade->position_size,
                'entry_price'       => (float) $this->trade->entry_price,
                'liquidation_price' => (float) $this->trade->liquidation_price,
                'stop_loss'         => $this->trade->stop_loss ? (float) $this->trade->stop_loss : null,
                'take_profit'       => $this->trade->take_profit ? (float) $this->trade->take_profit : null,
                'close_price'       => $this->trade->close_price ? (float) $this->trade->close_price : null,
                'pnl'               => $this->trade->pnl ? (float) $this->trade->pnl : null,
                'status'            => $this->trade->status,
                'close_reason'      => $this->trade->close_reason,
                'opened_at'         => $this->trade->opened_at?->toISOString(),
                'closed_at'         => $this->trade->closed_at?->toISOString(),
            ],
            'user_balance'                => (float) $this->trade->user->balance,
            'user_reserved_balance'       => (float) $this->trade->user->reserved_balance,
            'tournament_balance'          => $participant ? (float) $participant->tournament_balance : null,
            'tournament_reserved_balance' => $participant ? (float) $participant->tournament_reserved_balance : null,
        ];
    }
}
