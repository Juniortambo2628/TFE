<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Widen webauthn_credentials.id to the length Laragear's own migration uses.
 *
 * Our hand-rolled table capped the credential ID at VARCHAR(191) — "a safe
 * length for unique indexes in utf8mb4". Laragear ships 510, because a
 * credential ID is authenticator-chosen and routinely exceeds 191 characters
 * once base64url-encoded (notably non-resident keys, which pack state into the
 * ID itself). On MySQL that meant registration either errored with 1406 or
 * silently truncated, after which the browser's full-length ID never matched a
 * stored row and the passkey simply "wasn't recognised".
 *
 * 510 utf8mb4 characters is 2040 bytes, inside InnoDB's 3072-byte key limit.
 *
 * SQLite is untouched on purpose: it does not enforce VARCHAR lengths, so
 * there is nothing to widen, and rebuilding the table to "fix" a declared
 * length would only risk the primary key.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('webauthn_credentials')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE `webauthn_credentials` MODIFY `id` VARCHAR(510) NOT NULL');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('webauthn_credentials')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE `webauthn_credentials` MODIFY `id` VARCHAR(191) NOT NULL');
        }
    }
};
