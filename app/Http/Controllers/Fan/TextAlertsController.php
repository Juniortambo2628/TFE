<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\NotificationContact;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Opt in to (and out of) SMS / WhatsApp alerts (Sprint 66).
 *
 * A number is only texted once its owner proves it with a one-time code, so a
 * typo — or someone else's number — never receives a fan's booking alerts.
 */
class TextAlertsController extends Controller
{
    public function store(Request $request, SmsService $sms)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'channel' => 'required|in:sms,whatsapp',
            'consent' => 'accepted',
        ]);

        $phone = SmsService::normalise($data['phone']);
        if (! $phone) {
            return back()->withErrors(['phone' => 'Enter a mobile number, e.g. 0712 345 678 or +234 801 234 5678.']);
        }

        $code = (string) random_int(100000, 999999);

        NotificationContact::updateOrCreate(['user_id' => Auth::id()], [
            'phone' => $phone,
            'channel' => $data['channel'],
            'consented_at' => now(),
            'verified_at' => null,
            'otp_hash' => Hash::make($code),
            'otp_expires_at' => now()->addMinutes(10),
            'otp_attempts' => 0,
        ]);

        $sms->send($phone, "TFE: your code is {$code}. It expires in 10 minutes.", $data['channel']);

        return back()->with('success', 'We sent a 6-digit code to that number.');
    }

    public function verify(Request $request)
    {
        $code = $request->validate(['code' => 'required|digits:6'])['code'];
        $contact = NotificationContact::where('user_id', Auth::id())->firstOrFail();

        if ($contact->otp_attempts >= 5 || ! $contact->otp_expires_at || $contact->otp_expires_at->isPast()) {
            return back()->withErrors(['code' => 'That code has expired. Send a new one.']);
        }

        if (! Hash::check($code, (string) $contact->otp_hash)) {
            $contact->increment('otp_attempts');

            return back()->withErrors(['code' => 'That code does not match.']);
        }

        $contact->update(['verified_at' => now(), 'otp_hash' => null, 'otp_expires_at' => null, 'otp_attempts' => 0]);

        return back()->with('success', 'Text alerts are on.');
    }

    public function destroy()
    {
        // Removes the number entirely — nothing kept "just in case".
        NotificationContact::where('user_id', Auth::id())->delete();

        return back()->with('success', 'Text alerts are off and your number has been deleted.');
    }
}
