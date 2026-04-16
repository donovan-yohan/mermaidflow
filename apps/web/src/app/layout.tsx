import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArielCharts',
  description: 'Collaborative Mermaid diagrams with MCP agent integration.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
