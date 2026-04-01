<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TournamentParticipant extends Model
{
    protected $fillable = [
        'tournament_id',
        'user_id',
        'joined_at',
        'tournament_balance',
        'tournament_reserved_balance',
    ];

    protected function casts(): array
    {
        return [
            'joined_at'                   => 'datetime',
            'tournament_balance'          => 'decimal:2',
            'tournament_reserved_balance' => 'decimal:2',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
