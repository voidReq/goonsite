import { Container, Title, Text, Paper, Stack, AppShell, MantineProvider, MantineComponent, Blockquote } from "@mantine/core";


import fs from 'fs';
import matter from 'gray-matter';
import showdown from 'showdown';
import parse, { DOMNode } from 'html-react-parser';
import path from "path";

export const getPosts = (folder: string) => {
    const filesPath = path.join(process.cwd(), "app", "jerry", folder, "files");
    return fs.readdirSync(filesPath).map((fileName) => {
        return getSpecificPost(folder, fileName);
    }).sort((a, b) => a.order - b.order);
};

export const getSpecificPost = (folder: string, slug: string) => {
    const filesPath = path.join(process.cwd(), "app", "jerry", folder, "files");
    const filePath = path.join(filesPath, `${slug}`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const { data, content } = loadMarkdownFile(filePath);
    return {
        id: slug,
        order: data.order,
        title: data.title,
        content: content,
    };
};


// Map HTML tags to Mantine components
const components = {
    h1: (props: any) => <Title order={1} {...props} />,
    h2: (props: any) => <Title order={2} {...props} />,
    h3: (props: any) => <Title order={3} {...props} />,
    h4: (props: any) => <Title order={4} {...props} />,
    h5: (props: any) => <Title order={5} {...props} />,
    h6: (props: any) => <Title order={6} {...props} />,
    p: (props: any) => <Text {...props} />,
    blockquote: (props: any) => <Blockquote mb={30} {...props} />,
};


// Reusable function to load and parse a markdown file
function loadMarkdownFile(filePath: string) {
    const markdownContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(markdownContent);
    const converter = new showdown.Converter();
    const html = converter.makeHtml(content);

    const parsedHtml = parse(html, {
        replace: (domNode: DOMNode) => {
            return htmlToMantine(domNode);
        },
    });

    return { data: { order: Number(data.order) || Infinity, title: data.title }, content: parsedHtml };
}

function htmlToMantine(domNode: DOMNode) {
    if (domNode.type === 'tag' && components[domNode.name as keyof typeof components]) {
        const Component = components[domNode.name as keyof typeof components];
        return <Component key={0}>{
            domNode.children.map((child) => {
                if (child.type == "tag") {
                    return htmlToMantine(child as DOMNode);
                } else if (child.type == "text") {
                    return child.data;
                }
            })
        }</Component>;
    }
}