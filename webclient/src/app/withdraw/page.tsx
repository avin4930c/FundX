'use client';

import { WithdrawFunds } from '@/components/WithdrawFunds';

export default function WithdrawPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Withdraw Project Funds</h1>
            <WithdrawFunds />
        </div>
    );
} 