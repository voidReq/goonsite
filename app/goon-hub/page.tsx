
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
  { value: 'macbook', label: <Link href="/macbook">Macbook</Link> },
  { value: 'notes', label: <Link href="/notes">Notes</Link> },
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
      <div style={{ padding: '20px', minHeight: '100vh' }}>
        <Title order={1} style={{ marginBottom: '20px' }}>Goon Hub</Title>
        <Paper withBorder p="md" radius="md">
          <Title order={3}>Site Navigation</Title>
          <Code block style={{ fontFamily: 'monospace' }}>
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
