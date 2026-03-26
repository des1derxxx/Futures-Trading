<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trades', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Инструмент: BTCUSDT, ETHUSDT и т.д.
            $table->string('symbol', 20);

            // Направление: long / short
            $table->enum('direction', ['long', 'short']);

            // Маржа — сколько своих денег пользователь вложил (в USDT)
            $table->decimal('margin', 15, 2);

            // Плечо (1–125)
            $table->unsignedTinyInteger('leverage')->default(1);

            // Размер позиции = margin * leverage
            $table->decimal('position_size', 15, 2);

            // Цены
            $table->decimal('entry_price', 20, 8);
            $table->decimal('stop_loss', 20, 8)->nullable();
            $table->decimal('take_profit', 20, 8)->nullable();
            $table->decimal('close_price', 20, 8)->nullable();

            // PnL при закрытии (в USDT)
            $table->decimal('pnl', 15, 2)->nullable();

            // Статус: open / closed / liquidated
            $table->enum('status', ['open', 'closed', 'liquidated'])->default('open');

            // Причина закрытия: manual / stop_loss / take_profit / liquidation
            $table->enum('close_reason', ['manual', 'stop_loss', 'take_profit', 'liquidation'])->nullable();

            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('symbol');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
