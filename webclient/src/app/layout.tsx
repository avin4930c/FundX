import "@rainbow-me/rainbowkit/styles.css";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
