'use client'

import { useActionState } from 'react'
import { createCategory, updateCategory } from '@/app/actions/categories'

interface Props {
  id: string | null
  defaultName: string
}

export default function CategoryForm({ id, defaultName }: Props) {
  const action = id
    ? updateCategory.bind(null, id)
    : createCategory

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
          defaultValue={defaultName}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Category name"
        />
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
        {isPending ? 'Saving...' : id ? 'Update Category' : 'Create Category'}
      </button>
    </form>
  )
}
