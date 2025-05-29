"use client"

import type React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
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
  Maximize2,
} from "lucide-react"
import { parseGameState, parseOptions } from "@/lib/parser"
import { StoryIntro } from "@/components/story-intro"
import { TaskInfo } from "@/components/task-info"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ScriptGenerator } from "@/components/script-generator"
import { SkillsDisplay } from "@/components/skills-display"
import { generateImage } from '@/lib/imageGenerator';
import { defaultSystemPrompt } from "@/lib/defaultSystemPrompt"
import { useSearchParams } from 'next/navigation'
import { StorySelector, type Story } from "@/components/story-selector"

// 定义技能变化类型
type SkillChange = {
  name: string
  oldValue: number
  newValue: number
  change: number
}

// Create a new component that uses useSearchParams
function HomeContent() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState(() => {
    const urlApiKey = searchParams.get('apiKey')
    return urlApiKey || ""
  })
  const [model, setModel] = useState("google/gemini-2.5-flash-preview")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<any>(null)
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([])
  const [scene, setScene] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const [showIntro, setShowIntro] = useState(false) // 改为 false，默认不显示介绍
  const [showTaskInfo, setShowTaskInfo] = useState(false) // 控制任务信息弹窗
  const [hasShownIntro, setHasShownIntro] = useState(false)
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
  const [isImmersiveMode, setIsImmersiveMode] = useState(true)
  const [sceneDescriptions, setSceneDescriptions] = useState<{
    imagePrompt: string;
    imageUrl?: string;
    segments: Array<{
      text: string;
      type: 'narration' | 'character';
      speaker?: string;
    }>;
    options?: Array<{ id: string; text: string }>;
  }>()
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const immersiveContentRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<string | null>(null)
  const [customAction, setCustomAction] = useState("")
  const [volcAccessKeyId, setVolcAccessKeyId] = useState(() => {
    const urlVolcId = searchParams.get('volcId')
    return urlVolcId || ""
  })
  const [volcSecretAccessKey, setVolcSecretAccessKey] = useState(() => {
    const urlVolcKey = searchParams.get('volcKey')
    return urlVolcKey || ""
  })
  const [showStorySelector, setShowStorySelector] = useState(true) // 添加此状态

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
    // Set default system prompt
    setSystemPrompt(defaultSystemPrompt)

    // Parse story info
    const info = parseStoryInfo(defaultSystemPrompt)
    setStoryInfo(info)

    // Set initial skills as previous skills
    setPreviousSkills(info.initialSkills)

    // Initialize immersive mode content
    setSceneDescriptions({
      imagePrompt: "A mysterious fantasy world waiting to be explored",
      segments: [{
        text: "准备开始一段奇妙的冒险...",
        type: "narration"
      }],
      options: []
    })
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
      console.log("isImmersiveMode", isImmersiveMode)
      console.log("messages", messages)
      // // 如果是沉浸模式，调用handleImmersiveMode
      // if (isImmersiveMode) {
      //   setTimeout(() => {
      //     handleImmersiveMode()
      //   }, 10)
      // }
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "发送消息失败，请检查网络连接或API密钥")
    } finally {
      setIsLoading(false)
    }
  }

  // 另一种解决方案：使用 useEffect
  useEffect(() => {
    if (input.trim()) {
      const event = { preventDefault: () => {} } as React.FormEvent
      handleSubmit(event)
    }
  }, [input]) // 当 input 变化时触发

  const handleOptionClick = (optionId: string, optionText: string) => {
    setInput(optionId)
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
    setShowStorySelector(true) // 添加此行
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
    setGameState((prevState: any) => ({ 
      ...prevState, 
      skills: {
        ...(prevState?.skills || {}),
        [skillName]: (prevState?.skills?.[skillName] || 0) + 5
      }
    }));

    // Create skill change record using the current gameState
    const currentValue = gameState?.skills?.[skillName] || 0;
    const skillChange: SkillChange = {
      name: skillName,
      oldValue: currentValue,
      newValue: currentValue + 5,
      change: 5
    }

    // Update messages with proper typing
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'assistant') {
          const content = newMessages[i].content;
          const updatedContent = content.replace(
            new RegExp(`${skillName}>\\d+</`),
            `${skillName}>${currentValue + 5}</`
          );
          newMessages[i].content = updatedContent;
          break;
        }
      }
      return newMessages;
    });

    // 更新状态
    setSkillChanges([skillChange])
    setShowSkillChanges(true)

    // 添加系统消息到聊天记录
    // const systemMessage = {
    //   role: 'system',
    //   content: `技能 ${skillName} 增加了5点，从 ${prev?.skills?.[skillName] || 0} 提升到 ${prev?.skills?.[skillName] || 0 + 5}。`
    // }

    // 3秒后隐藏技能变化提示
    setTimeout(() => {
      setShowSkillChanges(false)
    }, 3000)
  }

  const handleGenerateImage = async (prompt: string) => {
    try {
      // Define proper type for image generation options
      const options = {
        prompt,
        width: 768,
        height: 1024,
        scale: 2.5,
        use_pre_llm: false,
        volcAccessKeyId,
        volcSecretAccessKey
      };

      const result = await generateImage(options);

      if (result.success && result.image_urls) {
        return result.image_urls[0];
      } else {
        throw new Error(result.message || "图片生成失败");
      }
    } catch (error) {
      toast({
        title: "图片生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImmersiveMode = async () => {
    // If already loading, return
    if (isLoading) return;
    
    console.log("Executing handleImmersiveMode");
    
    if (!messages.length) {
      // Direct entry to immersive mode, show start button
      setIsImmersiveMode(true);
      setSceneDescriptions({
        imagePrompt: "A mysterious fantasy world waiting to be explored",
        segments: [{
          text: "准备开始一段奇妙的冒险...",
          type: "narration"
        }],
        options: []
      });
      return;
    }

    setIsLoading(true);
    setCurrentSegmentIndex(0); // Reset segment index
    
    try {
      const storyContent = messages
        .filter(m => m.role === "assistant")
        .slice(-1)
        .map(m => formatMessage(m.content))
        .join("\n");

      // Add previous imagePrompt to the story content if it exists
      const contentWithPrompt = sceneDescriptions?.imagePrompt 
        ? `Previous Image Prompt: ${sceneDescriptions.imagePrompt}\n\nStory Content: ${storyContent}`
        : storyContent;

      const response = await fetch("/api/analyze-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contentWithPrompt,
          apiKey,
          model,
          volcAccessKeyId,
          volcSecretAccessKey,
        }),
      });

      if (!response.ok) {
        throw new Error("分析失败");
      }

      const data = await response.json();
      const imageUrl = await handleGenerateImage(data.imagePrompt);
      setSceneDescriptions({
        ...data,
        imageUrl: imageUrl || undefined,
        options: options || []
      });
      
      setIsImmersiveMode(true);
    } catch (error) {
      toast({
        title: "分析失败",
        description: "无法生成沉浸模式内容",
        variant: "destructive",
      });
      setIsImmersiveMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isImmersiveMode && immersiveContentRef.current) {
      immersiveContentRef.current.scrollTop = immersiveContentRef.current.scrollHeight
    }
  }, [currentSegmentIndex, isImmersiveMode])

  useEffect(() => {
    // 只在以下情况执行:
    // 1. 沉浸模式为 true
    // 2. 有新消息
    // 3. 不在加载状态
    if (isImmersiveMode && messages.length > 0 && !isLoading) {
      // 使用 ref 来防止重复执行
      const lastMessageId = messages[messages.length - 1].content;
      if (lastMessageRef.current !== lastMessageId) {
        lastMessageRef.current = lastMessageId;
        handleImmersiveMode();
      }
    }
  }, [messages, isImmersiveMode, isLoading]); // 添加 isLoading 作为依赖项

  // 修改表单提交处理函数
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInput(customAction) // 将自定义行动赋值给input
    setCustomAction("") // 清空自定义行动输入框
  }

  // 添加一个 useEffect 来处理 URL 参数变化
  useEffect(() => {
    const urlApiKey = searchParams.get('apiKey')
    const urlVolcId = searchParams.get('volcId')
    const urlVolcKey = searchParams.get('volcKey')

    if (urlApiKey) setApiKey(urlApiKey)
    if (urlVolcId) setVolcAccessKeyId(urlVolcId)
    if (urlVolcKey) setVolcSecretAccessKey(urlVolcKey)
  }, [searchParams])

  // 添加处理选择故事的函数
  const handleSelectStory = (story: Story) => {
    setSystemPrompt(story.systemPrompt)
    // 解析新的故事信息
    const info = parseStoryInfo(story.systemPrompt)
    setStoryInfo(info)
    // 重置技能
    setPreviousSkills(info.initialSkills)
    setShowStorySelector(false)
    setShowIntro(true) // 选择故事后显示故事介绍
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 在最上层添加故事选择器 */}
      {showStorySelector && (
        <StorySelector onSelectStory={handleSelectStory} />
      )}
      
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ghost className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">AI剧情聊天</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleImmersiveMode} 
              className="text-purple-600"
              disabled={isLoading}
            >
              <Maximize2 className="h-5 w-5" />
          
            </Button>
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
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <StoryIntro
              title={storyInfo.title}
              worldBackground={storyInfo.worldBackground}
              introduction={storyInfo.introduction}
              protagonist={storyInfo.protagonist}
              onCloseModal={handleIntroClose}
              onStartAdventure={handleStartAdventure}
            />
          </div>
        )}

        {showTaskInfo && (
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <TaskInfo
              task={gameState?.task ? gameState.task : null}
              skills={
                gameState?.skills && Object.keys(gameState.skills).length > 0 ? gameState.skills : storyInfo.initialSkills
              }
              goldenFingers={gameState?.goldenFingers || []}
              onClose={() => setShowTaskInfo(false)}
            />
          </div>
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
            {isImmersiveMode ? (
              <div className="fixed inset-0 z-50 bg-black">
                <div className="relative w-full h-full">
                  {/* 加载状态显示 */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-white text-lg animate-pulse">正在生成场景...</p>
                      </div>
                    </div>
                  )}

                  {/* Background image container */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: sceneDescriptions?.imageUrl ? `url(${sceneDescriptions.imageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {/* Dark overlay */}
                    {/* <div className="absolute inset-0 bg-black bg-opacity-50" /> */}
                  </div>

                  {/* Top navigation bar */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                    <h2 className="text-white text-xl font-bold">沉浸模式</h2>
                    <div className="flex items-center gap-4">
                      {/* 游戏状态按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTaskInfo(true)}
                        className="text-white hover:text-white hover:bg-white/20 flex items-center gap-2"
                        disabled={!gameState?.task}
                      >
                        <ListTodo className="h-5 w-5" />
                        <span className="hidden sm:inline">游戏状态</span>
                      </Button>

                      {/* 故事介绍按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowIntro(true)}
                        className="text-white hover:text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <Info className="h-5 w-5" />
                        <span className="hidden sm:inline">故事介绍</span>
                      </Button>

                      {/* 退出沉浸模式按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsImmersiveMode(false)}
                        className="text-white hover:text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <Maximize2 className="h-5 w-5" />
                        <span className="hidden sm:inline">退出沉浸模式</span>
                      </Button>
                    </div>
                  </div>

                  {/* Content area */}
                  <div 
                    ref={immersiveContentRef}
                    className="overflow-scroll absolute bottom-0 left-0 right-0 w-full h-[40%] cursor-pointer z-20"
                    onClick={() => {
                      if (currentSegmentIndex < (sceneDescriptions?.segments?.length || 0)) {
                        setCurrentSegmentIndex(currentSegmentIndex + 1)
                      }
                    }}
                  >
                    <div className="w-full max-w-2xl px-4">
                      {!messages.length ? (
                        // Show start button when no messages
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                          <h2 className="text-3xl font-bold text-white text-center">
                            准备好开始你的冒险了吗？
                          </h2>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              setInput("开始游戏")
                              const event = { preventDefault: () => {} } as React.FormEvent
                              handleSubmit(event)
                            }}
                            
                          >
                            开始冒险
                          </Button>
                        </div>
                      ) : (
                        <div
                        onClick={() => {
                          setCurrentSegmentIndex(currentSegmentIndex + 1)
                        }}
                        className="space-y-4 bg-black bg-opacity-30 p-6 rounded-lg ">
                          {/* 显示当前任务 */}
                          {gameState?.task  && (
                            <div className="mb-4 p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
                             
                              <p className="text-gray-200">{gameState.task.description}</p>
                          
                            </div>
                          )}
                          {sceneDescriptions?.segments?.slice(0, currentSegmentIndex).map((segment, index) => (
                            <div 
                              key={index} 
                              className={`${
                                segment.type === 'narration' 
                                  ? 'text-gray-200 italic' 
                                  : 'text-white'
                              } animate-fadeIn`}
                            >
                              {segment.type === 'character' && (
                                <div className="font-bold text-blue-300 mb-1">
                                  {segment.speaker}
                                </div>
                              )}
                              <div>{segment.text}</div>
                            </div>
                          ))}
                          
                          {/* 选项或继续提示 */}
                          {currentSegmentIndex-1 >= (sceneDescriptions?.segments?.length || 0) ? (
                            sceneDescriptions?.options && (
                              <div className="mt-6 space-y-2">
                               
                                {sceneDescriptions?.options.map((option) => (
                                  <Button
                                    key={option.id}
                                    variant="outline"
                                    className="text-sm w-full justify-start text-left bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 whitespace-pre-wrap"
                                    onClick={() => {
                                      // 直接设置 input 值并提交
                                      setInput(option.id)
                                      const event = { preventDefault: () => {} } as React.FormEvent
                                      
                                    }}
                                  >
                                    {option.id}. {option.text}
                                  </Button>
                                ))}
                                {/* 添加自定义选项输入区域 */}
                                <div className="">
                                  
                                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                                    <Input
                                      value={customAction}
                                      onChange={(e) => setCustomAction(e.target.value)}
                                      placeholder="描述你想要执行的行动..."
                                      disabled={isLoading}
                                      className="flex-1"
                                    />
                                    <Button type="submit" disabled={isLoading}>
                                      确认
                                    </Button>
                                  </form>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="text-center text-white mt-4 opacity-70">
                              点击继续...
                             
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg z-30">
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
            )}
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

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">火山引擎生图API设置</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Key ID</label>
                    <Input
                      type="password"
                      value={volcAccessKeyId}
                      onChange={(e) => setVolcAccessKeyId(e.target.value)}
                      placeholder="输入火山引擎 Access Key ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Access Key</label>
                    <Input
                      type="password"
                      value={volcSecretAccessKey}
                      onChange={(e) => setVolcSecretAccessKey(e.target.value)}
                      placeholder="输入火山引擎 Secret Access Key"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    在{" "}
                    <a
                      href="https://www.volcengine.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      火山引擎控制台
                    </a>{" "}
                    获取 API 密钥
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">选择模型</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择AI模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-4-turbo">OpenAI GPT-4 Turbo</SelectItem>
                      <SelectItem value="openai/gpt-4o">OpenAI GPT-4o</SelectItem>
                     
                      <SelectItem value="anthropic/claude-3-sonnet">Anthropic Claude 3 Sonnet</SelectItem>
                      <SelectItem value="anthropic/claude-3.7-sonnet">Anthropic Claude 3.7 Sonnet</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro-preview">Google Gemini 2.5 Pro Preview</SelectItem>
                      <SelectItem value="google/gemini-2.5-flash-preview">Google Gemini 2.5 Flash Preview</SelectItem>
                      <SelectItem value="deepseek/deepseek-chat-v3-0324">DeepSeek Chat V3</SelectItem>
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

// Update the main Home component to use Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
