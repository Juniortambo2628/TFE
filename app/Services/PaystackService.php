<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaystackService
{
    protected $baseUrl;
    protected $secretKey;

    public function __construct()
    {
        $this->baseUrl = 'https://api.paystack.co';
        $this->secretKey = config('services.paystack.secret_key', env('PAYSTACK_SECRET_KEY'));
    }

    /**
     * Verify a transaction by its reference
     *
     * @param string $reference
     * @return array
     */
    public function verifyTransaction($reference)
    {
        $response = Http::withToken($this->secretKey)
            ->get("{$this->baseUrl}/transaction/verify/{$reference}");

        if ($response->successful()) {
            return $response->json();
        }

        return [
            'status' => false,
            'message' => 'Verification failed',
            'data' => $response->json()
        ];
    }

    /**
     * Initialize a transaction (Server Side)
     *
     * @param string $email
     * @param int $amount (in kobo/cents)
     * @param string $reference
     * @return array
     */
    public function initializeTransaction($email, $amount, $reference)
    {
        $response = Http::withToken($this->secretKey)
            ->post("{$this->baseUrl}/transaction/initialize", [
                'email' => $email,
                'amount' => $amount,
                'reference' => $reference,
            ]);

        return $response->json();
    }
}
