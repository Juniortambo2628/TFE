<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\MpesaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Safaricom's server-to-server result of an STK push (route('mpesa.callback')).
 *
 * Public and CSRF-exempt — Safaricom is not a browser and carries no session.
 * It identifies the payment by CheckoutRequestID (stored as
 * payments.gateway_reference), then MpesaService::applyResult() does the
 * amount check and settlement exactly as a recovered stkQuery would, so the
 * two paths cannot disagree. Idempotent: Safaricom retries, and a second
 * delivery for an already-settled payment is acknowledged, not re-applied.
 */
class MpesaCallbackController extends Controller
{
    public function handle(Request $request, MpesaService $mpesa)
    {
        $callback = $request->input('Body.stkCallback');

        $checkoutId = is_array($callback) ? ($callback['CheckoutRequestID'] ?? null) : null;
        if (! filled($checkoutId)) {
            Log::warning('M-Pesa callback arrived without a CheckoutRequestID');

            // Acknowledge anything unparseable — retrying a malformed payload
            // can never succeed, and a non-2xx would make Safaricom hammer us.
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Malformed callback'], 200);
        }

        $payment = Payment::where('gateway_reference', $checkoutId)->first();
        if (! $payment) {
            Log::warning('M-Pesa callback for an unknown CheckoutRequestID', ['checkout_request_id' => $checkoutId]);

            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Unknown reference acknowledged']);
        }

        $status = $mpesa->applyResult($payment, is_array($callback) ? $callback : []);

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => match ($status) {
                'completed' => 'Settled',
                'failed' => 'Recorded as failed',
                default => 'Still pending',
            },
        ]);
    }
}
