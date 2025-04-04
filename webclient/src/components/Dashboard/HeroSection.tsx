"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

export const HeroSection = () => {
    const { isConnected } = useAccount();

    return (
        <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: "15px 15px",
                    }}></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                        <span className="block">Transparent Fundraising</span>
                        <span className="block text-blue-200">
                            Powered by Blockchain
                        </span>
                    </h1>
                    <p className="mt-6 max-w-xl mx-auto text-xl text-blue-50">
                        FundX ensures your donations reach their intended
                        recipients through transparent tracking and
                        milestone-based fund releases.
                    </p>
                    <div className="mt-10 flex justify-center gap-4 flex-wrap">
                        <Link
                            href="/create"
                            className={`px-8 py-3 text-base font-medium rounded-md shadow 
                ${
                    isConnected
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-300 text-blue-800 cursor-not-allowed"
                }`}>
                            Create Fundraiser
                        </Link>
                        <Link
                            href="/explore"
                            className="px-8 py-3 text-base font-medium rounded-md shadow bg-blue-900 text-white hover:bg-blue-800">
                            Donate Now
                        </Link>
                    </div>

                    {!isConnected && (
                        <p className="mt-4 text-sm text-blue-200">
                            Connect your wallet to create a fundraiser
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
