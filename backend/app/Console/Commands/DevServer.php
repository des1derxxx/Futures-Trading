<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class DevServer extends Command
{
    protected $signature = 'dev
                            {--host=127.0.0.1 : Server host}
                            {--port=8000 : Server port}
                            {--symbol=BTCUSDT : Trading pair symbol}';

    protected $description = 'Start HTTP server and Binance price feed together';

    public function handle(): int
    {
        $host   = $this->option('host');
        $port   = $this->option('port');
        $symbol = $this->option('symbol');

        $php = PHP_BINARY;

        $serve = new Process([$php, 'artisan', 'serve', "--host={$host}", "--port={$port}"], base_path());
        $feed  = new Process([$php, 'artisan', 'binance:price-feed', "--symbol={$symbol}"], base_path());

        $serve->setTimeout(null);
        $feed->setTimeout(null);

        $serve->start(function (string $type, string $output) {
            $this->output->write("<fg=cyan>[serve]</> {$output}");
        });

        $feed->start(function (string $type, string $output) {
            $this->output->write("<fg=yellow>[price-feed]</> {$output}");
        });

        $this->info("HTTP server  → http://{$host}:{$port}");
        $this->info("Price feed   → {$symbol}");
        $this->info('Press Ctrl+C to stop.');

        // Keep running until both die or user hits Ctrl+C
        while ($serve->isRunning() || $feed->isRunning()) {
            sleep(1);
        }

        // If one process died unexpectedly, kill the other
        if ($serve->isRunning()) {
            $serve->stop();
        }
        if ($feed->isRunning()) {
            $feed->stop();
        }

        $exitCode = $serve->getExitCode() ?? $feed->getExitCode() ?? 0;

        return $exitCode === 0 ? self::SUCCESS : self::FAILURE;
    }
}
