import { Navbar } from '@/components/Navbar';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eeeef8] text-[#1a1a2e]">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
