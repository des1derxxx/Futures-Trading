<?php

namespace App\Console\Commands;

use App\Services\BinancePriceService;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class DevServer extends Command
{
    protected $signature = 'dev
                            {--host=127.0.0.1 : Server host}
                            {--port=8000 : Server port}';

    protected $description = 'Start HTTP server, Reverb and Binance price feeds for all supported symbols';

    public function handle(): int
    {
        $host = $this->option('host');
        $port = $this->option('port');
        $php  = PHP_BINARY;

        $processes = [];

        $processes[] = tap(
            new Process([$php, 'artisan', 'serve', "--host={$host}", "--port={$port}"], base_path()),
            fn($p) => $p->start(fn($t, $o) => $this->output->write("<fg=cyan>[serve]</> {$o}"))
        );

        $processes[] = tap(
            new Process([$php, 'artisan', 'reverb:start'], base_path()),
            fn($p) => $p->start(fn($t, $o) => $this->output->write("<fg=green>[reverb]</> {$o}"))
        );

        foreach (BinancePriceService::SUPPORTED_SYMBOLS as $symbol) {
            $label      = strtolower($symbol);
            $processes[] = tap(
                new Process([$php, 'artisan', 'binance:price-feed', "--symbol={$symbol}"], base_path()),
                fn($p) => $p->start(fn($t, $o) => $this->output->write("<fg=yellow>[{$label}]</> {$o}"))
            );
        }

        foreach ($processes as $p) {
            $p->setTimeout(null);
        }

        $this->info("HTTP server → http://{$host}:{$port}");
        $this->info("Reverb WS   → ws://localhost:8080");
        $this->info("Price feeds → " . implode(', ', BinancePriceService::SUPPORTED_SYMBOLS));
        $this->info('Press Ctrl+C to stop.');

        while (true) {
            $allDead = true;
            foreach ($processes as $p) {
                if ($p->isRunning()) { $allDead = false; break; }
            }
            if ($allDead) break;
            sleep(1);
        }

        foreach ($processes as $p) {
            if ($p->isRunning()) $p->stop();
        }

        return self::SUCCESS;
    }
}
