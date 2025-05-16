import { Container, Title, Text, Paper, Stack, AppShell, MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';
import NavComponent from "../components/navComponent";
import fs from 'fs';
import matter from 'gray-matter';
import showdown from 'showdown';

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

// Reusable function to load and parse a markdown file
function loadMarkdownFile(filePath: string) {
    const markdownContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(markdownContent);
    const converter = new showdown.Converter();
    const html = converter.makeHtml(content);
    return { data, html };
}


export default function EastOfEdenPage() {
    return (
        <MantineProvider>
            <AppShell>
                <NavComponent />
                <Container size="md" py="xl">
                    <Title order={1} mb="md">
                        East of Eden
                    </Title>
                    <Text c="gray.7" style={{ margin: "16px 0" }}>
                        East of Eden is a book written by John Steinbeck. The book explores the intertwining history of two families, the Trasks and the Hamiltons, in California's Salinas Valley.
                        The book explores themes such as free will, the battle between good and evil, and the mysterious nature of love.
                    </Text>
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