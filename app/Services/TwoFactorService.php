<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSecuritySetting;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    protected $google2fa;

    public function __construct(Google2FA $google2fa)
    {
        $this->google2fa = $google2fa;
    }

    /**
     * Generate a new secret key for the user.
     */
    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Get the QR code SVG for the user.
     */
    public function getQrCodeSvg(string $company, string $holder, string $secret): string
    {
        $qrCodeUrl = $this->google2fa->getQRCodeUrl($company, $holder, $secret);

        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd
        );

        $writer = new Writer($renderer);

        return $writer->writeString($qrCodeUrl);
    }

    /**
     * Verify the given OTP code against the secret.
     */
    public function verifyCode(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code);
    }

    /**
     * Generate recovery codes for the user.
     */
    public function generateRecoveryCodes(): array
    {
        return Collection::times(8, function () {
            return bin2hex(random_bytes(10));
        })->toArray();
    }

    /**
     * Enable 2FA for the user.
     */
    public function enable(User $user, string $secret)
    {
        UserSecuritySetting::updateOrCreate(
            ['user_id' => $user->id],
            [
                'two_factor_secret' => Crypt::encryptString($secret),
                'two_factor_recovery_codes' => Crypt::encryptString(json_encode($this->generateRecoveryCodes())),
                'two_factor_enabled' => true,
            ]
        );
    }

    /**
     * Disable 2FA for the user.
     */
    public function disable(User $user)
    {
        UserSecuritySetting::where('user_id', $user->id)->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_enabled' => false,
        ]);
    }
}
