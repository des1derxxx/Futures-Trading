<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BinancePriceService
{
    private const CACHE_KEY = 'binance_price_btcusdt';
    private const CACHE_TTL = 60; // seconds

    /**
     * Cache a price received from the WebSocket stream.
     */
    public function cachePrice(float $price): void
    {
        Cache::put(self::CACHE_KEY, $price, self::CACHE_TTL);
    }

    /**
     * Fetch current BTCUSDT price from Binance REST API and cache it.
     */
    public function fetchAndCachePrice(): ?float
    {
        $response = Http::timeout(5)->get('https://api.binance.com/api/v3/ticker/price', [
            'symbol' => 'BTCUSDT',
        ]);

        if (!$response->successful()) {
            return null;
        }

        $price = (float) $response->json('price');

        Cache::put(self::CACHE_KEY, $price, self::CACHE_TTL);

        return $price;
    }

    /**
     * Get the latest cached BTCUSDT price.
     * Returns null if no price has been fetched yet.
     */
    public function getCachedPrice(): ?float
    {
        return Cache::get(self::CACHE_KEY);
    }

    /**
     * Get the latest price — from cache if available, otherwise fetch fresh.
     */
    public function getPrice(): ?float
    {
        return $this->getCachedPrice() ?? $this->fetchAndCachePrice();
    }
}
