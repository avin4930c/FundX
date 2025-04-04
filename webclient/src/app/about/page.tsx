"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Header from "@/components/Layout/Header";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="About FundX" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-8 sm:p-10">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Mission
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                FundX is built on the belief that charitable
                                fundraising should be transparent, efficient,
                                and accountable. We leverage blockchain
                                technology to ensure every donation is tracked
                                and utilized as intended, empowering both donors
                                and fundraisers.
                            </p>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Technology
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Blockchain-Based Transparency
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Every transaction on our platform is
                                        recorded on the blockchain, creating an
                                        immutable record of all donations and
                                        fund movements. This allows donors to
                                        track exactly where their contributions
                                        go and how they're used.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Smart Contract Security
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Our smart contracts automate the
                                        fundraising process, ensuring that funds
                                        are only released when predefined
                                        conditions are met. This reduces the
                                        risk of fraud and mismanagement.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Decentralized Governance
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        The FundX platform incorporates DAO
                                        (Decentralized Autonomous Organization)
                                        principles, allowing community members
                                        to participate in decision-making and
                                        fund approval processes.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        Milestone-Based Funding
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Fundraisers receive funds in stages as
                                        they achieve their milestones, promoting
                                        accountability and ensuring that
                                        projects make tangible progress before
                                        receiving additional funding.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Team
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                FundX was created by a team of blockchain
                                enthusiasts, developers, and philanthropists who
                                believe in the power of technology to transform
                                charitable giving.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mb-4"></div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Santhosh Kumar
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Founder & Lead Developer
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mb-4"></div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Ankit Sharma
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Blockchain Architect
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4"></div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Priya Patel
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Community Manager
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Join Our Mission
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Whether you're a donor looking to make an
                                impact, a fundraiser with a cause, or a
                                developer interested in blockchain technology,
                                we invite you to join our community.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/explore"
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Explore Fundraisers
                                </Link>
                                <Link
                                    href="/create"
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                    Start a Fundraiser
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
