import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    align?: 'left' | 'right' | 'center';
    className?: string;
}

export const Popover = ({
    trigger,
    content,
    isOpen: controlledIsOpen,
    onOpenChange,
    align = 'right',
    className
}: PopoverProps) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
    const setIsOpen = useCallback((value: boolean) => {
        if (!isControlled) {
            setUncontrolledIsOpen(value);
        }
        onOpenChange?.(value);
    }, [isControlled, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    const alignmentStyles = {
        left: 'left-0 origin-top-left',
        right: 'right-0 origin-top-right',
        center: 'left-1/2 -translate-x-1/2 origin-top',
    };

    return (
        <div className="relative" ref={popoverRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={clsx(
                        "absolute top-full mt-2 z-50 min-w-[200px]",
                        "bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800",
                        "animate-in fade-in zoom-in-95 duration-200",
                        alignmentStyles[align],
                        className
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
