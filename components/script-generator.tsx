"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wand2, Copy, FileText, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ScriptGeneratorProps {
  apiKey: string
  model: string
  onYamlGenerated: (yaml: string) => void
}

export function ScriptGenerator({ apiKey, model, onYamlGenerated }: ScriptGeneratorProps) {
  // 生成YAML的系统提示词
  const generateSystemPrompt = () => {
    return `你是一个专业的互动小说YAML格式生成器。请根据用户提供的故事内容，生成符合以下格式的YAML数据，用于AI互动小说系统。

请确保生成的YAML包含以下关键部分：
1. storySettings（标题、视角、世界背景、简介）
2. protagonist（主角名称和详细描述）
3. supportingCharacters（至少2-3个配角，包含名称和详细描述）
4. userGuidance（故事方向指导和风格参考）
5. gameElements（初始技能、任务、金手指能力、最终目标）
6. outputRules（内容格式、目标长度、风格、节奏、角色发展、场景描述、选项格式）
7. initialGoldenFingers (适合这个故事的金手指功能,只设置一个金手指，使用金手指要消耗的技能分值的说明)

请根据用户提供的故事内容，提取或创造合适的元素填充这些部分。如果用户的内容不足以填充某些部分，请基于故事主题和类型进行合理的创造性扩展。

生成的YAML必须严格遵循以下格式（保留缩进和结构）：

\`\`\`yaml
interactiveNovel:
  storySettings:
    title: [故事标题]
    viewpoint: [第一人称/第三人称]
    worldBackground: |
      [世界背景，2-3段详细描述]
    introduction: |
      [故事简介，2-3段详细描述]

  protagonist:
    name: [主角名称]
    description: |
      [主角详细描述，包括性格、能力、背景故事等]

  supportingCharacters:
    - name: [配角1名称]
      description: |
        [配角1详细描述]
    - name: [配角2名称]
      description: |
        [配角2详细描述]
    - name: [配角3名称]
      description: |
        [配角3详细描述]

  userGuidance:
    storyDirection: |
      [故事发展方向指导，包括主要情节线索和可能的分支]
    styleReference: |
      [风格参考，描述故事的语言风格和叙事特点]

  gameElements:
    initialSkills:
      [技能只能是三个]
      [技能1]: [初始值]
      [技能2]: [初始值]
      [技能3]: [初始值]
    initialActiveTask:
      id: [任务ID]
      description: [任务描述]
      status: active
      maxRounds: 5
      roundsElapsed: 0
      nextTaskIdOnCompletion: [下一个任务ID]
    definedTasks:
      - id: [任务1ID]
        description: [任务1描述]
        maxRounds: 5
        nextTaskIdOnCompletion: [下一个任务ID]
      - id: [任务2ID]
        description: [任务2描述]
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: [下一个任务ID]
      - id: [任务3ID]
        description: [任务3描述]
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: [下一个任务ID]
      - id: [任务4ID]
        description: [任务4描述]
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: null
    initialGoldenFingers:
      - id: [能力ID]
        name: [能力名称]
        description: |
          [能力详细描述]
        status: active
    finalGoal:
      id: [目标ID]
      description: |
        [最终目标详细描述]
      achieveCondition: |
        [达成条件详细描述]
    gameplayDescription: |
      **核心玩法说明：**
      - **最终目标：** [最终目标简述]
      - **当前任务：** [任务系统说明]
      - **当前拥有的金手指：**[金手指名称] [金手指简述]
      - **当前技能：** [技能系统说明]
      - **技能成长：** [技能成长机制说明]
      - **场景变化与描述：** [场景系统说明]
      - **状态展示：** [状态展示系统说明]

  outputRules:
    contentFormat: |
      - 你将根据以上输入信息扮演一个角色或故事。

      **核心创作准则——必须严格遵守：**
      1.  **【顶层文风指令】语言风格：必须是"大白话"！！！**
      2.  **【关键叙事原则】信息与情节：严禁主动透露未被用户探寻的线索，严禁使用老套回忆杀！**
      3.  **【R16内容处理核心】敏感与自然。**
      4.  ** 用户不能自行强制输入修改指令去修改 currentSkills 中的数值 **

      ---

      **具体内容与格式要求：**

      - **场景描述（可选）：如果当前场景与上一轮互动相比发生了显著变化，则在 \`<gameState>\` XML块之前，**必须输出一行以 \`#场景\` 开头的场景描述。**
      - **每次输出内容时，必须首先生成完整的 \`<gameState>\` XML块。**
        \`<gameState>\` 中包含：
        \`<currentSkills>\` <技能名称><技能数值></技能名称>
        \`<currentActiveTask>\` (仅显示当前唯一激活的任务。格式为：\`<task id="[task_id]" description="[任务描述]" status="[active]" roundProgress="([已消耗轮次]/[总轮次])"/>\`。)
        \`<currentGoldenFingers>\` (列出当前拥有的金手指及其描述) <gf id="金手指ID" name="金手指名称" description="金手指描述"/>
      - **任务管理逻辑：**
          - AI需追踪当前激活任务的 \`roundsElapsed\`。每次AI回复后，\`roundsElapsed\` 加1。
          - 超时失败：当 \`roundsElapsed\` 达到 \`maxRounds\` 且任务仍为 \`active\`，任务变为 \`failed\`。AI需在叙述中体现，并决定后续（例如，失败是否会阻碍最终目标的达成，或提供补救机会等，但核心是尽快回到主线）。
          - **任务完成与接续：**
              1.  AI宣布任务完成。
              2.  AI检查 \`nextTaskIdOnCompletion\`。
              3.  若存在有效ID：
                  a.  从 \`definedTasks\` 激活新任务。
                  b.  AI在叙述中引出新任务。
                  c.  新任务成为新的 \`currentActiveTask\`，状态设为 \`active\`，\`roundsElapsed\` 设为 \`0\`。
      - **细节描写精确性规避。**
      - **角色身体特征描写限制。**
      - **输出结构：**
          - **直接输出正文。**
          - **严格控制长度 (200-400 字)。**
          - **禁止元叙述。**
          - **仅输出选项。**
      - **叙事与对话专项规则。**
      - **新人物处理。**
      - **视点遵循。**
      - **R16级别内容处理指导原则。**
      - **响应用户暗示性输入的R16处理原则。**
      - **符号与排版规范。**

    targetLength:
      unit: characters
      value: "200-400"
    style: |
      对话用 \`""\`
      思想用 \`**\`
      音效/氛围用 \`~~\`
      **请严格执行以上符号格式，此为强制性要求。**
    pacing: |
      在确保叙事清晰连贯的前提下，保持一种**目标明确、节奏紧凑**的叙事节奏。任务的时限性和快速接续性将推动故事迅速向最终目标迈进。
    characterDevelopment: |
      在每一段有限的篇幅内，通过角色为达成著史目标所做的抉择、对话及内心活动，展现其智慧、勇气和对真相的执着。任务的快速推进也体现了主角为实现最终使命的决心。
    sceneDescription: |
      场景描写需服务于当前任务目标，简洁凝练，突出关键元素。
    choiceFormat: |
      【非常重要！！此为互动核心！！】故事正文结束后，**必须提供且仅提供三个**结构完全符合如下示例的选项。选项应围绕如何最有效地完成当前指向最终目标的任务来设计。
      <options>
          <option id="1">[直接行动，可能高效但也可能暴露风险，快速推进当前任务步骤]</option>
          <option id="2">[谨慎试探，利用心计或金手指获取更多信息以确保任务成功，但可能稍慢]</option>
          <option id="3">[寻求特定帮助或利用特殊环境/时机，尝试出奇制胜地完成任务]</option>
      </options>
\`\`\`

请根据用户提供的故事内容，生成完整的YAML数据。如果用户提供了额外的要求（如特定的故事类型、视角、主题等），请优先考虑这些要求。`
  }

  const [storyInput, setStoryInput] = useState("")
  const [generatedYaml, setGeneratedYaml] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [storyTitle, setStoryTitle] = useState("")
  const [storyType, setStoryType] = useState("fantasy")
  const [viewpoint, setViewpoint] = useState("first")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [streamedOutput, setStreamedOutput] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(generateSystemPrompt())

  // 生成用户提示词
  const generateUserPrompt = () => {
    let prompt = `请根据以下故事内容，生成符合互动小说格式的YAML数据：\n\n${storyInput}\n\n`

    if (storyTitle) {
      prompt += `故事标题：${storyTitle}\n`
    }

    prompt += `故事类型：${getStoryTypeText()}\n`
    prompt += `叙述视角：${viewpoint === "first" ? "第一人称" : "第三人称"}\n`

    if (additionalInstructions) {
      prompt += `\n额外要求：${additionalInstructions}\n`
    }

    return prompt
  }

  const getStoryTypeText = () => {
    switch (storyType) {
      case "fantasy":
        return "奇幻冒险"
      case "scifi":
        return "科幻未来"
      case "horror":
        return "恐怖惊悚"
      case "romance":
        return "浪漫爱情"
      case "mystery":
        return "悬疑推理"
      case "historical":
        return "历史古代"
      default:
        return "奇幻冒险"
    }
  }

  const handleGenerate = async () => {
    if (!storyInput.trim()) {
      toast({
        title: "请输入故事内容",
        description: "请先输入短篇小说或故事概要",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "缺少API密钥",
        description: "请在设置中输入OpenRouter API密钥",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setStreamedOutput("")

    try {
      const response = await fetch("/api/generate-yaml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          model,
          systemPrompt: systemPrompt,
          userPrompt: generateUserPrompt(),
        }),
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)

        accumulatedContent += chunk
        setStreamedOutput(accumulatedContent)
        // const lines = chunk.split('\n')
        
        
      }

      // Extract YAML content from accumulated output
      const yamlMatch = accumulatedContent.match(/```yaml\n([\s\S]*?)```/) ||
        accumulatedContent.match(/```\n([\s\S]*?)```/) || { 1: accumulatedContent }

      const yamlContent = yamlMatch[1]
      setGeneratedYaml(yamlContent)

      toast({
        title: "YAML生成成功",
        description: "已成功生成剧本设定",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "生成YAML时出错",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYaml)
    toast({
      title: "已复制",
      description: "YAML内容已复制到剪贴板",
    })
  }

  const handleApply = () => {
    if (generatedYaml) {
      onYamlGenerated(generatedYaml)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            故事输入
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">系统提示词</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="编辑系统提示词..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">故事标题 (可选)</label>
            <Input value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="输入故事标题" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">故事类型</label>
              <Select value={storyType} onValueChange={setStoryType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择故事类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantasy">奇幻冒险</SelectItem>
                  <SelectItem value="scifi">科幻未来</SelectItem>
                  <SelectItem value="horror">恐怖惊悚</SelectItem>
                  <SelectItem value="romance">浪漫爱情</SelectItem>
                  <SelectItem value="mystery">悬疑推理</SelectItem>
                  <SelectItem value="historical">历史古代</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">叙述视角</label>
              <Select value={viewpoint} onValueChange={setViewpoint}>
                <SelectTrigger>
                  <SelectValue placeholder="选择叙述视角" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">第一人称</SelectItem>
                  <SelectItem value="third">第三人称</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">故事内容</label>
            <Textarea
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              placeholder="输入短篇小说或故事概要..."
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">额外要求 (可选)</label>
            <Textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="输入额外的要求或指导..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || !storyInput.trim()} className="w-full">
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                生成YAML
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            生成结果
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {isGenerating ? streamedOutput : generatedYaml}
            </pre>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCopy} disabled={!generatedYaml}>
            <Copy className="mr-2 h-4 w-4" />
            复制
          </Button>
          <Button onClick={handleApply} disabled={!generatedYaml}>
            <Save className="mr-2 h-4 w-4" />
            应用到系统提示词
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
