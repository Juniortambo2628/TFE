import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatMoney(amount) {
    return 'KES ' + new Intl.NumberFormat().format(amount || 0);
}
