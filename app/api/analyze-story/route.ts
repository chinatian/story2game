import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, apiKey, model } = await request.json()

    // 验证必要参数
    if (!content) {
      return NextResponse.json({ error: "故事内容不能为空" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "请提供OpenRouter API密钥" }, { status: 400 })
    }

    const systemPrompt = `你是一个专业的故事分析助手。请分析以下故事内容，并提供两个关键信息：
1. 一段适合AI绘图的画面描述
2. 将故事内容按自然段落分割，并标注每段是旁白还是角色对话，如果是对话需指出说话者
3. 画面描述：画风从下面随机选择一个合适的并给出
- Akira Toriyama style 
- Naoko Takeuchi style
- Katsuhiro Otomo style
- Yoshiyuki Sadamoto style
- Masashi Kishimoto style
- Yoshihiro Togashi style
- CLAMP style
- Yoshitaka Amano style
- Range Murata style
- redjuice style
- huke style
- lack style
- Mai Yoneyama style
- Wlop Ghostblade style
- Ask style
- Ririn style
- DSmile style

请以JSON格式返回，格式如下：
{
  "imagePrompt": "画面描述...",
  "segments": [
    {
      "text": "段落内容",
      "type": "narration|character",
      "speaker": "说话者名称(仅对话时需要)"
    }
  ]
}`

    // 准备发送到OpenRouter的请求
    const openRouterPayload = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content,
        }
      ],
      model: model || "openai/gpt-4-turbo",
      max_tokens: 1500,
      temperature: 0.7,
      stream: false,
    }

    try {
      // 发送请求到OpenRouter API
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://v0.dev",
          "X-Title": "AI Story Chat App",
        },
        body: JSON.stringify(openRouterPayload),
      })

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text()
        console.error(`OpenRouter API错误: ${openRouterResponse.status}`, errorText)

        let errorData = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          console.error("解析错误响应失败:", e)
        }

        return NextResponse.json(
          {
            error: `故事分析失败 (${openRouterResponse.status})`,
            details: errorData,
          },
          { status: openRouterResponse.status },
        )
      }

      const data = await openRouterResponse.json()

      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("OpenRouter返回的数据格式不正确:", data)
        return NextResponse.json({ error: "AI服务返回的数据格式不正确" }, { status: 500 })
      }

      console.log("OpenRouter返回的数据:", data.choices[0].message.content)

      // 解析并返回分析结果
      const content = data.choices[0].message.content
      const jsonStart = content.indexOf('```json')
      const jsonEnd = content.lastIndexOf('```')
      const jsonString = content.slice(jsonStart + 7, jsonEnd).trim()
      const analysisResult = JSON.parse(jsonString)
      return NextResponse.json(analysisResult)
    } catch (fetchError) {
      console.error("OpenRouter API请求错误:", fetchError)
      return NextResponse.json(
        {
          error: "连接到AI服务时出错",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API路由处理错误:", error)
    return NextResponse.json(
      {
        error: "服务器内部错误",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
} 