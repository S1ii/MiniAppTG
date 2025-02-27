// Минимальная и максимальная длина сообщения
export const MIN_MESSAGE_LENGTH = 50;
export const MAX_MESSAGE_LENGTH = 1000;

// Время между сообщениями в миллисекундах
export const POST_COOLDOWN = 60 * 1000; // 1 минута
export const COMMENT_COOLDOWN = 30 * 1000; // 30 секунд

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMessage(content: string, isComment: boolean = false): ValidationResult {
  // Для комментариев проверяем только что сообщение не пустое
  if (isComment) {
    if (!content.trim()) {
      return {
        isValid: false,
        error: 'Комментарий не может быть пустым.'
      };
    }
    return { isValid: true };
  }

  // Для постов сохраняем все ограничения
  if (content.length < MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Сообщение слишком короткое. Минимальная длина: ${MIN_MESSAGE_LENGTH} символов.`
    };
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Сообщение слишком длинное. Максимальная длина: ${MAX_MESSAGE_LENGTH} символов.`
    };
  }

  return { isValid: true };
}

// Кэш для хранения последних сообщений пользователей
const userMessagesCache = new Map<string, { content: string; timestamp: number; type: 'post' | 'comment' }>();

export function checkMessageFrequency(userId: string, content: string, isComment: boolean = false): ValidationResult {
  const now = Date.now();
  const lastMessage = userMessagesCache.get(userId);
  const cooldown = isComment ? COMMENT_COOLDOWN : POST_COOLDOWN;

  // Проверка времени между сообщениями (только для сообщений одного типа)
  if (lastMessage && 
      lastMessage.type === (isComment ? 'comment' : 'post') && 
      (now - lastMessage.timestamp) < cooldown) {
    const remainingTime = Math.ceil((cooldown - (now - lastMessage.timestamp)) / 1000);
    return {
      isValid: false,
      error: `Подождите ${remainingTime} секунд перед отправкой нового ${isComment ? 'комментария' : 'сообщения'}.`
    };
  }

  // Проверка на повторяющиеся сообщения
  if (lastMessage && lastMessage.content === content) {
    return {
      isValid: false,
      error: 'Нельзя отправлять одинаковые сообщения.'
    };
  }

  // Обновляем кэш
  userMessagesCache.set(userId, { 
    content, 
    timestamp: now,
    type: isComment ? 'comment' : 'post'
  });

  return { isValid: true };
} 