import { useEffect, useState } from 'react';

/** Below 768px: the width where the dashboard switches to the phone layout
 *  (bottom tab bar, compact page toolbar). Matches the CSS breakpoint. */
export const PHONE_QUERY = '(max-width: 767.98px)';

export default function useIsPhone() {
    const [phone, setPhone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches);
    useEffect(() => {
        const mq = window.matchMedia?.(PHONE_QUERY);
        if (!mq) return undefined;
        const on = () => setPhone(mq.matches);
        on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return phone;
}
