import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/StateViews'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-md"
        >
          Back to Dashboard
        </button>
      }
    />
  )
}
