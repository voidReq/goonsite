"use client";
import { Container, Title, Text, Paper, Stack, AppShell, MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';
import NavComponent from "../components/navComponent";

// Example blog posts for East of Eden
const posts = [
    {
        id: 1,
        title: "The Symbolism of the Genesis Tree",
        excerpt: "Exploring how Steinbeck uses the tree as a metaphor for choice and destiny in East of Eden...",
        date: "2024-05-01",
    },
    {
        id: 2,
        title: "Sibling Rivalry: Cal and Aron",
        excerpt: "A deep dive into the complex relationship between the Trask brothers and its biblical parallels.",
        date: "2024-05-03",
    },
    {
        id: 3,
        title: "Cathy Ames: The Nature of Evil",
        excerpt: "An analysis of one of literature's most enigmatic antagonists and her impact on the Trask family.",
        date: "2024-05-05",
    },
];

export default function EastOfEdenPage() {
    return (
        <MantineProvider>
            <AppShell>
                <NavComponent />
                <Container size="md" py="xl">
                    <Title order={1} mb="md">
                        East of Eden Blog
                    </Title>
                    <Stack>
                        {posts.map((post) => (
                            <Paper key={post.id} withBorder shadow="sm" p="md" radius="md">
                                <Title order={3} mb={0}>{post.title}</Title>

                                <Text>
                                    {post.excerpt}
                                </Text>
                            </Paper>
                        ))}
                    </Stack>
                </Container>
            </AppShell>
        </MantineProvider>
    );
}