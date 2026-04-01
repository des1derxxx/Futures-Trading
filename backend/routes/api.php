<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TradeController;
use App\Http\Controllers\Api\TournamentController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me',       [AuthController::class, 'me']);
    });
});

Route::middleware('auth:api')->group(function () {
    Route::get('profile/stats', [ProfileController::class, 'stats']);
    Route::get('trades',        [TradeController::class, 'index']);
    Route::post('trades',       [TradeController::class, 'open']);
    Route::delete('trades/{id}', [TradeController::class, 'close']);

    // Tournaments
    Route::get('tournaments',                           [TournamentController::class, 'index']);
    Route::get('tournaments/{id}',                      [TournamentController::class, 'show']);
    Route::post('tournaments/{id}/join',                [TournamentController::class, 'join']);
    Route::get('tournaments/{id}/my-trades',                    [TournamentController::class, 'myTrades']);
    Route::get('tournaments/{id}/participants/{userId}/trades', [TournamentController::class, 'userTrades']);

    // Admin
    Route::get('admin/tournaments',                     [AdminController::class, 'tournaments']);
    Route::post('admin/tournaments',                    [AdminController::class, 'storeTournament']);
    Route::put('admin/tournaments/{id}',                [AdminController::class, 'updateTournament']);
    Route::delete('admin/tournaments/{id}',             [AdminController::class, 'deleteTournament']);
    Route::get('admin/tournaments/{id}/participants',   [AdminController::class, 'participants']);
    Route::patch('admin/users/{userId}/set-admin',      [AdminController::class, 'setAdmin']);

    // Broadcast auth for private channels (JWT-protected)
    Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return Broadcast::auth($request);
    });
});
