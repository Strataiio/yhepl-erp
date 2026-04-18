import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

export default function Page() {
  return (
    <div className="p-6 max-w-6xl">
      <PageHeader title="hr" subtitle="Building next session" />
      <Card>
        <p className="text-sm text-gray-500 py-8 text-center">
          Module coming soon.
        </p>
      </Card>
    </div>
  )
}
