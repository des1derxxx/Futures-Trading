<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TradeController;
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

    // Broadcast auth for private channels (JWT-protected)
    Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return Broadcast::auth($request);
    });
});
