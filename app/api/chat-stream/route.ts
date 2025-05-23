import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, apiKey, model, systemPrompt } = await req.json()

    // 验证必要参数
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "消息格式不正确" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 如果没有提供API密钥，返回错误
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "请提供OpenRouter API密钥" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
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
      stream: true, // 启用流式输出
    }

    try {
      // 创建一个新的 TransformStream
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()

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

        writer.write(encoder.encode(`OpenRouter API错误: ${openRouterResponse.status}`))
        writer.close()

        return new Response(stream.readable, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      }

      if (!openRouterResponse.body) {
        writer.write(encoder.encode("OpenRouter API没有返回数据流"))
        writer.close()

        return new Response(stream.readable, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      }

      // 处理OpenRouter的流式响应
      const reader = openRouterResponse.body.getReader()
      let fullText = ""

      // 开始处理流
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true })

            // 处理SSE格式的数据
            const lines = chunk.split("\n")
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const data = line.slice(5).trim()

                // 检查是否是结束标记，注意可能有空格
                if (data === "[DONE]" || data.includes("[DONE]")) {
                  continue
                }

                try {
                  // 只有当数据看起来像JSON时才尝试解析
                  if (data && (data.startsWith("{") || data.startsWith("["))) {
                    const json = JSON.parse(data)
                    const content = json.choices?.[0]?.delta?.content || ""

                    if (content) {
                      fullText += content
                      await writer.write(encoder.encode(content))
                    }
                  }
                } catch (e) {
                  console.error("解析SSE数据失败:", e, "原始数据:", data)
                  // 继续处理下一行，不中断流
                }
              }
            }
          }

          await writer.close()
        } catch (error) {
          console.error("处理流时出错:", error)
          await writer.abort(error as Error)
        }
      }

      // 开始处理流
      processStream()

      // 返回流式响应
      return new Response(stream.readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    } catch (fetchError) {
      console.error("OpenRouter API请求错误:", fetchError)
      return new Response(
        JSON.stringify({
          error: "连接到AI服务时出错",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("API路由处理错误:", error)
    return new Response(
      JSON.stringify({
        error: "服务器内部错误",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
