<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Browser errors, reported by resources/js/lib/errorReporter.js (Sprint 69).
 *
 * Before this, a console error reached us only when a tester pasted their
 * devtools output. Everything here is capped and stripped on the way in:
 *
 *  - page and source are reduced to a PATH — a query string can carry a
 *    token, an email or a payment reference;
 *  - nothing from the bank-savings pages is kept at all, as
 *    docs/proposals/bank-partner-savings.md requires of any error tracker;
 *  - the user is an id, never a name or email;
 *  - it goes to its own 7-day log file, not a table.
 *
 * Always 204: this is fire-and-forget from sendBeacon, and the reporter
 * must never be able to produce a second error by failing.
 */
class ClientErrorController extends Controller
{
    /** Pages whose errors are not recorded at all. */
    public const SKIP_PATHS = ['fan/bank-savings', 'sandbox-bank'];

    public function store(Request $request): Response
    {
        $data = $request->validate([
            'message' => 'required|string|max:2000',
            'page' => 'nullable|string|max:2000',
            'source' => 'nullable|string|max:2000',
            'line' => 'nullable|integer',
            'column' => 'nullable|integer',
            'stack' => 'nullable|string|max:8000',
            'kind' => 'nullable|in:error,unhandledrejection,console',
        ]);

        $page = self::pathOnly($data['page'] ?? null);

        if ($page !== null && Str::startsWith(ltrim($page, '/'), self::SKIP_PATHS)) {
            return response()->noContent();
        }

        Log::channel('client')->warning(Str::limit($data['message'], 500), [
            'kind' => $data['kind'] ?? 'error',
            'page' => $page,
            'source' => self::pathOnly($data['source'] ?? null),
            'line' => $data['line'] ?? null,
            'column' => $data['column'] ?? null,
            'stack' => isset($data['stack']) ? Str::limit($data['stack'], 2000) : null,
            'user_id' => $request->user()?->id,
            'agent' => Str::limit((string) $request->userAgent(), 200),
        ]);

        return response()->noContent();
    }

    /** "https://x/fan/bookings/9?token=abc#y" → "/fan/bookings/9". */
    public static function pathOnly(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);

        return is_string($path) && $path !== '' ? $path : null;
    }
}
