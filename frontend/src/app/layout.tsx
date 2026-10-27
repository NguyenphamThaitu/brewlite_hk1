import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "BrewLite",
    description: "Đặt đồ uống không dùng tiền mặt",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <Providers>
                    <Header />
                    <main className="mx-auto w-full max-w-4xl p-4 flex-grow">{children}</main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}