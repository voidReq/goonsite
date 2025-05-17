import { Container, Title, Text, Paper, Stack, AppShell, MantineComponent, Group, Button, Flex, Divider } from "@mantine/core";
import { MantineProvider } from "@mantine/core"
import { getPosts, getSpecificPost } from "../util/load-posts"
import NavComponent from "./navComponent";

import '@mantine/core/styles.css';
import Link from "next/link";


export default (folder: string, defaultSlug = "") => async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    let { slug } = await params;

    slug = slug || defaultSlug;

    const posts = getPosts(folder);

    let post;
    try {
        post = getSpecificPost(folder, slug);
    } catch {
        return (
            <MantineProvider>
                <AppShell>
                    <NavComponent />
                    <Container>
                        Post not found
                    </Container>
                </AppShell>
            </MantineProvider>
        );
    }

    const index = posts.findIndex((post) => post.id === slug);
    const prevId = posts[index - 1]?.id;
    const nextId = posts[index + 1]?.id;

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
                    <Divider mt={"10rem"} mb="sm" />
                    <Flex justify="space-between" align="center">
                        <div>
                            {prevId && (
                                <Link href={`/jerry/${folder}/${prevId}`}>
                                    <Button
                                        size="lg"
                                        radius="md"
                                        variant="outline"
                                        style={{
                                            fontWeight: 600,
                                            padding: "12px 24px",
                                            borderWidth: "2px",
                                        }}
                                    >
                                        Previous
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <div>
                            {nextId && (
                                <Link href={`/jerry/${folder}/${nextId}`}>
                                    <Button
                                        size="lg"
                                        radius="md"
                                        variant="outline"
                                        style={{
                                            fontWeight: 600,
                                            padding: "12px 24px",
                                            borderWidth: "2px",
                                        }}
                                    >
                                        Next
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </Flex>
                </Container>
            </AppShell>
        </MantineProvider>
    );
};