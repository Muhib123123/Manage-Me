"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface ConnectButtonProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function ConnectButton({ href, children, className }: ConnectButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <Link 
            href={href} 
            className={className}
            onClick={() => setIsLoading(true)}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting...</span>
                </span>
            ) : (
                children
            )}
        </Link>
    );
}
