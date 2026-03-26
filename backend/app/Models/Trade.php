<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trade extends Model
{
    protected $fillable = [
        'user_id',
        'symbol',
        'direction',
        'margin',
        'leverage',
        'position_size',
        'entry_price',
        'liquidation_price',
        'stop_loss',
        'take_profit',
        'close_price',
        'pnl',
        'status',
        'close_reason',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'margin'            => 'decimal:2',
            'position_size'     => 'decimal:2',
            'entry_price'       => 'decimal:8',
            'liquidation_price' => 'decimal:8',
            'stop_loss'         => 'decimal:8',
            'take_profit'       => 'decimal:8',
            'close_price'       => 'decimal:8',
            'pnl'               => 'decimal:2',
            'leverage'          => 'integer',
            'opened_at'         => 'datetime',
            'closed_at'         => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
