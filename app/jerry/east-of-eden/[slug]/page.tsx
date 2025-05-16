import { Container, Title, Text, Paper, Stack, AppShell, MantineComponent, Group } from "@mantine/core";
import { MantineProvider } from "@mantine/core"
import { getPosts, getSpecificPost } from "../load-posts"
import NavComponent from "../../components/navComponent";

import "./styles.css";
import '@mantine/core/styles.css';

const posts = getPosts();

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const post = getSpecificPost(slug);
    return (
        <MantineProvider>
            <AppShell>
                <NavComponent />
                <Container size="sm" py="xl">
                    <Stack>
                        {
                            <Group>
                                <Title order={2} mb={"30"}>
                                    {post.title}
                                </Title>

                                <Text size="md" component="div">
                                    {post.content}
                                </Text>
                            </Group>
                        }
                    </Stack>
                </Container>
            </AppShell>
        </MantineProvider>
    )
}