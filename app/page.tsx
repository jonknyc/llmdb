'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { getSchema, runQuery } from './db'
import { generateSQLQuery } from './llm'

export default function Home() {
  const [messages, setMessages] = useState<
    { message: string; role: 'user' | 'assistant' | 'database' }[]
  >([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessages((messages) => [...messages, { message: input, role: 'user' }])
    setInput('')
    setIsTyping(true)
    const schemaInfo = await getSchema()
    const response = await generateSQLQuery({
      queryDescription: input,
      schemaInfo,
    })
    if (response) {
      setMessages((messages) => [
        ...messages,
        { message: response, role: 'assistant' },
      ])
      try {
        const result = await runQuery(response)
        setMessages((messages) => [
          ...messages,
          { message: result, role: 'database' },
        ])
      } catch (error) {
        if (error instanceof Error) {
          setMessages((messages) => [
            ...messages,
            { message: error.message, role: 'database' },
          ])
        }
      }
    }
    setIsTyping(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Chat with AI</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto">
          {messages.map((m, index) => (
            <div
              key={index}
              className={`mb-4 ${
                m.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  m.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : m.role === 'assistant'
                    ? 'bg-gray-200 text-black font-mono'
                    : 'bg-black text-white font-mono'
                }`}
              >
                {m.message.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i !== m.message.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="text-left">
              <span className="inline-block p-2 rounded-lg bg-gray-200 text-black">
                AI is typing...
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={onSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit" disabled={isTyping}>
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
