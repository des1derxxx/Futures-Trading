<?php

namespace App\Events;

use App\Models\Tournament;
use App\Models\TournamentParticipant;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TournamentEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Tournament $tournament) {}

    public function broadcastOn(): Channel
    {
        return new Channel('tournaments');
    }

    public function broadcastAs(): string
    {
        return 'tournament.ended';
    }

    public function broadcastWith(): array
    {
        return [
            'tournament_id'   => $this->tournament->id,
            'tournament_name' => $this->tournament->name,
        ];
    }
}
