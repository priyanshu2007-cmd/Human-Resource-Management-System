import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-10 bg-background px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo markSize={36} />
        <p className="text-sm text-muted-foreground">Every workday, perfectly aligned.</p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Phase 1 — Scaffold check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Next.js + Tailwind + shadcn/ui are wired up with the Dayflow design tokens
            (Archivo / JetBrains Mono, violet accent, status colors). Supabase
            client/server/admin helpers and session middleware are in place —
            connect real project credentials in <code>.env.local</code> before Phase 2.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="present" />
            <StatusBadge status="absent" />
            <StatusBadge status="half-day" />
            <StatusBadge status="leave" />
            <StatusBadge status="pending" />
            <StatusBadge status="approved" />
            <StatusBadge status="rejected" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>

          <Input placeholder="Search by name, department or Login ID" />
        </CardContent>
      </Card>
    </div>
  );
}
