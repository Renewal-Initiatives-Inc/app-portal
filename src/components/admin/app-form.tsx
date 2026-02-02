'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createAppAction,
  updateAppAction,
  type ActionResult,
} from '@/app/admin/apps/actions';
import { toast } from 'sonner';
import type { App } from '@/lib/db/apps';

interface AppFormProps {
  app?: App;
  mode: 'create' | 'edit';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AppForm({ app, mode }: AppFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(app?.name || '');
  const [slug, setSlug] = useState(app?.slug || '');
  const [description, setDescription] = useState(app?.description || '');
  const [appUrl, setAppUrl] = useState(app?.appUrl || '');
  const [iconUrl, setIconUrl] = useState(app?.iconUrl || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!app);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Auto-generate slug from name (only in create mode, unless manually edited)
  useEffect(() => {
    if (mode === 'create' && !slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, mode, slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use PNG, JPEG, WebP, or SVG.');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await response.json();
      setIconUrl(url);
      toast.success('Icon uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload icon'
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveIcon = () => {
    setIconUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('appUrl', appUrl);
      formData.append('iconUrl', iconUrl);

      let result: ActionResult;

      if (mode === 'create') {
        result = await createAppAction(formData);
      } else {
        result = await updateAppAction(app!.id, formData);
      }

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'App created successfully'
            : 'App updated successfully'
        );
        router.push('/admin/apps');
        router.refresh();
      } else {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        }
        toast.error(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="app-form">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Application"
              data-testid="app-name-input"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-application"
              className="font-mono"
              data-testid="app-slug-input"
            />
            <p className="text-xs text-muted-foreground">
              Used for permissions (e.g., app:{slug || 'my-application'}).
              {mode === 'edit' && (
                <span className="text-amber-600 block mt-1">
                  Warning: Changing the slug may break existing role assignments.
                </span>
              )}
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of what this app does..."
              rows={3}
              data-testid="app-description-input"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description[0]}</p>
            )}
          </div>

          {/* App URL */}
          <div className="space-y-2">
            <Label htmlFor="appUrl">
              App URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appUrl"
              type="url"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://myapp.renewalinitiatives.org"
              data-testid="app-url-input"
            />
            {errors.appUrl && (
              <p className="text-sm text-destructive">{errors.appUrl[0]}</p>
            )}
          </div>

          {/* Icon Upload */}
          <div className="space-y-2">
            <Label>Icon (optional)</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="flex-shrink-0">
                {iconUrl ? (
                  <div className="relative">
                    <img
                      src={iconUrl}
                      alt="App icon preview"
                      className="h-16 w-16 rounded-lg object-cover border"
                      data-testid="app-icon-preview"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90"
                      title="Remove icon"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                    <AppWindow className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleIconUpload}
                  className="hidden"
                  id="icon-upload"
                  data-testid="app-icon-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Icon
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPEG, WebP, or SVG. Max 1MB.
                </p>
              </div>
            </div>
            {errors.iconUrl && (
              <p className="text-sm text-destructive">{errors.iconUrl[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="submit-app">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : mode === 'create' ? (
            'Create App'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
