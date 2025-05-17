"use client";

import { Box } from "@mantine/core";
import { usePathname } from "next/navigation";
import Link from "next/link";

import styles from "./navComponent.module.css";


const navLinks = [
    { label: "Home", href: "/jerry" },
    { label: "East of Eden", href: "/jerry/east-of-eden" },
    { label: "The Cheating Culture", href: "/jerry/non-fiction" },
    { label: "Short Non Fiction", href: "/jerry/short-non-fiction" },
    { label: "The Painter and the Thief", href: "/jerry/painter-thief" },
];


export default function NavComponent() {
    const pathname = usePathname();

    return (<header>
        <Box className={styles.nav}>
            {navLinks.map((link) => (
                <Link
                    key={link.label}
                    href={link.href}
                    className={styles.navLink}
                    style={{
                        textDecoration: "none",
                        fontWeight: pathname === link.href ? "bold" : "normal",
                        color: pathname === link.href ? "white" : "",
                    }}
                >
                    {link.label}
                </Link>
            ))}
        </Box>
    </header>)
}