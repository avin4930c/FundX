'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
    return (
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">F</span>
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                FundX
                            </h1>
                        </Link>
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link
                                href="/validated-projects"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Validated Projects
                            </Link>
                            <Link
                                href="/withdraw"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Withdraw Funds
                            </Link>
                            {/* <Link
                                href="/analytics"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Project Analytics
                            </Link>
                            <Link
                                href="/validators"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Validator Performance
                            </Link> */}
                            <Link
                                href="/audit"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Audit Log
                            </Link>
                            {/* <Link
                                href="/transactions"
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Transaction History
                            </Link> */}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
} 