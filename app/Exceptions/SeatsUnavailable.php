<?php

namespace App\Exceptions;

use RuntimeException;

/** The seats asked for cannot be sold; the message is safe to show the fan. */
class SeatsUnavailable extends RuntimeException {}
