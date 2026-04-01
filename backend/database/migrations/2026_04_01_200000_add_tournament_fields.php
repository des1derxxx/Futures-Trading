<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add starting_balance to tournaments
        Schema::table('tournaments', function (Blueprint $table) {
            $table->decimal('starting_balance', 15, 2)->default(10000.00)->after('prize_pool');
        });

        // Add tournament balance fields to participants
        Schema::table('tournament_participants', function (Blueprint $table) {
            $table->decimal('tournament_balance', 15, 2)->default(0)->after('joined_at');
            $table->decimal('tournament_reserved_balance', 15, 2)->default(0)->after('tournament_balance');
        });

        // Add tournament_id to trades
        Schema::table('trades', function (Blueprint $table) {
            $table->foreignId('tournament_id')
                ->nullable()
                ->after('user_id')
                ->constrained()
                ->nullOnDelete();
            $table->index(['user_id', 'tournament_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'tournament_id', 'status']);
            $table->dropForeign(['tournament_id']);
            $table->dropColumn('tournament_id');
        });

        Schema::table('tournament_participants', function (Blueprint $table) {
            $table->dropColumn(['tournament_balance', 'tournament_reserved_balance']);
        });

        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropColumn('starting_balance');
        });
    }
};
