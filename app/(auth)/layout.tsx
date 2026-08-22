import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <main className="w-full max-w-[480px]">
        <div className="flex justify-center mb-6">
          <Logo markSize={32} />
        </div>
        {children}
      </main>
    </div>
  );
}
