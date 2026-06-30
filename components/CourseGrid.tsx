import { createClient } from '@/lib/supabase/server'
import CourseTile from './CourseTile'
import BentoGrid from './BentoGrid'

export default async function CourseGrid() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <p className="text-red-400">Unauthorized</p>
  }

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')

  if (error) return <p className="text-red-400">Error: {error.message}</p>
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-gray-900/40 border border-gray-800 border-dashed">
        <p className="text-xl font-medium text-gray-300 mb-2">No courses yet!</p>
        <p className="text-gray-500">You haven't started any courses. When you do, they'll appear right here.</p>
      </div>
    )
  }

  return (
    <BentoGrid>
      {data.map((course, i) => (
        <CourseTile key={course.id} course={course} index={i} />
      ))}
    </BentoGrid>
  )
}