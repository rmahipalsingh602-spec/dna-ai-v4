import "./globals.css";

export const metadata = {
  title: "DNA Ultra AI V4",
  description: "Next-gen AI assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
