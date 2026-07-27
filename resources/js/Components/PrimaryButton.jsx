import { Button } from '@/Components/ui/button';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <Button
            {...props}
            disabled={disabled}
            className={className}
        >
            {children}
        </Button>
    );
}

