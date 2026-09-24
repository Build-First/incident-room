export const metadata = {
  title: "Le Dossier — Affaire Apollon",
  description: "An evidence board for the October 2025 Louvre theft.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
