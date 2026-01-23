import { Badge } from '@/components/ui/badge'

interface ProviderPillProps {
  name: string
  logo?: string
}

const providerColors: Record<string, string> = {
  'OpenAI': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  'Anthropic': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  'Google': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  'Groq': 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  'Gemini': 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  'Claude': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
  'Default': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function ProviderPill({ name, logo }: ProviderPillProps) {
  const colorClass = providerColors[name] || providerColors['Default']

  return (
    <Badge className={`font-medium ${colorClass}`}>
      {logo && <span className="mr-1">{logo}</span>}
      {name}
    </Badge>
  )
}
