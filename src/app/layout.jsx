import './globals.css'

export const metadata = {
  title: 'TM CON 2030 | Technology Media Conference | Abuja National Stadium',
  description:
    'Experience TM CON 2030 at Moshood Abiola National Stadium, Abuja in interactive 3D. Explore stages, reserve seating, discover brand pavilions, and tour the venue.',
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
