<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly ChatMessage $chatMessage) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('chat.general');
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id'         => $this->chatMessage->id,
            'user_id'    => $this->chatMessage->user_id,
            'user_name'  => $this->chatMessage->user->name,
            'message'    => $this->chatMessage->message,
            'created_at' => $this->chatMessage->created_at->toISOString(),
        ];
    }
}
