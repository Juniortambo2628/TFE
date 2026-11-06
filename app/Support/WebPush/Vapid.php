<?php

namespace App\Support\WebPush;

use RuntimeException;

/**
 * VAPID (RFC 8292) with nothing but PHP's openssl: the ES256 key pair that
 * identifies TFE to push services, and the signed token each push carries.
 *
 * Keys are kept as base64url, the shape browsers and every push library use:
 * the public key is the 65-byte uncompressed P-256 point (0x04 || x || y),
 * the private key the 32-byte scalar d.
 */
final class Vapid
{
    /** @return array{public: string, private: string} */
    public static function generate(): array
    {
        $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        if ($key === false) {
            throw new RuntimeException('openssl could not create a P-256 key.');
        }
        $ec = openssl_pkey_get_details($key)['ec'];

        return [
            'public' => self::b64url("\x04".self::pad($ec['x']).self::pad($ec['y'])),
            'private' => self::b64url(self::pad($ec['d'])),
        ];
    }

    /**
     * The Authorization header for a push to `$endpoint`:
     * `vapid t=<JWT>, k=<public key>`.
     */
    public static function authorization(string $endpoint, string $publicKey, string $privateKey, string $subject, ?int $now = null): string
    {
        $parts = parse_url($endpoint);
        $audience = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        $header = self::b64url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $claims = self::b64url(json_encode([
            'aud' => $audience,
            'exp' => ($now ?? time()) + 12 * 3600, // push services refuse more than 24h
            'sub' => $subject,
        ], JSON_UNESCAPED_SLASHES));
        $input = "{$header}.{$claims}";

        $pem = self::privatePem($privateKey, $publicKey);
        if (! openssl_sign($input, $der, $pem, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('openssl could not sign the VAPID token.');
        }

        return "vapid t={$input}.".self::b64url(self::derToRaw($der)).", k={$publicKey}";
    }

    /** A raw (x||y) key's PEM, for checking a signature — used by the tests. */
    public static function publicPem(string $publicKey): string
    {
        // SubjectPublicKeyInfo for id-ecPublicKey / prime256v1, then the point.
        $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200').self::b64urlDecode($publicKey);

        return "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END PUBLIC KEY-----\n";
    }

    /** An ES256 JWS signature (r||s, 64 bytes) back to DER, for openssl_verify. */
    public static function rawToDer(string $raw): string
    {
        $int = function (string $v): string {
            $v = ltrim($v, "\x00");
            if ($v === '' || ord($v[0]) > 0x7F) {
                $v = "\x00".$v;
            }

            return "\x02".chr(strlen($v)).$v;
        };
        $seq = $int(substr($raw, 0, 32)).$int(substr($raw, 32, 32));

        return "\x30".chr(strlen($seq)).$seq;
    }

    public static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    public static function b64urlDecode(string $text): string
    {
        return base64_decode(strtr($text, '-_', '+/').str_repeat('=', (4 - strlen($text) % 4) % 4), true) ?: '';
    }

    /** SEC1 ECPrivateKey for (d, public point), the PEM openssl_sign wants. */
    private static function privatePem(string $privateKey, string $publicKey): string
    {
        $d = self::b64urlDecode($privateKey);
        $point = self::b64urlDecode($publicKey);
        if (strlen($d) !== 32 || strlen($point) !== 65) {
            throw new RuntimeException('The VAPID keys are not a P-256 pair (run php artisan webpush:vapid).');
        }
        $der = hex2bin('30770201010420').$d.hex2bin('a00a06082a8648ce3d030107a144034200').$point;

        return "-----BEGIN EC PRIVATE KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END EC PRIVATE KEY-----\n";
    }

    /** openssl's DER ECDSA signature to JWS's fixed r||s. */
    private static function derToRaw(string $der): string
    {
        $offset = 2; // SEQUENCE + length (always short form for P-256)
        $out = '';
        for ($i = 0; $i < 2; $i++) {
            $len = ord($der[$offset + 1]);
            $int = substr($der, $offset + 2, $len);
            $out .= str_pad(ltrim($int, "\x00"), 32, "\x00", STR_PAD_LEFT);
            $offset += 2 + $len;
        }

        return $out;
    }

    private static function pad(string $bytes): string
    {
        return str_pad($bytes, 32, "\x00", STR_PAD_LEFT);
    }
}
