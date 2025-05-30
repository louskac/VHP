import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VHP - Verified Human Protocol',
  description: 'Web3 CAPTCHA alternative using challenge-based verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}