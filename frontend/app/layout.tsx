import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI DevOps Assistant | DevFest Pwani 2025',
  description: 'AI-powered DevOps assistant for analyzing system logs and debugging production issues',
  keywords: ['AI', 'DevOps', 'Cloud Logging', 'Vertex AI', 'Firebase Genkit'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

