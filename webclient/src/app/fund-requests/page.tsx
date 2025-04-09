"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useReadContract,
    useContractReads,
    usePublicClient,
} from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PendingMilestonesList from "@/components/FundRequest/PendingMilestonesList";
import Header from "@/components/Layout/Header";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import WithdrawalRequestForm from "@/components/FundRequest/WithdrawalRequestForm";
import { isValidatorAddress } from "@/lib/validators";
import FundRequestList from "@/components/FundRequest/FundRequestList";
import Sidebar from "@/components/Layout/Sidebar";

interface Fundraiser {
    id: number;
    name: string;
    description: string;
    creator: string;
    targetAmount: bigint;
    currentAmount: bigint;
    deadline: bigint;
    active: boolean;
}

export default function FundRequestsPage() {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Fund Requests & Approvals
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            View your fund requests and milestones. You can also
                            see requests that need your approval.
                        </p>
                        <FundRequestList />
                    </div>
                </main>
            </div>
        </div>
    );
}

function PendingRequestsList() {
    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Pending Fund Requests
            </h3>
            <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    This section will show fund requests awaiting approval.
                </p>
            </div>
        </div>
    );
}
