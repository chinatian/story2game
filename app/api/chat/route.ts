import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, systemPrompt } = await req.json()

    // 验证必要参数
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "消息格式不正确" }, { status: 400 })
    }

    // 如果没有提供API密钥，返回错误
    if (!apiKey) {
      return NextResponse.json({ error: "请提供OpenRouter API密钥" }, { status: 400 })
    }

    console.log(`使用模型: ${model || "openai/gpt-4-turbo"}`)

    // 准备发送到OpenRouter的请求
    const openRouterPayload = {
      messages: [
        {
          role: "system",
          content: systemPrompt || "",
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
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

      console.log(`OpenRouter API响应状态: ${openRouterResponse.status}`)

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
            error: `调用AI模型失败 (${openRouterResponse.status})`,
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

      // 返回AI的回复
      return NextResponse.json({
        content: data.choices[0].message.content,
      })
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
