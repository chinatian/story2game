// 解析游戏状态
export function parseGameState(content: string) {
  const gameStateMatch = content.match(/<gameState>([\s\S]*?)<\/gameState>/)

  // 如果没有找到gameState标签，返回null
  if (!gameStateMatch)
    return {
      skills: {},
      task: null,
      goldenFingers: [],
    }

  const gameStateContent = gameStateMatch[1]

  // 解析技能
  const skillsMatch = gameStateContent.match(/<currentSkills>([\s\S]*?)<\/currentSkills>/)
  const skills: Record<string, number> = {}

  if (skillsMatch) {
    const skillsContent = skillsMatch[1]
    const skillRegex = /<(.*?)>(\d+)<\/\1>/g
    let match

    while ((match = skillRegex.exec(skillsContent)) !== null) {
      skills[match[1]] = Number.parseInt(match[2])
    }
  }

  // 解析当前任务
  const taskMatch = gameStateContent.match(/<currentActiveTask[^>]*id="([^"]*)"[^>]*description="([^"]*)"[^>]*status="([^"]*)"[^>]*roundProgress="\((\d+)\/(\d+)\)"[^>]*\/>/)
  const task = { description: "", progress: "" }

  if (taskMatch) {
    task.description = taskMatch[2]
    task.progress = `${taskMatch[4]}/${taskMatch[5]}`
  }else{
    // Try alternate task format with XML element
    const altTaskMatch = gameStateContent.match(/<currentActiveTask>\s*<task id="([^"]*)" description="([^"]*)" status="([^"]*)" roundProgress="\((\d+)\/(\d+)\)"\/>\s*<\/currentActiveTask>/)
    if (altTaskMatch) {
      task.description = altTaskMatch[2]
      task.progress = `${altTaskMatch[4]}/${altTaskMatch[5]}`
    }
  }



  // 解析金手指
  const goldenFingersMatch = gameStateContent.match(/<currentGoldenFingers>([\s\S]*?)<\/currentGoldenFingers>/)
  const goldenFingers: Array<{ id: string; name: string; description: string }> = []

  if (goldenFingersMatch) {
    const gfContent = goldenFingersMatch[1]
    const gfRegex = /<gf id="([^"]*)" name="([^"]*)" description="([^"]*)"/g
    let match

    while ((match = gfRegex.exec(gfContent)) !== null) {
      goldenFingers.push({
        id: match[1],
        name: match[2],
        description: match[3]
      })
    }
  }

  return {
    skills,
    task,
    goldenFingers,
  }
}

// 解析选项
export function parseOptions(content: string) {
  const optionsMatch = content.match(/<options>([\s\S]*?)<\/options>/)

  if (!optionsMatch) return null

  const optionsContent = optionsMatch[1]
  const optionRegex = /<option id="(\d+)">([^<]*)<\/option>/g

  const options: Array<{ id: string; text: string }> = []
  let match

  while ((match = optionRegex.exec(optionsContent)) !== null) {
    options.push({
      id: match[1],
      text: match[2].trim(),
    })
  }

  return options
}
