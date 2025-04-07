import Link from "next/link";
import { DashboardStats } from "../components/Dashboard/DashboardStats";
import { ActiveFundraisers } from "../components/Dashboard/ActiveFundraisers";
import { HeroSection } from "../components/Dashboard/HeroSection";
import Header from "@/components/Layout/Header";

export default function Page() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="Home" />

            <main>
                {/* Hero Section */}
                <HeroSection />

                {/* Stats Section */}
                <section className="py-12 bg-white dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <DashboardStats />
                    </div>
                </section>

                {/* Active Fundraisers Section */}
                <section className="py-16 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Active Fundraisers
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Support projects that make a difference
                            </p>
                        </div>

                        <ActiveFundraisers />

                        <div className="mt-12 text-center">
                            <Link
                                href="/fundraisers"
                                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                View All Fundraisers
                            </Link>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-16 bg-white dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                How It Works
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                FundX is a transparent fund tracking system that
                                ensures your donations reach their intended
                                recipients.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                                        1
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Create a Fundraiser
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Launch your fundraiser with clear milestones
                                    and funding goals.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                                        2
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Community Validation
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Projects are validated by the community
                                    through a transparent voting process.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                                        3
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Milestone-Based Funding
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Funds are released based on milestone
                                    achievements, ensuring accountability.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <Link
                                href="/create"
                                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                                Create a Fundraiser
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-gray-800 border-t border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        F
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-white">
                                    FundX
                                </h2>
                            </div>
                            <p className="text-gray-400">
                                Transparent fund tracking system built on
                                blockchain technology.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">
                                Quick Links
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/"
                                        className="text-gray-400 hover:text-white">
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/fundraisers"
                                        className="text-gray-400 hover:text-white">
                                        Explore Fundraisers
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/create"
                                        className="text-gray-400 hover:text-white">
                                        Create Fundraiser
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/about"
                                        className="text-gray-400 hover:text-white">
                                        About Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">
                                Resources
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/docs"
                                        className="text-gray-400 hover:text-white">
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/faq"
                                        className="text-gray-400 hover:text-white">
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/tutorials"
                                        className="text-gray-400 hover:text-white">
                                        Tutorials
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">
                                Connect
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://twitter.com"
                                        className="text-gray-400 hover:text-white">
                                        Twitter
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://discord.com"
                                        className="text-gray-400 hover:text-white">
                                        Discord
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com"
                                        className="text-gray-400 hover:text-white">
                                        GitHub
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-700">
                        <p className="text-center text-gray-400 text-sm">
                            FundX - Transparent Fund Tracking System ©{" "}
                            {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
