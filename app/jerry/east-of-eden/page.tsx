import { Container, Title, Text, Paper, Stack, AppShell, MantineProvider, MantineComponent, ColorSchemeScript } from "@mantine/core";
import '@mantine/core/styles.css';
import NavComponent from "../components/navComponent";
import Link from "next/link";
import styles from "./page.module.css";
import { getPosts } from "./load-posts";

const posts = getPosts();

export default function EastOfEdenPage() {
    return (
        <MantineProvider>
            <AppShell>
                <NavComponent />
                <Container size="sm" py="xl">
                    <Title order={1} mb="md">
                        East of Eden
                    </Title>
                    <Text c="gray.7" style={{ margin: "16px 0" }}>
                        East of Eden is a book written by John Steinbeck. The book explores the intertwining history of two families, the Trasks and the Hamiltons, in California's Salinas Valley.
                        The book explores themes such as free will, the battle between good and evil, and the mysterious nature of love.
                    </Text>
                    <Stack>
                        {posts.map((post) => (
                            <Link href={`/jerry/east-of-eden/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <Paper key={post.id} withBorder shadow="sm" p="md" radius="md" className={styles.paperHover}>
                                    <Title order={2} mb={"30"}>
                                        {post.title}
                                    </Title>

                                    <Text size="sm" truncate="end" component="div">
                                        {post.content}
                                    </Text>
                                </Paper>
                            </Link>
                        ))}
                    </Stack>
                </Container>
            </AppShell>
        </MantineProvider>
    );
}