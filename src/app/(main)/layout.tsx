// Removed Navbar and Footer imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Render only children, Navbar is now in the page
    // Footer can be added back here or inside the page if needed
    <>{children}</>
  );
}
