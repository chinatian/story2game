import { useState, useRef } from 'react';
import { GameState, SkillChange } from '@/types';
import { toast } from '@/components/ui/use-toast';

export function useGameState(initialSkills: Record<string, number>) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [skillChanges, setSkillChanges] = useState<SkillChange[]>([]);
  const [showSkillChanges, setShowSkillChanges] = useState(false);
  const [previousSkills, setPreviousSkills] = useState<Record<string, number>>(initialSkills);
  const previousTaskRef = useRef<string | null>(null);
  const [taskChanged, setTaskChanged] = useState(false);
  const [newTask, setNewTask] = useState<any>(null);

  const handleSkillIncrease = (skillName: string) => {
    setGameState((prevState: any) => ({
      ...prevState,
      skills: {
        ...(prevState?.skills || {}),
        [skillName]: (prevState?.skills?.[skillName] || 0) + 5
      }
    }));

    const currentValue = gameState?.skills?.[skillName] || 0;
    const skillChange: SkillChange = {
      name: skillName,
      oldValue: currentValue,
      newValue: currentValue + 5,
      change: 5
    };

    setSkillChanges([skillChange]);
    setShowSkillChanges(true);

    setTimeout(() => {
      setShowSkillChanges(false);
    }, 3000);
  };

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    
    // 检查任务变化
    if (newState.task?.description !== previousTaskRef.current) {
      if (previousTaskRef.current) {
        setTaskChanged(true);
        setNewTask(newState.task);
        toast({
          title: "任务已更新",
          description: newState.task?.description
        });
        setTimeout(() => setTaskChanged(false), 5000);
      }
      previousTaskRef.current = newState.task?.description || null;
    }

    // 检查技能变化
    if (newState.skills) {
      const changes: SkillChange[] = [];
      Object.entries(newState.skills).forEach(([skillName, newValue]) => {
        const oldValue = previousSkills[skillName] || 0;
        if (oldValue !== newValue) {
          changes.push({
            name: skillName,
            oldValue,
            newValue,
            change: newValue - oldValue
          });
        }
      });

      if (changes.length > 0) {
        setSkillChanges(changes);
        setShowSkillChanges(true);
        setPreviousSkills(newState.skills);
        setTimeout(() => setShowSkillChanges(false), 5000);
      }
    }
  };

  return {
    gameState,
    skillChanges,
    showSkillChanges,
    taskChanged,
    newTask,
    handleSkillIncrease,
    updateGameState
  };
} 