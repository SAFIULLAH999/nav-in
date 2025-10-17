import { CreatePostCard } from '@/components/CreatePostCard'
import { PostCard } from '@/components/PostCard'
import { mockPosts } from '@/data/mockData'

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreatePostCard />
      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
