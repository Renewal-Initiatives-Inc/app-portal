import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-primary">
          App Portal
        </h1>
        <p className="text-lg text-muted-foreground">
          Renewal Initiatives Internal Application Portal
        </p>
        <div className="flex gap-4">
          <Button>Sign In</Button>
        </div>
      </main>
    </div>
  );
}
