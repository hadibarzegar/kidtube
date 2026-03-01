'use client'

import { useActionState } from 'react'
import { createAgeGroup, updateAgeGroup } from '@/app/actions/age-groups'

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
  const action = id
    ? updateAgeGroup.bind(null, id)
    : createAgeGroup

  const [state, formAction, isPending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Age group name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-1">
            Min Age <span className="text-red-500">*</span>
          </label>
          <input
            id="min_age"
            name="min_age"
            type="number"
            required
            min={0}
            defaultValue={defaultValues.min_age}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-1">
            Max Age <span className="text-red-500">*</span>
          </label>
          <input
            id="max_age"
            name="max_age"
            type="number"
            required
            min={1}
            defaultValue={defaultValues.max_age}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="18"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : id ? 'Update Age Group' : 'Create Age Group'}
      </button>
    </form>
  )
}
