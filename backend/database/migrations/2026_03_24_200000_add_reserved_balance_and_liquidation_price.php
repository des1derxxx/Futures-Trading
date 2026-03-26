<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('reserved_balance', 15, 2)->default(0.00)->after('balance');
        });

        Schema::table('trades', function (Blueprint $table) {
            $table->decimal('liquidation_price', 20, 8)->nullable()->after('entry_price');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('reserved_balance');
        });
        Schema::table('trades', function (Blueprint $table) {
            $table->dropColumn('liquidation_price');
        });
    }
};
