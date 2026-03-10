'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProfissionalFooterID({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            <span className="font-mono bg-gray-50 px-2 py-1 rounded truncate max-w-[150px]">
                {id}
            </span>
            <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                title="Copiar ID"
            >
                {copied ? (
                    <><Check size={14} className="text-emerald-500" /> Copiado</>
                ) : (
                    <><Copy size={14} /> Copiar ID</>
                )}
            </button>
        </div>
    );
}
