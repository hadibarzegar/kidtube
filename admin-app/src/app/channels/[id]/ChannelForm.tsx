'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { createChannel, updateChannel } from '@/app/actions/channels'
import ImageUpload from '@/components/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tv } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface AgeGroup {
  id: string
  name: string
}

interface DefaultValues {
  name: string
  description: string
  thumbnail: string
  categoryId: string
  ageGroupId: string
}

interface Props {
  id: string | null
  defaultValues: DefaultValues
  categories: Category[]
  ageGroups: AgeGroup[]
}

export default function ChannelForm({ id, defaultValues, categories, ageGroups }: Props) {
  const action = id ? updateChannel.bind(null, id) : createChannel
  const [state, formAction, isPending] = useActionState(action, undefined)
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultValues.thumbnail)

  return (
    <form action={formAction}>
      <input type="hidden" name="thumbnail" value={thumbnailUrl} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — form fields */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaultValues.name}
                placeholder="Channel name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1.5">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={defaultValues.description}
                placeholder="Channel description"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium mb-1.5">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={defaultValues.categoryId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Select a category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Age Group */}
            <div>
              <label htmlFor="age_group_id" className="block text-sm font-medium mb-1.5">
                Age Group
              </label>
              <select
                id="age_group_id"
                name="age_group_id"
                defaultValue={defaultValues.ageGroupId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Select an age group —</option>
                {ageGroups.map((ag) => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Right column — thumbnail */}
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
                  <Tv className="w-8 h-8 text-muted-foreground" />
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
          {isPending ? 'Saving...' : id ? 'Update Channel' : 'Create Channel'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/channels">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
