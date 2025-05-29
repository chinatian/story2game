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

    const systemPrompt = `你是一个专业的故事分析助手。请分析以下故事内容，并提供下面的信息：
1. 画面描述：整个画面的绘画风格要给出具体的建议，可以参考某个动漫艺术家的风格，画面要有冲击力，有故事感，画面要华丽，
2. 画面描述：要参照之前的画面描述，尽量让画面描述连贯起来,要保证画面是表现当前的 Story Content

好的，这是一个可以用来构造类似你提供的高质量AI绘图提示词的“元提示词”或者说是一个“提示词构造框架”。你可以把它看作一个配方，通过调整不同的“食材”（关键词）来生成各种华丽水墨人物插画。

**画面描述请参考下面的可能用上的描述：**
**画面描述请参考下面的可能用上的描述：**

**一、核心风格与画质 (Core Style & Quality):**

*   **基础风格:** \`华丽水墨人物插画\` (Gorgeous ink wash figure illustration)
*   **笔触与质感:** \`超细腻笔触\`, \`手绘质感\`, \`细密颗粒感\`, \`朦胧感\`, \`宣纸质感\`, \`磨砂颗粒质感\`, \`岩彩质感\` (Ultra-fine brushstrokes, hand-drawn texture, fine grain texture, hazy/dreamy feel, Xuan paper texture, frosted grain texture, mineral pigment texture)
*   **光影与色彩:** \`自然光影\`, \`色彩和谐\`, \`色彩饱满有层次\`, \`光斑点缀\`, \`暗面\` (Natural lighting, harmonious colors, full and layered colors, light spot embellishments, dark areas)
*   **特殊效果 (可选):** \`颗粒发光\` (Particles emitting light)

**二、构图与动态 (Composition & Dynamics):**

*   **视角:** \`高角度构图\`, \`高位视平线\`, \`正面视角\`, \`微仰角\`, \`俯瞰\` (High-angle composition, high horizon line, front view, slight low-angle, bird's-eye view)
*   **布局:** \`对称构图\`, \`左右两边留白\` (Symmetrical composition, blank space on left and right)
*   **动态感:** \`动感构图\`, \`时间凝固瞬间\` (Dynamic composition, frozen moment in time)
*   **景深与聚焦:** \`浅景深\`, \`人物特写\`, \`半身像\`, \`肖像画\`, \`超近景特写脸部\`, \`近景\` (Shallow depth of field, character close-up, half-body portrait, portrait painting, extreme close-up of face, close-up shot)

**三、人物主体 (Subject - Character):**

*   **身份/主题:** (选择或创造一个，例如: \`牡丹花神\`, \`荷花花神\`, \`武者\`, \`猫耳少年\`, \`梅花剑客\`, \`竹林隐士\` 等)
*   **头发:**
    *   颜色: \`黑色长发\`, \`银色短发\`, (或其他颜色)
    *   发型: \`半个马尾\`, \`蓬松长发\`, \`飘逸直发\`, \`自然卷曲\`
    *   发量与状态: \`头发茂密\`, \`凌乱\`, \`发丝细腻\`
    *   光泽: \`头发绸缎一般光泽\`
*   **面部:**
    *   眼睛: \`桃花眼\`, \`丹凤眼\`, \`大眼睛\` (或其他类型)
    *   神态: \`微笑\`, \`沉思\`, \`温柔\`, \`坚定\`
    *   光照: \`人物的脸部被光照亮\`, \`阳光透过[物体如树叶/荷叶]在人物的脸上投下了斑驳的阴影\`
*   **身材:** \`身材修长均匀\`, \`强壮宽肩\`, \`纤细\`
*   **动作 (可选):** \`向前伸手\`

**四、服饰与配饰 (Clothing & Accessories):**

*   **基础衣物:** \`白色衬衫\`, \`古风长袍\`, \`襦裙\` (或其他)
*   **材质:** \`亮片纱\`, \`丝绒提花\`, \`欧根纱\`, \`绸缎\`, \`棉麻\`, \`皮革\`
*   **细节与工艺:** \`暗纹\`, \`刺绣\`, \`印花\`, \`花边\`, \`繁复垂坠褶皱\`, \`传统衣服暗纹\`
*   **配饰:** \`护腕\`, \`玉石配饰\`, \`古风配饰流苏\`, \`华丽丰富饰品\`, \`头冠\`, \`耳坠\`
*   **武器 (如适用):** \`腰间挂着两把西方武器\` (或 \`中国古剑\`, \`长弓\` 等), \`武器上镶嵌了宝石\`

**五、水墨技法 (Ink Wash Techniques):**

*   **勾线:** \`水墨湿笔勾线\`, \`回折处干脆利落\` (Ink wash wet brush outline, crisp and neat folds/turns)
*   **上色:** \`水墨晕染上色\`, \`叠涂\`, \`弥散渐变\` (Ink wash blooming/smudging for coloring, layering, diffused gradients)
*   **点缀:** \`金色银色点缀\` (Gold and silver embellishments)
*   **水迹:** \`水迹\` (Water stains/marks)

**六、背景与氛围 (Background & Atmosphere):**

*   **主色调/主题色:** \`黑色+亮银\`, \`紫+绀\`, \`灰红色调\`, \`灰绿色调\` (或自定义)
*   **背景元素:** \`背景深色系\`, \`提花云锦帷幔\`, \`花海\`, \`枯萎植物\`, \`山水\`, \`竹林\`
*   **特定氛围:** \`主题枯萎\`, \`主题鲜艳\`, \`暗夜微光\`, \`温馨且略带忧郁\`

**如何使用这个框架生成提示词:**

1.  **确定核心主题/人物:** 例如，你想画一个“月下吹笛的白发仙人”。
2.  **挑选基础风格与画质元素:** 大部分情况下，第一部分的核心风格与画质可以保留大部分。
3.  **选择构图:** 是高角度还是正面？特写还是全身？
4.  **设计人物细节:** 白发，什么发型？仙风道骨的眼睛，什么表情？
5.  **构思服饰:** 飘逸的道袍，什么材质？丝绸？棉麻？有无暗纹？配饰是玉簪还是长剑？
6.  **选择水墨技法:** 这些通常是固定的，除非你想尝试特定效果。
7.  **设定背景与氛围:** 月夜，深蓝色背景，可能有祥云图案的帷幔。氛围是清冷、神秘。
8.  **组合关键词:** 将选择的关键词用逗号或加号连接起来。注意词语的顺序有时也会影响结果，通常将核心描述放在前面。

请以JSON格式返回，格式如下：
{
  "imagePrompt": "画面描述..."
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