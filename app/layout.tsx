import './globals.css'
import MobileNav from '@/components/MobileNav'
import SessionTimer from '@/components/SessionTimer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className="bg-black text-white antialiased pb-16 md:pb-0 min-h-screen relative">
        {children}
        <MobileNav />
        <SessionTimer floating={true} />
      </body>
    </html>
  )
}