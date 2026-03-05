'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createAgeGroup, updateAgeGroup } from '@/app/actions/age-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DefaultValues {
  name: string
  min_age: number
  max_age: number
}

interface Props {
  id: string | null
  defaultValues: DefaultValues
}

export default function AgeGroupForm({ id, defaultValues }: Props) {
  const action = id ? updateAgeGroup.bind(null, id) : createAgeGroup
  const [state, formAction, isPending] = useActionState(action, undefined)

  return (
    <form action={formAction}>
      <Card className="max-w-lg">
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
              defaultValue={defaultValues.name}
              placeholder="Age group name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="min_age" className="block text-sm font-medium mb-1.5">
                Min Age <span className="text-destructive">*</span>
              </label>
              <Input
                id="min_age"
                name="min_age"
                type="number"
                required
                min={0}
                defaultValue={defaultValues.min_age}
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="max_age" className="block text-sm font-medium mb-1.5">
                Max Age <span className="text-destructive">*</span>
              </label>
              <Input
                id="max_age"
                name="max_age"
                type="number"
                required
                min={1}
                defaultValue={defaultValues.max_age}
                placeholder="18"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : id ? 'Update Age Group' : 'Create Age Group'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/age-groups">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
