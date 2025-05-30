// 游戏相关类型
export type GameState = {
  task?: {
    description: string;
    progress?: string;
  };
  skills?: Record<string, number>;
  goldenFingers?: Array<{
    name: string;
    description: string;
  }>;
}

export type SceneDescription = {
  imagePrompt: string;
  imageUrl?: string;
  segments: Array<{
    text: string;
    type: 'narration' | 'character';
    speaker?: string;
  }>;
  options?: Array<{
    id: string;
    text: string;
  }>;
}

export type StoryInfo = {
  title: string;
  worldBackground: string;
  introduction: string;
  protagonist: {
    name: string;
    description: string;
  };
  initialSkills: Record<string, number>;
}

export type Message = {
  role: string;
  content: string;
}

export type SkillChange = {
  name: string;
  oldValue: number;
  newValue: number;
  change: number;
} 