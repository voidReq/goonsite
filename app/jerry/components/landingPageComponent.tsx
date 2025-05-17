import { Container, Title, Text, Paper, Stack, AppShell, MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';
import NavComponent from "../components/navComponent";
import Link from "next/link";
import styles from "./landingPageComponent.module.css";
import { getPosts } from "../util/load-posts";


export default function LandingPageComponent({
    folder, title, desc
}: {
    folder: string,
    title: string,
    desc: string,
}) {
    const posts = getPosts(folder);
    return (
        <MantineProvider>
            <AppShell>
                <NavComponent />
                <Container size="sm" py="xl">
                    <Title order={1} mb="md">
                        {title}
                    </Title>
                    <Text c="gray.7" style={{ margin: "16px 0" }}>
                        {desc}
                    </Text>
                    <Stack>
                        {posts.map((post) => (
                            <Link href={`/jerry/${folder}/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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