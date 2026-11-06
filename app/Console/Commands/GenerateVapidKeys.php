<?php

namespace App\Console\Commands;

use App\Support\WebPush\Vapid;
use Illuminate\Console\Command;

/** Prints a fresh VAPID key pair for the .env (web push, Nov 2026). */
class GenerateVapidKeys extends Command
{
    protected $signature = 'webpush:vapid';

    protected $description = 'Generate the VAPID key pair web push needs, as .env lines';

    public function handle(): int
    {
        $keys = Vapid::generate();
        $this->line('WEBPUSH_VAPID_PUBLIC_KEY='.$keys['public']);
        $this->line('WEBPUSH_VAPID_PRIVATE_KEY='.$keys['private']);
        $this->newLine();
        $this->comment('Add both to the production .env once. Changing them later signs every device out of push.');

        return self::SUCCESS;
    }
}
