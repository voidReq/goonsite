
"use client";
import { MantineProvider, Text, Paper, Title, Code } from '@mantine/core';
import '@mantine/core/styles.css';
import Link from 'next/link';

interface TreeDataItem {
  value: string;
  label: React.ReactNode;
  children?: TreeDataItem[];
}

const treeData: TreeDataItem[] = [
  { value: 'home', label: <Link href="/">Home</Link> },
  {
    value: 'goon-hub',
    label: <Link href="/goon-hub">Goon Hub</Link>,
    children: [
      { value: 'goon-sploit', label: <Link href="/goon-sploit">Goon-sploit</Link> }]
  },
  {
    value: 'james',
    label: <Link href="/james">James</Link>,
    children: [
      { value: 'james-articles', label: <Link href="/james/Articles">Articles</Link> },
      { value: 'james-documentary', label: <Link href="/james/Documentary">Documentary</Link> },
      { value: 'james-eastofeden', label: <Link href="/james/EastOfEden">East of Eden</Link> },
      { value: 'james-senseofwonder', label: <Link href="/james/SenseOfWonder">Sense of Wonder</Link> }
    ]
  },
  {
    value: 'jerry',
    label: <Link href="/jerry">Jerry</Link>,
    children: [
      { value: 'jerry-east-of-eden', label: <Link href="/jerry/east-of-eden">East of Eden</Link> },
      { value: 'jerry-non-fiction', label: <Link href="/jerry/non-fiction">Non-Fiction</Link> },
      { value: 'jerry-painter-thief', label: <Link href="/jerry/painter-thief">The Painter and the Thief</Link> },
      { value: 'jerry-short-non-fiction', label: <Link href="/jerry/short-non-fiction">Short Non-Fiction</Link> }
    ]
  },
  { value: 'macbook', label: <Link href="/macbook">Macbook</Link> },
  { value: 'revolutions', label: <Link href="/revolutions">Revolutions</Link> },
  { value: 'turtle', label: <Link href="/turtle">Turtle</Link> },
];

const renderTree = (nodes: TreeDataItem[]) => (
  <ul style={{ listStyleType: 'none', paddingLeft: '20px' }}>
    {nodes.map((node) => (
      <li key={node.value}>
        <Text>{node.children ? '\u251c\u2500\u2500' : '\u2514\u2500\u2500'} {node.label}</Text>
        {node.children && renderTree(node.children)}
      </li>
    ))}
  </ul>
);

export default function GoonHub() {
  return (
    <MantineProvider forceColorScheme="dark">
      <div style={{ padding: '20px' }}>
        <Title order={1} style={{ marginBottom: '20px' }}>Goon Hub</Title>
        <Paper withBorder p="md" radius="md" style={{ backgroundColor: '#1a1b26' }}>
          <Title order={3} style={{ color: '#a9b1d6' }}>Site Navigation</Title>
          <Code block style={{ backgroundColor: '#1a1b26', color: '#a9b1d6', fontFamily: 'monospace' }}>
            <div>
              <span style={{ color: '#bb9af7' }}>user@goonsite</span>
              <span style={{ color: '#7dcfff' }}>:</span>
              <span style={{ color: '#c0caf5' }}>~</span>
              <span style={{ color: '#7dcfff' }}>$</span>
              <span> tree</span>
            </div>
            {renderTree(treeData)}
          </Code>
        </Paper>
      </div>
    </MantineProvider>
  );
}
