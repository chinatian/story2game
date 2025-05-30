import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SceneDescription, GameState } from '@/types';
import { ListTodo, Info, Maximize2 } from 'lucide-react';

interface ImmersiveModeProps {
  sceneDescriptions: SceneDescription;
  gameState: GameState | null;
  isLoading: boolean;
  isGeneratingImage: boolean;
  options: Array<{ id: string; text: string; }>;
  onExit: () => void;
  onShowIntro: () => void;
  onShowTaskInfo: () => void;
  onSubmitAction: (action: string) => void;
}

export function ImmersiveMode({
  sceneDescriptions,
  gameState,
  isLoading,
  isGeneratingImage,
  options,
  onExit,
  onShowIntro,
  onShowTaskInfo,
  onSubmitAction
}: ImmersiveModeProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [customAction, setCustomAction] = useState('');
  const immersiveContentRef = useRef<HTMLDivElement>(null);

  // ... 其余实现代码
} 