import './globals.css'

export const metadata = {
  title: 'TM CON 2030 (Portfolio Concept) | 3D Digital Twin Experience',
  description:
    'A personal portfolio 3D digital twin project demonstrating interactive Three.js, geospatial terrain, and stadium architecture at Moshood Abiola National Stadium, Abuja. Created as an independent creative side project showcase.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
