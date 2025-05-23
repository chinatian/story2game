"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface StoryIntroProps {
  title: string
  worldBackground: string
  introduction: string
  protagonist: {
    name: string
    description: string
  }
  onCloseModal: () => void
  onStartAdventure: () => void
}

export function StoryIntro({
  title,
  worldBackground,
  introduction,
  protagonist,
  onCloseModal,
  onStartAdventure,
}: StoryIntroProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-purple-700">{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCloseModal}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-600">世界背景</h3>
              <p className="text-gray-700 whitespace-pre-line">{worldBackground}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-600">故事简介</h3>
              <p className="text-gray-700 whitespace-pre-line">{introduction}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-600">主角：{protagonist.name}</h3>
              <p className="text-gray-700 whitespace-pre-line">{protagonist.description}</p>
            </div>
          </CardContent>
        </ScrollArea>

        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={onCloseModal}>
            关闭
          </Button>
          <Button onClick={onStartAdventure} className="bg-purple-600 hover:bg-purple-700">
            开始冒险
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
