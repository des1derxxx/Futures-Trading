<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = ChatMessage::with('user')
            ->latest()
            ->limit(100)
            ->get()
            ->reverse()
            ->values()
            ->map(fn(ChatMessage $m) => [
                'id'         => $m->id,
                'user_id'    => $m->user_id,
                'user_name'  => $m->user->name,
                'message'    => $m->message,
                'created_at' => $m->created_at->toISOString(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['message' => 'required|string|max:500']);

        $chatMessage = ChatMessage::create([
            'user_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        $chatMessage->load('user');

        broadcast(new MessageSent($chatMessage));

        return response()->json([
            'id'         => $chatMessage->id,
            'user_id'    => $chatMessage->user_id,
            'user_name'  => $chatMessage->user->name,
            'message'    => $chatMessage->message,
            'created_at' => $chatMessage->created_at->toISOString(),
        ], 201);
    }
}
