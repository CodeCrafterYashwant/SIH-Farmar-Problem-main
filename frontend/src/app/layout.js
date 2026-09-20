import './globals.css';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';

export const metadata = {
  title: 'SIH26032 | Smart Procurement Platform for Farmers',
  description: 'Streamlined grain procurement, queue management, and transparent payments for farmers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
