/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ROLE_LABELS } from '@/lib/roles'
import { BUCKET_STATUS_COLORS, PROJECT_STATUS_COLORS, formatDate } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { full_name: string; role: string } | null
  const role = (profile?.role ?? 'worker') as UserRole

  const [
    { count: projectCount },
    { count: activeBuckets },
    { count: openNcr },
    { data: recentProjects },
    { data: bucketLive },
    { data: stationConstraints },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true })
      .in('status', ['planning', 'in_production', 'qc_pending']),
    supabase.from('buckets').select('*', { count: 'exact', head: true })
      .in('status', ['wip', 'waiting']),
    supabase.from('ncr').select('*', { count: 'exact', head: true })
      .in('status', ['open', 'under_capa']),
    supabase.from('projects')
      .select('project_code, name, status, delivery_date')
      .in('status', ['planning', 'in_production', 'qc_pending'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('v_bucket_live').select('*').limit(6),
    supabase.from('v_station_constraints').select('*').limit(6),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={`${ROLE_LABELS[role]} · ${new Date().toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long',
        })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active projects" value={projectCount ?? 0} sub="Planning · Production · QC" />
        <StatCard label="Buckets in shop" value={activeBuckets ?? 0} sub="WIP + Waiting" />
        <StatCard label="Open NCRs" value={openNcr ?? 0} sub="Pending CAPA" />
        <StatCard
          label="Today"
          value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          sub={new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Active projects</h2>
            <a href="/projects" className="text-xs text-teal-600 hover:underline">View all →</a>
          </div>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-2.5">
              {(recentProjects as any[]).map((p) => (
                <div key={p.project_code}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.project_code}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{p.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${PROJECT_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.delivery_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No active projects yet</p>
              <a href="/projects" className="text-xs text-teal-600 hover:underline mt-1 block">Create first project →</a>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Live production</h2>
            <a href="/production" className="text-xs text-teal-600 hover:underline">Floor view →</a>
          </div>
          {bucketLive && bucketLive.length > 0 ? (
            <div className="space-y-2.5">
              {(bucketLive as any[]).map((b, i) => (
                <div key={b.id ?? i}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.bucket_code}</p>
                    <p className="text-xs text-gray-500">{b.process_name} · {b.station_name ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BUCKET_STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{b.project_code}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No active buckets</p>
            </div>
          )}
        </Card>
      </div>

      {stationConstraints && (stationConstraints as any[]).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Station load</h2>
            <span className="text-xs text-gray-400">Queue depth vs daily capacity</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {(stationConstraints as any[]).map((s, i) => {
              const queueHrs = parseFloat(s.queue_hours ?? 0)
              const capacity = parseFloat(s.daily_capacity_hrs ?? 8)
              const loadPct = capacity > 0 ? Math.min(Math.round((queueHrs / capacity) * 100), 100) : 0
              const isConstraint = loadPct > 80
              return (
                <div key={s.station_id ?? i} className={`rounded-lg p-3 border ${isConstraint ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-700 truncate">{s.station_name}</p>
                    {isConstraint && <span className="text-xs text-red-600 font-bold ml-1">!</span>}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${loadPct > 80 ? 'bg-red-500' : loadPct > 50 ? 'bg-amber-400' : 'bg-teal-500'}`} style={{ width: `${loadPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>WIP: {s.active_wip_count ?? 0}</span>
                    <span>Queue: {s.queue_count ?? 0}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
