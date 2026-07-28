<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background-color: #000000; color: #ffffff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #000000; padding: 30px; border-radius: 12px; border: 1px solid #333; }
        .header { text-align: center; margin-bottom: 30px; background-color: #DC143C; padding: 20px; border-radius: 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #DC143C; margin: 20px 0; text-align: center; }
        .details { margin-bottom: 30px; background: #1a1a1a; padding: 20px; border-radius: 8px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        .row:last-child { border-bottom: none; }
        .label { color: #888; }
        .value { font-weight: bold; color: #ffffff; }
        .footer { text-align: center; color: #ffffff; font-size: 12px; margin-top: 30px; background-color: #DC143C; padding: 15px; border-radius: 8px; }
        .btn { display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="color: #ffffff; margin: 0;">Payment Receipt</h2>
            <p style="color: #ffffff; margin: 5px 0 0 0;">Thank you for your payment!</p>
        </div>

        <div class="amount">
            KES {{ number_format($transaction->amount, 2) }}
        </div>

        <div class="details">
            <div class="row">
                <span class="label">Reference:</span>
                <span class="value">{{ $transaction->reference }}</span>
            </div>
            <div class="row">
                <span class="label">Method:</span>
                <span class="value">{{ strtoupper($transaction->method) }}</span>
            </div>
            <div class="row">
                <span class="label">Date:</span>
                <span class="value">{{ $transaction->created_at->format('M d, Y H:i') }}</span>
            </div>
            <div class="row">
                <span class="label">Status:</span>
                <span class="value" style="color: #22c55e;">COMPLETED</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="{{ route('fan.wallet') }}" class="btn">View Wallet</a>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} The Football Experience. All rights reserved.
        </div>
    </div>
</body>
</html>
