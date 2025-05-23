"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, CheckCircle2 } from "lucide-react"

interface TaskInfoProps {
  task: {
    description: string
    progress: string
  } | null
  skills: Record<string, number>,
  goldenFingers: {
    id: string
    name: string
    description: string
  }[],
  onClose: () => void
}

export function TaskInfo({ task, skills, goldenFingers,onClose }: TaskInfoProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            游戏状态
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 技能显示 */}
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">角色技能</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(skills).length > 0 ? (
                Object.entries(skills).map(([skill, value]) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-gray-100"
                  >
                    <span className="font-medium text-gray-700">{skill}</span>
                    <span className="font-bold text-purple-700">{value}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-2 text-center text-gray-500">暂无技能数据</div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold">金手指：</h4>
            {goldenFingers && goldenFingers.length > 0 ? (
              <div className="bg-white p-2 rounded">
                <p className="font-medium">{goldenFingers[0]?.name || "未知金手指"}</p>
                <p className="text-sm">{goldenFingers[0]?.description || ""}</p>
              </div>
            ) : (
              <div className="bg-white p-2 rounded">
                <p className="text-sm">暂无金手指</p>
              </div>
            )}
          </div>

          {/* 任务显示 */}
          {task ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="font-semibold text-green-800 mb-2">当前任务</h3>
              <p className="text-gray-700">{task.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">进度：</span>
                <span className="font-bold text-green-700">{task.progress}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">当前任务</h3>
              <p className="text-gray-500 italic">暂无活跃任务</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4">
          <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700">
            关闭
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
