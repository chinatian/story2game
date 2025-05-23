import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model, systemPrompt, userPrompt } = await req.json()

    // 验证必要参数
    if (!userPrompt) {
      return NextResponse.json({ error: "请提供用户提示词" }, { status: 400 })
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
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: model || "openai/gpt-4-turbo",
      max_tokens: 4000,
      temperature: 0.7,
      stream: true, // 启用流式响应
    }

    // 创建响应流
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
            controller.error(new Error(`调用AI模型失败 (${openRouterResponse.status})`))
            return
          }

          // 获取响应的读取流
          const reader = openRouterResponse.body?.getReader()
          if (!reader) {
            controller.error(new Error("无法获取响应流"))
            return
          }

          // 解码器
          const decoder = new TextDecoder()

          // 读取流数据
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // 解码并处理数据
            const chunk = decoder.decode(value)
            const lines = chunk
              .split("\n")
              .filter(line => line.trim() !== "" && line.trim() !== "data: [DONE]")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.choices?.[0]?.delta?.content) {
                    // 发送内容到客户端
                    controller.enqueue(new TextEncoder().encode(data.choices[0].delta.content))
                  }
                } catch (e) {
                  console.error("解析流数据失败:", e)
                }
              }
            }
          }
          controller.close()
        } catch (error) {
          console.error("处理流式响应时出错:", error)
          controller.error(error)
        }
      }
    })

    // 返回流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
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
