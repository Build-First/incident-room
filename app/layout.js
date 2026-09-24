export const metadata = {
  title: "The Incident Room",
  description: "Louvre, October 2025",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
