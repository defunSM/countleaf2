export interface CaptchaChallenge {
  question: string
  answer: number
  id: string
}

export function generateCaptcha(): CaptchaChallenge {
  const operations = ['+', '-', '*']
  const operation = operations[Math.floor(Math.random() * operations.length)]
  
  let num1: number, num2: number, answer: number, question: string
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      answer = num1 + num2
      question = `${num1} + ${num2}`
      break
    case '-':
      num1 = Math.floor(Math.random() * 50) + 25
      num2 = Math.floor(Math.random() * 25) + 1
      answer = num1 - num2
      question = `${num1} - ${num2}`
      break
    case '*':
      num1 = Math.floor(Math.random() * 10) + 1
      num2 = Math.floor(Math.random() * 10) + 1
      answer = num1 * num2
      question = `${num1} × ${num2}`
      break
    default:
      num1 = 5
      num2 = 3
      answer = 8
      question = '5 + 3'
  }
  
  const id = Math.random().toString(36).substring(2, 15)
  
  return { question, answer, id }
}

const captchaStore = new Map<string, { answer: number; expires: number }>()

export function storeCaptcha(id: string, answer: number): void {
  const expires = Date.now() + 5 * 60 * 1000 // 5 minutes
  captchaStore.set(id, { answer, expires })
  
  // Clean up expired captchas
  const now = Date.now()
  for (const [key, value] of captchaStore.entries()) {
    if (value.expires < now) {
      captchaStore.delete(key)
    }
  }
}

export function verifyCaptcha(id: string, userAnswer: number): boolean {
  const stored = captchaStore.get(id)
  
  if (!stored) {
    return false
  }
  
  if (stored.expires < Date.now()) {
    captchaStore.delete(id)
    return false
  }
  
  const isValid = stored.answer === userAnswer
  
  // Remove captcha after verification (one-time use)
  captchaStore.delete(id)
  
  return isValid
}