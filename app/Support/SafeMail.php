<?php

namespace App\Support;

use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Runs something that sends mail and turns a mail-server failure into a
 * logged `false` instead of a 500.
 *
 * Mail goes out inside the request on sign-up, "resend verification",
 * password reset and the login alert. When the mail server is down or the
 * MAIL_* settings are wrong, the transport throws, and every one of those
 * pages answered "500 Server Error" — after sign-up had already created the
 * account, so the person was left signed in on a verify screen whose only
 * button failed the same way.
 *
 * Only transport failures are caught: a bug in building the message is
 * still a bug and still surfaces.
 */
class SafeMail
{
    public static function attempt(callable $send): bool
    {
        try {
            $send();

            return true;
        } catch (TransportExceptionInterface $e) {
            report($e);

            return false;
        }
    }
}
