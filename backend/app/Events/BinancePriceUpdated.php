<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BinancePriceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly int $timestamp;

    public function __construct(
        public readonly float $price,
        public readonly string $symbol = 'BTCUSDT',
        int $timestamp = 0,
    ) {
        $this->timestamp = $timestamp ?: now()->timestamp;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('binance.prices');
    }

    public function broadcastAs(): string
    {
        return 'price.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'symbol'    => $this->symbol,
            'price'     => $this->price,
            'timestamp' => $this->timestamp,
        ];
    }
}
