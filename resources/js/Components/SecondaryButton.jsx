import { Button } from '@/Components/ui/button';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <Button
            {...props}
            type={type}
            variant="outline"
            disabled={disabled}
            className={className}
        >
            {children}
        </Button>
    );
}

