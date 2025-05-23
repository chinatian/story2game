import { ArrowUp, ArrowDown, Plus } from "lucide-react"

type SkillChange = {
  name: string
  oldValue: number
  newValue: number
  change: number
}

interface SkillsDisplayProps {
  skills: Record<string, number>
  skillChanges: SkillChange[]
  showSkillChanges: boolean
  onSkillIncrease?: (skillName: string) => void
}

export function SkillsDisplay({ skills, skillChanges, showSkillChanges, onSkillIncrease }: SkillsDisplayProps) {
  // 获取技能变化的样式和图标
  const getSkillChangeStyle = (skillName: string) => {
    if (!showSkillChanges) return { className: "", icon: null }

    const change = skillChanges.find((c) => c.name === skillName)
    if (!change) return { className: "", icon: null }

    if (change.change > 0) {
      return {
        className: "bg-green-50 border-green-200 animate-pulse",
        icon: <ArrowUp className="h-4 w-4 text-green-600 ml-1" />,
      }
    } else if (change.change < 0) {
      return {
        className: "bg-red-50 border-red-200 animate-pulse",
        icon: <ArrowDown className="h-4 w-4 text-red-600 ml-1" />,
      }
    }

    return { className: "", icon: null }
  }

  return (
    <div className="z-50 fixed right-4 top-24 w-48 bg-white rounded-lg shadow-lg p-4 border border-gray-200 hidden md:block">
      <h3 className="font-bold text-purple-800 mb-3">角色技能</h3>
      <div className="space-y-2">
        {Object.entries(skills).map(([skill, value]) => {
          const { className, icon } = getSkillChangeStyle(skill)
          return (
            <div
              key={skill}
              className={`flex flex-row items-center justify-between bg-white p-2 rounded shadow-sm ${className}`}
            >
              <div className="text-sm font-medium text-gray-700">{skill}</div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onSkillIncrease?.(skill)}
                  className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                  title="增加技能点数"
                >
                  <Plus className="h-4 w-4 text-purple-600" />
                </button>
                <span className="font-bold text-purple-700">{value}</span>
                {icon}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 