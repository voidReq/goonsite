import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Message Board",
  description: "Leave a message on goonsite.org — beat the bot in tic-tac-toe, connect four, or chess to earn your spot.",
};

export default function MessageBoardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
