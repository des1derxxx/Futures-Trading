<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BinancePriceService
{
    private const CACHE_TTL = 60; // seconds

    public const SUPPORTED_SYMBOLS = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
    ];

    private function cacheKey(string $symbol): string
    {
        return 'binance_price_' . strtolower($symbol);
    }

    public function cachePrice(float $price, string $symbol = 'BTCUSDT'): void
    {
        Cache::put($this->cacheKey($symbol), $price, self::CACHE_TTL);
    }

    public function fetchAndCachePrice(string $symbol = 'BTCUSDT'): ?float
    {
        $response = Http::timeout(5)->get('https://api.binance.com/api/v3/ticker/price', [
            'symbol' => strtoupper($symbol),
        ]);

        if (!$response->successful()) {
            return null;
        }

        $price = (float) $response->json('price');
        $this->cachePrice($price, $symbol);

        return $price;
    }

    public function getCachedPrice(string $symbol = 'BTCUSDT'): ?float
    {
        return Cache::get($this->cacheKey($symbol));
    }

    public function getPrice(string $symbol = 'BTCUSDT'): ?float
    {
        return $this->getCachedPrice($symbol) ?? $this->fetchAndCachePrice($symbol);
    }
}
