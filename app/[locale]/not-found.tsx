import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">The page you are looking for doesn&apos;t exist.</p>
        <Link href="/dashboard">
          <Button className="mt-4">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}