import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// 定义剧情类型
export type Story = {
  id: string
  title: string
  description: string
  systemPrompt: string
  thumbnail?: string
}

// 预设剧情列表
const PRESET_STORIES: Story[] = [
  {
    id: "fantasy-adventure",
    title: "魔法世界冒险",
    description: "在一个充满魔法的世界中，你是一位初出茅庐的魔法学徒，需要完成各种任务来提升自己的能力。",
    systemPrompt: `title: 魔法世界冒险
worldBackground: |
  这是一个充满魔法的奇幻世界，这里有着各种神奇的魔法生物和强大的法师。魔法是这个世界运转的基础，而成为一名优秀的法师是许多年轻人的梦想。

introduction: |
  你即将开始一段魔法学徒的冒险之旅。作为魔法学院的新生，你需要通过完成各种任务来提升自己的魔法能力。

protagonist:
  name: 魔法学徒
  description: |
    一位刚入学的魔法学徒，对魔法充满热情和好奇。

initialSkills:
  魔法理论: 30
  法术施放: 20
  魔法感知: 25
  元素掌控: 15`,
    thumbnail: "https://source.unsplash.com/random/400x300/?magic"
  },
  {
    id: "cyberpunk-detective",
    title: "赛博朋克侦探",
    description: "在2077年的霓虹都市中，你是一名私家侦探，需要解开一系列神秘案件。",
    systemPrompt: `title: 赛博朋克侦探
worldBackground: |
  2077年，一个被霓虹灯和全息投影笼罩的未来都市。科技高度发达，但贫富差距巨大，犯罪率居高不下。

introduction: |
  作为一名私家侦探，你需要在这座充满危险的城市中调查各种案件，揭开隐藏在表面之下的真相。

protagonist:
  name: 赛博侦探
  description: |
    一位经验丰富的私家侦探，擅长使用各种高科技设备进行调查。

initialSkills:
  黑客技术: 35
  格斗能力: 25
  调查分析: 40
  社交技巧: 30`,
    thumbnail: "https://source.unsplash.com/random/400x300/?cyberpunk"
  }
]

interface StorySelectorProps {
  onSelectStory: (story: Story) => void
}

export function StorySelector({ onSelectStory }: StorySelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>选择你的冒险</CardTitle>
          <CardDescription>选择一个剧情开始你的冒险之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_STORIES.map((story) => (
                <Card 
                  key={story.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onSelectStory(story)}
                >
                  {story.thumbnail && (
                    <div 
                      className="w-full h-40 bg-cover bg-center rounded-t-lg" 
                      style={{ backgroundImage: `url(${story.thumbnail})` }}
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{story.title}</CardTitle>
                    <CardDescription>{story.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">选择此剧情</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 