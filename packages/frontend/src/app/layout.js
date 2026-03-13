import "./globals.css";

export const metadata = {
  title: "Bellet AI Commerce | Panel de Control",
  description: "Sistema de automatización comercial con IA para Cosméticos Bellet",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
