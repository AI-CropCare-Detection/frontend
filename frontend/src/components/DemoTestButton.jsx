import { FlaskConical } from 'lucide-react'

export default function DemoTestButton({ onDemoClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onDemoClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors border-2 border-purple-500"
      title="Test the analysis feature with a demo image"
    >
      <FlaskConical size={18} />
      <span>Test Analysis (Demo)</span>
    </button>
  )
}
