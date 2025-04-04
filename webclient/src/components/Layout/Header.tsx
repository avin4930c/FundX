"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
    pageTitle?: string;
    showBackButton?: boolean;
}

export default function Header({ pageTitle, showBackButton }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll events to change header appearance when scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        // Add scroll event listener
        window.addEventListener("scroll", handleScroll);

        // Clean up event listener
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // Close mobile menu when changing routes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Explore", href: "/explore" },
        { name: "Create", href: "/create" },
        { name: "Fund Requests", href: "/fund-requests" },
        { name: "Governance", href: "/governance" },
        { name: "Multi-Sig", href: "/multi-sig" },
    ];

    return (
        <header
            className={`sticky top-0 z-50 ${
                scrolled
                    ? "bg-gray-900/95 backdrop-blur-sm"
                    : "bg-gray-800 dark:bg-gray-900"
            } shadow transition-all duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link
                                href="/"
                                className="text-white font-bold text-xl flex items-center">
                                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                                    Fund
                                </span>
                                <span className="text-white">X</span>
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`${
                                            pathname === link.href
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                        } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}>
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {pageTitle && (
                            <div className="flex items-center mr-4 hidden sm:flex">
                                {showBackButton && (
                                    <button
                                        onClick={() => router.back()}
                                        className="mr-2 text-gray-300 hover:text-white transition-colors duration-200">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                    </button>
                                )}
                                <h1 className="text-xl font-bold text-white">
                                    {pageTitle}
                                </h1>
                            </div>
                        )}

                        {/* Connect button for tablet/desktop */}
                        <div className="hidden sm:block">
                            <ConnectButton />
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex md:hidden ml-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                className="bg-gray-700 dark:bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200"
                                aria-expanded="false">
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="block h-6 w-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            <div
                className={`md:hidden ${
                    mobileMenuOpen ? "block" : "hidden"
                } transition-all duration-300 ease-in-out`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800 dark:bg-gray-900">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`${
                                pathname === link.href
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}>
                            {link.name}
                        </Link>
                    ))}

                    {/* Connect button for mobile - placed in the menu for better UX */}
                    <div className="px-3 py-3 sm:hidden">
                        <ConnectButton />
                    </div>
                </div>
            </div>

            {/* Page title for mobile */}
            {pageTitle && (
                <div
                    className={`${
                        scrolled
                            ? "bg-gray-800/90 backdrop-blur-sm"
                            : "bg-white dark:bg-gray-800"
                    } shadow sm:hidden transition-all duration-300`}>
                    <div className="max-w-7xl mx-auto py-3 px-4">
                        <div className="flex items-center">
                            {showBackButton && (
                                <button
                                    onClick={() => router.back()}
                                    className="mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                        />
                                    </svg>
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {pageTitle}
                            </h1>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
