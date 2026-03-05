import { useEffect } from 'react';

interface Props {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: Props) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

    return (
        <div className={`toast toast-${type}`} onClick={onClose}>
            <span>{icons[type]}</span>
            <span>{message}</span>
        </div>
    );
}
