<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tournament extends Model
{
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'max_participants',
        'prize_pool',
        'starting_balance',
    ];

    protected function casts(): array
    {
        return [
            'start_date'        => 'datetime',
            'end_date'          => 'datetime',
            'max_participants'  => 'integer',
            'prize_pool'        => 'decimal:2',
            'starting_balance'  => 'decimal:2',
        ];
    }

    public function participants(): HasMany
    {
        return $this->hasMany(TournamentParticipant::class);
    }
}
