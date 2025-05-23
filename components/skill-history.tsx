"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, ArrowUp, ArrowDown } from "lucide-react"

type SkillChange = {
  name: string
  oldValue: number
  newValue: number
  change: number
  timestamp: Date
}

interface SkillHistoryProps {
  skillHistory: SkillChange[]
  onClose: () => void
}

export function SkillHistory({ skillHistory, onClose }: SkillHistoryProps) {
  // 按时间倒序排列，最新的变化在前面
  const sortedHistory = [...skillHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-purple-700">技能变化历史</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[400px]">
            {sortedHistory.length > 0 ? (
              <div className="space-y-4">
                {sortedHistory.map((change, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">{change.name}</span>
                      <span className="text-xs text-gray-500">{formatTime(change.timestamp)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600">{change.oldValue}</span>
                      <span className="mx-2">→</span>
                      <span className="font-bold">{change.newValue}</span>
                      <span
                        className={`ml-2 flex items-center ${change.change > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {change.change > 0 ? (
                          <>
                            <ArrowUp className="h-3 w-3 mr-1" />+{change.change}
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {change.change}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">暂无技能变化记录</div>
            )}
          </ScrollArea>
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
