'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { createCategory, updateCategory } from '@/app/actions/categories'
import ImageUpload from '@/components/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen } from 'lucide-react'

interface Props {
  id: string | null
  defaultName: string
  defaultThumbnail: string
}

export default function CategoryForm({ id, defaultName, defaultThumbnail }: Props) {
  const action = id ? updateCategory.bind(null, id) : createCategory
  const [state, formAction, isPending] = useActionState(action, undefined)
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultThumbnail)

  return (
    <form action={formAction}>
      <input type="hidden" name="thumbnail" value={thumbnailUrl} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaultName}
                placeholder="Category name"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              {thumbnailUrl ? (
                <div className="mb-3">
                  <img
                    src={thumbnailUrl.startsWith('/images/') ? `/api/admin${thumbnailUrl}` : thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full aspect-video rounded-md border object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center mb-3">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} label="" />
            </CardContent>
          </Card>
        </div>
      </div>

      {state?.error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : id ? 'Update Category' : 'Create Category'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/categories">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
