'use client'

import { useActionState } from 'react'
import { createChannel, updateChannel } from '@/app/actions/channels'

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

  return (
    <form action={formAction} className="space-y-4">
      {/* Name */}
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
          placeholder="Channel name"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Channel description"
        />
      </div>

      {/* Thumbnail URL */}
      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
          Thumbnail URL
        </label>
        <input
          id="thumbnail"
          name="thumbnail"
          type="url"
          defaultValue={defaultValues.thumbnail}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="https://example.com/thumbnail.jpg"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={defaultValues.categoryId}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        >
          <option value="">— Select a category —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Age Group */}
      <div>
        <label htmlFor="age_group_id" className="block text-sm font-medium text-gray-700 mb-1">
          Age Group
        </label>
        <select
          id="age_group_id"
          name="age_group_id"
          defaultValue={defaultValues.ageGroupId}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        >
          <option value="">— Select an age group —</option>
          {ageGroups.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.name}
            </option>
          ))}
        </select>
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
        {isPending ? 'Saving...' : id ? 'Update Channel' : 'Create Channel'}
      </button>
    </form>
  )
}
