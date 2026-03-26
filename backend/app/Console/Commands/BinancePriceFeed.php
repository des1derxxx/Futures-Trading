<?php

namespace App\Console\Commands;

use App\Events\BinancePriceUpdated;
use App\Services\BinancePriceService;
use App\Services\PositionService;
use Illuminate\Console\Command;
use WebSocket\Client;
use WebSocket\ConnectionException;

class BinancePriceFeed extends Command
{
    protected $signature = 'binance:price-feed
                            {--symbol=BTCUSDT : Trading pair symbol}';

    protected $description = 'Connect to Binance WebSocket stream and broadcast prices via Reverb';

    public function handle(BinancePriceService $priceService, PositionService $positionService): int
    {
        $symbol = strtolower($this->option('symbol'));
        $url    = "wss://stream.binance.com:9443/ws/{$symbol}@miniTicker";

        $this->info("Connecting to Binance WebSocket: {$url}");

        while (true) {
            try {
                $client = new Client($url, ['timeout' => 60]);
                $this->info('Connected.');

                while (true) {
                    $message = $client->receive();
                    $data    = json_decode($message, true);

                    if (!isset($data['c'])) {
                        continue;
                    }

                    $price = (float) $data['c'];

                    // Cache the latest price
                    $priceService->cachePrice($price);

                    // Broadcast price to frontend
                    BinancePriceUpdated::dispatch($price, strtoupper($symbol));

                    // Check open positions for TP / SL / liquidation
                    $positionService->checkPositions(strtoupper($symbol), $price);

                    $this->line(sprintf(
                        '[%s] %s: $%s',
                        now()->toTimeString(),
                        strtoupper($symbol),
                        number_format($price, 2)
                    ));
                }
            } catch (ConnectionException $e) {
                $this->warn("Connection lost: {$e->getMessage()}. Reconnecting in 3s...");
                sleep(3);
            } catch (\Throwable $e) {
                $this->error("Error: {$e->getMessage()}. Reconnecting in 3s...");
                sleep(3);
            }
        }

        return self::SUCCESS;
    }
}
