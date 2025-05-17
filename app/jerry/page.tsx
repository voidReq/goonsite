"use client";
import { Container, Title, Text, SimpleGrid, Paper, MantineProvider, Group } from "@mantine/core";
import Link from "next/link";
import '@mantine/core/styles.css';
import styles from "./page.module.css";
import NavComponent from "./components/navComponent";

const links = [
    {
        href: "/jerry/east-of-eden",
        label: "East of Eden",
        description: "Reflections on Steinbeck's magnum opus.",
        img: "https://cdn.clearcreekresources.org/wp-content/uploads/2022/02/MicrosoftTeams-image-26-scaled.jpg", // Garden/tree image
    },
    {
        href: "/jerry/non-fiction",
        label: "The Cheating Culture",
        description: "Dialectical journal about ideas presented in the book, the cheating culture of America, and how more people are cheating.",
        img: "https://m.media-amazon.com/images/I/61zwec5kIIL.jpg", // Books image
    },
    {
        href: "/jerry/short-non-fiction",
        label: "Short Non Fiction",
        description: "Reflections on short non-fiction pieces. Also includes my reflections on studying for the AP Lang test.",
        img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80", // Notepad image
    },
    {
        href: "/jerry/documentary-blogs",
        label: "The Painter and the Thief",
        description: "A documentary about a relationship that develops between a painter and the thief that stole her artwork.",
        img: "https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/19992699/painter1.jpg?quality=90&strip=all&crop=7.8125,0,84.375,100", // Film/camera image
    }
];



export default function JerryMain() {
    return (
        <MantineProvider>

            <NavComponent />
            <Container size="sm" py="xl">
                <Title order={1} ta="center" mb="xs">
                    Jerry's Writing Blog
                </Title>
                <Text ta="center" c="dimmed" mb="xl">
                    Welcome to my website!
                    This blog contains a collection of essays I wrote for my AP Lang class.
                    Take a look around at what's here!
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {links.map(link => (
                        <Paper
                            key={link.href}
                            withBorder
                            shadow="md"
                            p={0} // Remove padding from Paper
                            radius="md"
                            component={Link}
                            href={link.href}
                            style={{
                                textDecoration: "none",
                                transition: "box-shadow 0.2s",
                                cursor: "pointer",
                                overflow: "hidden", // Ensures image corners are rounded
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                            }}
                            className={styles.paperHighlight}
                        >
                            <img
                                src={link.img}
                                alt={link.label}
                                width="100%"
                                height={140}
                                style={{
                                    objectFit: "cover",
                                    display: "block",
                                    width: "100%",
                                    height: 140,
                                }}
                            />

                            <div style={{ padding: 16 }}>
                                <Title order={3} className={styles.cardTitle} mb={4}>
                                    {link.label}
                                </Title>
                                <Text size="sm" c="dimmed">
                                    {link.description}
                                </Text>
                            </div>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Container>
        </MantineProvider>
    );
}