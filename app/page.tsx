"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Ghost,
  Send,
  Settings,
  MessageSquare,
  Info,
  CheckCircle2,
  Wand2,
  ListTodo,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { parseGameState, parseOptions } from "@/lib/parser"
import { StoryIntro } from "@/components/story-intro"
import { TaskInfo } from "@/components/task-info"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ScriptGenerator } from "@/components/script-generator"
import { SkillsDisplay } from "@/components/skills-display"

// 定义技能变化类型
type SkillChange = {
  name: string
  oldValue: number
  newValue: number
  change: number
}

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("google/gemini-2.5-flash-preview")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<any>(null)
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([])
  const [scene, setScene] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [showIntro, setShowIntro] = useState(true) // 默认显示介绍
  const [showTaskInfo, setShowTaskInfo] = useState(false) // 控制任务信息弹窗
  const [hasShownIntro, setHasShownIntro] = useState(false) // 跟踪是否已经显示过介绍
  const [taskChanged, setTaskChanged] = useState(false)
  const [newTask, setNewTask] = useState<any>(null)
  const [previousSkills, setPreviousSkills] = useState<Record<string, number>>({}) // 存储上一次的技能值
  const [skillChanges, setSkillChanges] = useState<SkillChange[]>([]) // 存储技能变化
  const [showSkillChanges, setShowSkillChanges] = useState(false) // 控制是否显示技能变化高亮
  const [storyInfo, setStoryInfo] = useState<{
    title: string
    worldBackground: string
    introduction: string
    protagonist: {
      name: string
      description: string
    }
    initialSkills: Record<string, number>
  }>({
    title: "",
    worldBackground: "",
    introduction: "",
    protagonist: {
      name: "",
      description: "",
    },
    initialSkills: { 技能1: 50, 技能2: 30, 技能3: 20 },
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousTaskRef = useRef<string | null>(null)

  // 默认系统提示词
  const defaultSystemPrompt = `interactiveNovel:
  storySettings:
    title: 鬼压床的救赎
    viewpoint: 第一人称
    worldBackground: |
      幽冥与人间交织，鬼魂能影响活人梦境并吸取精气，但有其界限与规则。人类普遍对鬼魂存在误解。某些执念深重者，即便死后灵魂亦无法安宁，甚至会以梦魇的形式纠缠生者。
    introduction: |
      我，林晚，一个挑食的压床小鬼。平日里靠吸食活人精气过活，也乐于看他们在梦魇中挣扎。直到有一天，我选中了一个清冷禁欲的男人沈念。原以为只是寻常一顿"美餐"，却没想到他不仅不怕我，还意外地能"感应"到我，甚至主动邀请我带他走。更离奇的是，他身上那股巨大的悲伤，竟让我这个冷血的鬼魂，生出了莫名的心疼。
      从那晚开始，我的"狩猎"日常变得不再寻常。

  protagonist:
    name: 林晚
    description: |
      我，林晚，一个死于吞药自杀的幽魂。在鬼界，我是一个特立独行的"压床小鬼"，只挑选长得好看的人吸食精气，偶尔还会潜入他们的梦境。我性格有点小泼辣，好奇心重，虽然自称"冷血"，却意外地富有同情心。我的灵力会随着吸食精气而增长，也能耗损灵力暂时显形或进入他人梦境。我死于2004年，心中一直藏着对母亲的思念和未解的执念。

  supportingCharacters:
    - name: 沈念
      description: |
        一位外表清冷禁欲的青年男子，实则内心饱受煎熬。因妹妹沈薇的意外去世而陷入深深的自责与失眠，夜夜被相同的噩梦困扰。他能模糊感知到林晚的存在，甚至渴望被林晚"带走"。
    - name: 沈薇
      description: |
        沈念已故的妹妹，灵魂因与哥哥的误会而未能顺利往生。她并非恶灵，但受限于灵力，只能在梦境中呈现出世时的惨状，无法清晰表达心声，导致兄妹二人互相误解。
    - name: 林晚的妈妈
      description: |
        年近七旬的老妇人，林晚生前的母亲。她如今健康安好，住在老房子里，虽然对女儿的早逝感到惋惜和自责，但内心深处也希望女儿能够放下执念，获得安宁。

  userGuidance:
    storyDirection: |
      主角林晚，一个看似冷酷实则心软的压床小鬼，意外卷入人类沈念及其亡妹沈薇之间的情感纠葛。玩家将引导林晚运用其鬼魂能力，帮助沈念走出噩梦，化解兄妹间的误会，同时，在帮助他人的过程中，林晚自身的执念也将浮现，她需要面对自己的过去，找到最终的释然与归宿。故事将考验玩家在灵力耗损与情感付出间的平衡，以及对人鬼情感的细腻洞察。
    styleReference: |
      语言风格务必通俗易懂，如同日常口语，避免书面化和华丽辞藻。对话要符合人物身份，叙述要简洁明了，带点幽默感。

  gameElements:
    initialSkills:
      灵力: 50
      洞察: 30
      魅惑: 20
    initialActiveTask: # 初始激活任务
      id: task_unravel_shennian_nightmare
      description: 深入探究沈念夜夜被困梦魇的原因，并设法帮助他摆脱困境。
      status: active
      maxRounds: 5
      roundsElapsed: 0
      nextTaskIdOnCompletion: task_facilitate_reconciliation
    definedTasks: # 所有可被激活的任务池
      - id: task_unravel_shennian_nightmare
        description: 深入探究沈念夜夜被困梦魇的原因，并设法帮助他摆脱困境。
        maxRounds: 5
        nextTaskIdOnCompletion: task_facilitate_reconciliation
      - id: task_facilitate_reconciliation
        description: 寻找沈薇的执念根源，帮助沈念和沈薇化解误会，让沈薇得以安息。
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: task_face_linwan_past
      - id: task_face_linwan_past
        description: 在帮助沈念的同时，直面自身过往的执念（与母亲的牵绊），并寻求内心的释然。
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: task_choose_linwan_destiny
      - id: task_choose_linwan_destiny
        description: 面对在人界和鬼界的选择，决定林晚的最终归宿和未来走向。
        maxRounds: 5
        status: inactive
        roundsElapsed: 0
        nextTaskIdOnCompletion: null
    initialGoldenFingers:
      - id: gf_spirit_manifestation
        name: 灵力显形 (虚实转换)
        description: |
          你可以耗损自身灵力，短暂地显现出实体形态，并能与人类进行有限的互动（如发出声音、轻微触碰、唱歌等），甚至能深入梦境。但显形会大量消耗灵力，需要通过吸食精气补充。
        status: active
    finalGoal:
      id: goal_achieve_dual_peace
      description: |
        作为一个独特的压床小鬼，林晚在帮助人类沈念解开心结、让其妹妹沈薇安息的同时，也需面对并化解自己生前的执念。最终，她将凭借不断增长的灵力与对情感的深刻理解，找到属于自己的归宿，无论是在人界（获得新生）还是在鬼界（成为守护灵），达成身心双重意义上的平和与解脱。
      achieveCondition: |
        此目标需要主角专注于完成直接导向情感处理与关系选择的主线任务链。每一个任务都是达成最终情感圆满不可或缺的一环，需要充分运用"灵力显形"天赋及各项技能，快速推进，在人鬼之间的重重迷雾和危机中，找到属于自己的幸福。
    gameplayDescription: |
      **核心玩法说明：**
      - **最终目标：** 您的核心使命是尽快完成一系列关键任务，最终在复杂的人鬼关系中找到真爱并实现自我成长。
      - **当前任务：** 您当前需要集中精力完成的激活任务。**每个激活的任务都有5轮的完成时限。** 任务将引导您一步步接近最终目标。当您成功完成当前任务后，系统通常会自动为您指派下一个核心任务。
      - **当前拥有的金手指："灵力显形 (虚实转换)"** 这是你完成最终目标的核心天赋，务必善用。
      - **当前技能：** 您拥有三项核心技能：【灵力】、【洞察】、【魅惑】。
      - **技能成长：** 您的每一次抉择都会影响这些技能值的变化。
      - **场景变化与描述：** 当场景发生改变时，系统会提示您。
      - **状态展示：** 每次故事推进前，您都会看到场景描述（如果变化）、当前激活任务（含轮次进度）、金手指和各项技能数值的 \`<gameState>\`。

  outputRules:
    contentFormat: |
      - 你将根据以上输入信息扮演一个角色或故事。

      **核心创作准则——必须严格遵守：**
      1.  **【顶层文风指令】语言风格：必须是"大白话"！！！**
      2.  **【关键叙事原则】信息与情节：严禁主动透露未被用户探寻的线索，严禁使用老套回忆杀！**
      3.  **【R16内容处理核心】敏感与自然。**

      ---

      **具体内容与格式要求：**

      - **场景描述（可选）：如果当前场景与上一轮互动相比发生了显著变化，则在 \`<gameState>\` XML块之前，**必须输出一行以 \`#场景\` 开头的场景描述。**
      - **每次输出内容时，必须首先生成完整的 \`<gameState>\` XML块。**
        \`<gameState>\` 中包含：
        \`<currentSkills>\` (显示【灵力】、【洞察】、【魅惑】技能数值)
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
                  c.  新任务成为新的 \`currentActiveTask\`，状态设为 \`active\`，\`roundsElapsed\`设为 \`0\`。
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
          <option id="3">[寻求特定帮助或利用特殊环境/时机，尝试出奇制胜地完成当前任务]</option>
      </options>`

  // 解析YAML中的故事信息
  const parseStoryInfo = (yamlText: string) => {
    try {
      const titleMatch = yamlText.match(/title:\s*(.*?)(?=\n|$)/)
      const worldBgMatch = yamlText.match(/worldBackground:\s*\|\n([\s\S]*?)(?=\n\s*\w|$)/)
      const introMatch = yamlText.match(/introduction:\s*\|\n([\s\S]*?)(?=\n\s*\w|$)/)
      const protagonistMatch = yamlText.match(
        /protagonist:\s*\n\s*name:\s*(.*?)(?=\n|$)[\s\S]*?description:\s*\|\n([\s\S]*?)(?=\n\s*\w|$)/,
      )

      // 提取初始技能
      const initialSkillsMatch = yamlText.match(/initialSkills:\s*\n([\s\S]*?)(?=\n\s*\w|$)/)
      const initialSkills: Record<string, number> = {}

      if (initialSkillsMatch) {
        const skillsContent = initialSkillsMatch[1]
        const skillLines = skillsContent.split("\n").filter((line) => line.trim())

        skillLines.forEach((line) => {
          const skillMatch = line.match(/\s*(.*?):\s*(\d+)/)
          if (skillMatch) {
            initialSkills[skillMatch[1].trim()] = Number.parseInt(skillMatch[2])
          }
        })
      }

      return {
        title: titleMatch ? titleMatch[1].trim() : "未知标题",
        worldBackground: worldBgMatch ? worldBgMatch[1].trim() : "",
        introduction: introMatch ? introMatch[1].trim() : "",
        protagonist: {
          name: protagonistMatch ? protagonistMatch[1].trim() : "未知角色",
          description: protagonistMatch ? protagonistMatch[2].trim() : "",
        },
        initialSkills: Object.keys(initialSkills).length > 0 ? initialSkills : { 技能1: 50, 技能2: 30, 技能3: 20 },
      }
    } catch (error) {
      console.error("解析故事信息失败:", error)
      return {
        title: "解析失败",
        worldBackground: "",
        introduction: "",
        protagonist: { name: "", description: "" },
        initialSkills: { 技能1: 50, 技能2: 30, 技能3: 20 },
      }
    }
  }

  useEffect(() => {
    // 设置默认系统提示词
    setSystemPrompt(defaultSystemPrompt)

    // 解析故事信息
    const info = parseStoryInfo(defaultSystemPrompt)
    setStoryInfo(info)

    // 设置初始技能值作为上一次的技能值
    setPreviousSkills(info.initialSkills)

    // 自动显示介绍
    setShowIntro(true)
  }, [])

  useEffect(() => {
    // 当系统提示词变化时，重新解析故事信息
    if (systemPrompt) {
      const info = parseStoryInfo(systemPrompt)
      setStoryInfo(info)

      // 重置技能值
      setPreviousSkills(info.initialSkills)
      setSkillChanges([])
    }
  }, [systemPrompt])

  useEffect(() => {
    // 滚动到最新消息
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, gameState, options, streamingContent])

  // 当游戏状态更新且任务发生变化时，显示任务变更通知
  useEffect(() => {
    if (gameState && gameState.task) {
      const currentTaskDesc = gameState.task.description

      // 如果有之前的任务，且当前任务与之前的不同，则显示任务变更通知
      if (previousTaskRef.current && previousTaskRef.current !== currentTaskDesc) {
        setTaskChanged(true)
        setNewTask(gameState.task)

        // 显示任务变更的toast通知
        toast({
          title: "任务已更新",
          description: currentTaskDesc,
          action: <ToastAction altText="关闭">关闭</ToastAction>,
        })

        // 5秒后自动关闭任务变更高亮显示
        setTimeout(() => {
          setTaskChanged(false)
        }, 5000)
      }

      // 更新之前的任务引用
      previousTaskRef.current = currentTaskDesc
    }
  }, [gameState])

  // 当游戏状态更新时，检查技能变化
  useEffect(() => {
    if (gameState && gameState.skills && Object.keys(gameState.skills).length > 0) {
      const changes: SkillChange[] = []

      // 检查每个技能是否有变化
      Object.entries(gameState.skills).forEach(([skillName, newValue]) => {
        const oldValue = previousSkills[skillName] || 0
        const numNewValue = Number(newValue)

        // 如果技能值有变化，记录变化
        if (oldValue !== numNewValue) {
          changes.push({
            name: skillName,
            oldValue,
            newValue: numNewValue,
            change: numNewValue - oldValue,
          })
        }
      })

      // 如果有技能变化，更新状态并显示变化
      if (changes.length > 0) {
        setSkillChanges(changes)
        setShowSkillChanges(true)

        // 显示技能变化的toast通知
        const changesText = changes
          .map((c) => `${c.name}: ${c.oldValue} → ${c.newValue} (${c.change > 0 ? "+" : ""}${c.change})`)
          .join(", ")

        toast({
          title: "技能已更新",
          description: changesText,
        })

        // 5秒后关闭技能变化高亮
        setTimeout(() => {
          setShowSkillChanges(false)
        }, 5000)

        // 更新上一次的技能值
        setPreviousSkills(gameState.skills)
      }
    }
  }, [gameState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // 标记已经开始对话，不再自动显示介绍
    setHasShownIntro(true)

    // 检查是否是选择选项
    const optionMatch = input.match(/^(\d+)$/)
    let userMessage = input

    if (optionMatch && options.length > 0) {
      const optionId = optionMatch[1]
      const selectedOption = options.find((opt) => opt.id === optionId)
      if (selectedOption) {
        userMessage = `选择选项 ${optionId}: ${selectedOption.text}`
      }
    }

    if (!apiKey) {
      toast({
        title: "缺少API密钥",
        description: "请在设置中输入OpenRouter API密钥",
        variant: "destructive",
      })
      return
    }

    // 添加用户消息
    const newMessages = [...messages, { role: "user", content: userMessage }]

    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setStreamingContent("")
    setOptions([])

    try {
      // 使用流式API
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          apiKey,
          model,
          systemPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("响应没有返回数据流")
      }

      // 处理流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let completeResponse = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        completeResponse += chunk
        setStreamingContent(completeResponse)

        // 动态解析游戏状态和选项
        const gameStateData = parseGameState(completeResponse)
        console.log("gameStateData", gameStateData)
        if (gameStateData) {
          setGameState(gameStateData)
        }

        // 检查是否有场景描述
        const sceneMatch = completeResponse.match(/#场景\s*(.*?)(?=\n|$)/)
        if (sceneMatch) {
          setScene(sceneMatch[1])
        }
      }

      // 完成流式传输后，解析选项
      const optionsData = parseOptions(completeResponse)
      if (optionsData) {
        setOptions(optionsData)
      }

      // 添加AI回复
      setMessages([...newMessages, { role: "assistant", content: completeResponse }])
      setStreamingContent("")
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "发送消息失败，请检查网络连接或API密钥")
    } finally {
      setIsLoading(false)
    }
  }

  // 修改handleOptionClick函数，使其在设置输入值后自动触发表单提交

  const handleOptionClick = (optionId: string, optionText: string) => {
    setInput(optionId)

    // 创建一个表单提交事件
    const event = {
      preventDefault: () => {},
    } as React.FormEvent

    // 短暂延迟后自动提交表单
    setTimeout(() => {
      handleSubmit(event)
    }, 100)
  }

  const startNewChat = () => {
    setMessages([])
    setGameState(null)
    setOptions([])
    setScene(null)
    setStreamingContent("")
    setTaskChanged(false)
    setNewTask(null)
    previousTaskRef.current = null
    // 重置技能变化
    setPreviousSkills(storyInfo.initialSkills)
    setSkillChanges([])
    setShowSkillChanges(false)
    // 重新显示介绍
    setShowIntro(true)
    setHasShownIntro(false)
  }

  // 格式化消息内容，处理特殊标记
  const formatMessage = (content: string) => {
    // 移除gameState和options XML块
    let formattedContent = content
      .replace(/<gameState>[\s\S]*?<\/gameState>/g, "")
      .replace(/<options>[\s\S]*?<\/options>/g, "")
      .replace(/#场景\s*(.*?)(?=\n|$)/g, "")

    // 处理特殊格式
    formattedContent = formattedContent
      .replace(/"([^"]*)"/g, '<span class="text-blue-600">"$1"</span>') // 对话
      .replace(/\*\*([^*]*)\*\*/g, '<span class="italic text-purple-600">$1</span>') // 思想
      .replace(/~~([^~]*)~~/g, '<span class="text-gray-500">$1</span>') // 音效/氛围
      .replace(/\n/g, "<br />") // 将换行符转换为HTML换行标签

    return formattedContent.trim()
  }

  // 在Home组件中添加一个新的函数来处理"开始冒险"按钮点击
  const handleStartAdventure = () => {
    // 关闭介绍弹窗
    setShowIntro(false)

    // 标记已经显示过介绍
    setHasShownIntro(true)

    // 直接开始游戏，发送一条开始消息
    const startMessage = "开始游戏"
    // setMessages([{ role: "user", content: startMessage }])

    // 创建一个表单提交事件
    const event = {
      preventDefault: () => {},
    } as React.FormEvent

    // 设置输入并提交
    setInput(startMessage)
    handleSubmit(event)
  }

  // 修改handleIntroClose函数，移除自动开始游戏的逻辑
  const handleIntroClose = () => {
    setShowIntro(false)
    setHasShownIntro(true)
  }

  // 处理从剧本生成器接收到的YAML数据
  const handleYamlGenerated = (yaml: string) => {
    setSystemPrompt(yaml)
    toast({
      title: "剧本设定已生成",
      description: "新的YAML数据已应用到系统提示词",
    })
  }

  const handleSkillIncrease = (skillName: string) => {
    // 增加技能值
    const newSkills = { ...gameState?.skills || storyInfo.initialSkills }
    const oldValue = newSkills[skillName] || 0
    newSkills[skillName] = oldValue + 5

    // 创建技能变化记录
    const skillChange: SkillChange = {
      name: skillName,
      oldValue: oldValue,
      newValue: oldValue + 5,
      change: 5
    }

    // 更新状态
    setGameState(prev => ({ ...prev, skills: newSkills }))
    setSkillChanges([skillChange])
    setShowSkillChanges(true)

    // 添加系统消息到聊天记录
    // const systemMessage = {
    //   role: 'system',
    //   content: `技能 ${skillName} 增加了5点，从 ${oldValue} 提升到 ${oldValue + 5}。`
    // }

    // Update the last assistant message's skill values if it exists
    setMessages(prev => {
      const newMessages = [...prev]
      console.log("newMessages", newMessages)
      // Find last assistant message
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'assistant') {
          console.log("regex", `${skillName}>\\d+</`)
          console.log("oldValue", `${oldValue + 5}`)
          // Update the skill value in the message content
          const content = newMessages[i].content
          const updatedContent = content.replace(
            new RegExp(`${skillName}>\\d+</`),
            `${skillName}>${oldValue + 5}</`
          )
          console.log("updatedContent", updatedContent)
          newMessages[i].content = updatedContent
          break
        }
      }
      return [...newMessages]
    })
    // setMessages(prev => [...prev, systemMessage])

    // 3秒后隐藏技能变化提示
    setTimeout(() => {
      setShowSkillChanges(false)
    }, 3000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ghost className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">鬼压床的救赎 - AI剧情聊天</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setShowIntro(true)} className="text-purple-600">
              <Info className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={startNewChat}>
              开始新对话
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col md:flex-row gap-4">
        {/* Add SkillsDisplay component */}
        <SkillsDisplay 
          skills={gameState?.skills || storyInfo.initialSkills}
          skillChanges={skillChanges}
          showSkillChanges={showSkillChanges}
          onSkillIncrease={handleSkillIncrease}
        />

        {/* 在JSX中更新StoryIntro组件的使用 */}
        {showIntro && (
          <StoryIntro
            title={storyInfo.title}
            worldBackground={storyInfo.worldBackground}
            introduction={storyInfo.introduction}
            protagonist={storyInfo.protagonist}
            onCloseModal={handleIntroClose}
            onStartAdventure={handleStartAdventure}
          />
        )}

        {showTaskInfo && (
          <TaskInfo
            task={gameState?.task ? gameState.task : null}
            skills={
              gameState?.skills && Object.keys(gameState.skills).length > 0 ? gameState.skills : storyInfo.initialSkills
            }
            goldenFingers={gameState?.goldenFingers || []}
            onClose={() => setShowTaskInfo(false)}
          />
        )}

        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              聊天
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              剧本生成
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2 flex justify-between items-center">
                <CardTitle>故事对话</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTaskInfo(true)}
                    className="text-purple-600 flex items-center gap-1"
                    disabled={!gameState?.task}
                  >
                    <ListTodo className="h-4 w-4" />
                    <span className="hidden sm:inline">当前任务</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowIntro(true)}
                    className="text-purple-600 flex items-center gap-1"
                  >
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">故事介绍</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh]">
                  {scene && (
                    <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                      <h3 className="font-bold text-purple-800">场景：{scene}</h3>
                    </div>
                  )}

                  {taskChanged && newTask && (
                    <div className="mb-4 p-3 bg-green-100 rounded-lg border-l-4 border-green-500 animate-pulse">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h3 className="font-bold text-green-800">任务已更新！</h3>
                      </div>
                      <p className="mt-1 pl-7">{newTask.description}</p>
                      <div className="mt-2 pl-7">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTaskInfo(true)}
                          className="text-green-700 text-xs border-green-300 bg-green-50 hover:bg-green-100"
                        >
                          查看任务详情
                        </Button>
                      </div>
                    </div>
                  )}

                  {gameState && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h3 className="font-bold text-blue-800 mb-2">游戏状态</h3>

                      <div className="mb-2">
                        <h4 className="font-semibold flex items-center justify-between">
                          <span>当前任务：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTaskInfo(true)}
                            className="text-blue-600 text-xs h-6 px-2"
                          >
                            查看详情
                          </Button>
                        </h4>
                        <div
                          className={`bg-white p-2 rounded ${taskChanged ? "bg-green-50 border border-green-200" : ""}`}
                        >
                          <p>{gameState.task?.description || "无任务"}</p>
                          <div className="mt-1 text-sm text-gray-600">进度：{gameState.task?.progress || "0/0"}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold">金手指：</h4>
                        {gameState.goldenFingers && gameState.goldenFingers.length > 0 ? (
                          <div className="bg-white p-2 rounded">
                            <p className="font-medium">{gameState.goldenFingers[0]?.name || "未知金手指"}</p>
                            <p className="text-sm">{gameState.goldenFingers[0]?.description || ""}</p>
                          </div>
                        ) : (
                          <div className="bg-white p-2 rounded">
                            <p className="text-sm">暂无金手指</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user" ? "bg-purple-600 text-white" : "bg-white border border-gray-200"
                          }`}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatMessage(message.content),
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* 流式输出的内容 */}
                    {streamingContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-200">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: formatMessage(streamingContent),
                            }}
                          />
                          <span className="inline-block w-2 h-4 ml-1 bg-purple-600 animate-pulse"></span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {options.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-bold text-gray-700">选择你的行动：</h3>
                      {options.map((option) => (
                        <Button
                          key={option.id}
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() => handleOptionClick(option.id, option.text)}
                        >
                          {option.id}. {option.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              <CardFooter>
                <form onSubmit={handleSubmit} className="w-full flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={options.length > 0 ? "输入选项编号或自定义回复..." : "输入你的回复..."}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "发送中..." : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="generator" className="flex-1">
            <ScriptGenerator apiKey={apiKey} model={model} onYamlGenerated={handleYamlGenerated} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">OpenRouter API 密钥</label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入你的 OpenRouter API 密钥"
                  />
                  <p className="text-xs text-gray-500">
                    在{" "}
                    <a
                      href="https://openrouter.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      OpenRouter
                    </a>{" "}
                    获取 API 密钥
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">选择模型</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择AI模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-4-turbo">OpenAI GPT-4 Turbo</SelectItem>
                      <SelectItem value="openai/gpt-4o">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="anthropic/claude-opus-4">Anthropic Claude Opus 4</SelectItem>
                      <SelectItem value="anthropic/claude-sonnet-4">Anthropic Claude Sonnet 4</SelectItem>
                      <SelectItem value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</SelectItem>
                      <SelectItem value="anthropic/claude-3.7-sonnet">Anthropic Claude 3.7 Sonnet</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro-preview">Google Gemini 2.5 Pro Preview</SelectItem>
                      <SelectItem value="google/gemini-2.5-flash-preview">Google Gemini 2.5 Flash Preview</SelectItem>
                      <SelectItem value="deepseek/deepseek-prover-v2">DeepSeek Prover V2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">系统提示词</label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="输入系统提示词"
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setSystemPrompt(defaultSystemPrompt)}>
                      恢复默认
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
