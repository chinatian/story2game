import { useState, useRef } from 'react';
import { Message } from '@/types';
import { parseGameState, parseOptions } from '@/lib/parser';
import { toast } from '@/components/ui/use-toast';

export function useChat(apiKey: string, model: string, systemPrompt: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (!apiKey) {
      toast({
        title: "缺少API密钥",
        description: "请在设置中输入OpenRouter API密钥",
        variant: "destructive",
      });
      return;
    }

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingContent('');
    setOptions([]);

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          apiKey,
          model,
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("响应没有返回数据流");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        completeResponse += chunk;
        setStreamingContent(completeResponse);
      }

      // 完成流式传输后，添加AI回复
      setMessages([...newMessages, { role: 'assistant', content: completeResponse }]);
      setStreamingContent('');

      // 解析选项
      const optionsData = parseOptions(completeResponse);
      if (optionsData) {
        setOptions(optionsData);
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "发送消息失败",
        description: error instanceof Error ? error.message : "请检查网络连接或API密钥",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    streamingContent,
    options,
    messagesEndRef,
    sendMessage,
    setMessages,
    setOptions,
    setStreamingContent
  };
} 