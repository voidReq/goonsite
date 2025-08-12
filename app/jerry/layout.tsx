// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import '@mantine/core/styles.css'; // Mantine core styles

export const metadata: Metadata = {
    title: "Jerry's Blog",
    description: "Jerry's website",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={GeistSans.className}>
            <body>{children}</body>
        </html>
    );
}