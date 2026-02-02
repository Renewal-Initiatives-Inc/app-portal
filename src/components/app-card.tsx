'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { logAppAccessAction } from '@/app/actions/log-app-access';

export interface AppCardProps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  appUrl: string;
}

/**
 * Icon fallback component - displays first letter of app name
 */
function IconFallback({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-semibold text-primary-foreground"
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}

/**
 * App card component for displaying an application in the portal grid
 */
export function AppCard({
  id,
  slug,
  name,
  description,
  iconUrl,
  appUrl,
}: AppCardProps) {
  const handleClick = () => {
    // Log app access asynchronously - don't block navigation
    logAppAccessAction(id);
  };

  return (
    <a
      href={appUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      data-testid={`app-card-${slug}`}
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt=""
              width={48}
              height={48}
              className="rounded-lg"
            />
          ) : (
            <IconFallback name={name} />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg" data-testid={`app-card-title-${id}`}>
              {name}
            </CardTitle>
            {description && (
              <CardDescription
                className="line-clamp-2 mt-1"
                data-testid={`app-card-description-${id}`}
              >
                {description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="text-sm text-muted-foreground">Open app</span>
        </CardContent>
      </Card>
    </a>
  );
}
