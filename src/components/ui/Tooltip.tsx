import React, { useEffect, useRef } from 'react';
import tippy from 'tippy.js';
import type { Instance, Props } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

interface TooltipProps extends Partial<Props> {
    content: string;
    children: React.ReactElement;
    shortcut?: string;
}

export const Tooltip = ({
    content,
    children,
    shortcut,
    placement,
    theme,
    trigger,
    interactive,
    appendTo
}: TooltipProps) => {
    const instanceRef = useRef<Instance | null>(null);
    const wrapperRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const element = wrapperRef.current;
        if (!element) return;

        // Cleanup previous instance
        if (instanceRef.current) {
            instanceRef.current.destroy();
            instanceRef.current = null;
        }

        // Create content element
        const tooltipContent = document.createElement('div');
        tooltipContent.className = "flex items-center gap-2 text-xs font-medium";

        const textSpan = document.createElement('span');
        textSpan.textContent = content;
        tooltipContent.appendChild(textSpan);

        if (shortcut) {
            const shortcutSpan = document.createElement('span');
            shortcutSpan.className = "opacity-60 bg-white/10 px-1 rounded font-mono text-[10px] ml-2";
            shortcutSpan.textContent = shortcut;
            tooltipContent.appendChild(shortcutSpan);
        }

        instanceRef.current = tippy(element, {
            content: tooltipContent,
            animation: 'shift-away',
            duration: [200, 150],
            delay: [300, 0],
            allowHTML: true,
            placement,
            theme,
            trigger,
            interactive,
            appendTo,
        });

        return () => {
            instanceRef.current?.destroy();
            instanceRef.current = null;
        };
    }, [content, shortcut, placement, theme, trigger, interactive, appendTo]);

    return (
        <span ref={wrapperRef} style={{ display: 'contents' }}>
            {children}
        </span>
    );
};
