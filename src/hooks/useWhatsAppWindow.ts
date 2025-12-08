import { useState, useEffect, useMemo } from 'react';
import { differenceInHours } from 'date-fns';

interface Message {
  id: string;
  remetente_tipo: string;
  created_at: string;
}

interface UseWhatsAppWindowProps {
  messages: Message[];
  enabled?: boolean;
}

interface UseWhatsAppWindowReturn {
  isWindowClosed: boolean;
  lastClientMessageAt: Date | null;
  hoursRemaining: number;
  hoursSinceLast: number;
}

/**
 * Hook para verificar a janela de 24 horas do WhatsApp Business API.
 * A Meta permite enviar mensagens gratuitas apenas dentro de 24 horas
 * após a última mensagem do cliente.
 */
export function useWhatsAppWindow({
  messages,
  enabled = true,
}: UseWhatsAppWindowProps): UseWhatsAppWindowReturn {
  const [now, setNow] = useState(new Date());

  // Atualiza o tempo atual a cada minuto para recalcular a janela
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [enabled]);

  const result = useMemo(() => {
    if (!enabled || messages.length === 0) {
      return {
        isWindowClosed: false,
        lastClientMessageAt: null,
        hoursRemaining: 24,
        hoursSinceLast: 0,
      };
    }

    // Encontrar a última mensagem do cliente
    const clientMessages = messages.filter(
      (msg) => msg.remetente_tipo === 'cliente'
    );

    if (clientMessages.length === 0) {
      // Se não há mensagens do cliente, a janela está fechada
      return {
        isWindowClosed: true,
        lastClientMessageAt: null,
        hoursRemaining: 0,
        hoursSinceLast: 0,
      };
    }

    // Ordenar por data e pegar a mais recente
    const sortedClientMessages = [...clientMessages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const lastClientMessage = sortedClientMessages[0];
    const lastClientMessageAt = new Date(lastClientMessage.created_at);
    
    // Calcular quantas horas se passaram desde a última mensagem do cliente
    const hoursSinceLast = differenceInHours(now, lastClientMessageAt);
    
    // A janela fecha após 24 horas
    const isWindowClosed = hoursSinceLast >= 24;
    const hoursRemaining = Math.max(0, 24 - hoursSinceLast);

    return {
      isWindowClosed,
      lastClientMessageAt,
      hoursRemaining,
      hoursSinceLast,
    };
  }, [messages, now, enabled]);

  return result;
}
