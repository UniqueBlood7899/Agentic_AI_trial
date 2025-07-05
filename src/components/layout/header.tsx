import { BoxSelect } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BoxSelect className="h-7 w-7 text-primary" />
            <span className="text-xl font-headline font-semibold">
              Sandbox AI
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
