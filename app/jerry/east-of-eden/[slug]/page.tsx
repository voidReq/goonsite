import { Container, Title, Text, Paper, Stack, AppShell, MantineComponent, Group, Button, Flex, Divider } from "@mantine/core";
import { MantineProvider } from "@mantine/core"
import { getPosts, getSpecificPost } from "../load-posts"
import NavComponent from "../../components/navComponent";

import "./styles.css";
import '@mantine/core/styles.css';
import Link from "next/link";

const posts = getPosts();

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    let post;
    try {
        post = getSpecificPost(slug);
    } catch {
        return 'post not found';
    }

    const index = posts.findIndex((post) => post.id === slug);
    const prevId = posts[index - 1]?.id;
    const nextId = posts[index + 1]?.id;
    console.log(prevId, nextId);

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
                                <Link href={`/jerry/east-of-eden/${prevId}`}>
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
                                <Link href={`/jerry/east-of-eden/${nextId}`}>
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
    )
}