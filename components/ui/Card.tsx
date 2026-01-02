import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    variant?: 'default' | 'accent' | 'bordered';
}

export function Card({ children, title, className, variant = 'default' }: CardProps) {
    // Lógica de variantes:

    const getVariantClasses = () => {
        switch (variant) {
            case 'accent':
                return 'border-2 border-accent/50 bg-accent/5';
            case 'bordered':
                return 'border-2 border-foreground/20 bg-card hover:bg-card-hover';
            case 'default':
            default:
                return 'bg-card border border-border hover:border-border-hover';
        }
    };

    // Clases base
    const baseClasses = "rounded-xl p-6 shadow-sm transition-all duration-200";
    
    return (
        <div className={`${baseClasses} ${getVariantClasses()} ${className}`}>
            {title && (
                <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>
            )}

            <div className="text-foreground-secondary">
                {children}
            </div>
        </div>
    );
}