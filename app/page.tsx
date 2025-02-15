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
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSchema, runQuery } from './db'
import { generateSqlQuery, getMermaidErDiagramInput } from './llm'
import { generateErDiagram } from './mermaid'

export default function Home() {
  const [messages, setMessages] = useState<
    { message: string; role: 'user' | 'assistant' | 'database' }[]
  >([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [erDiagram, setErDiagram] = useState<string | null>(null)

  const updateErDiagram = async () => {
    try {
      const schemaInfo = await getSchema()
      const erDiagramInput = await getMermaidErDiagramInput({ schemaInfo })
      if (erDiagramInput) {
        const erDiagram = await generateErDiagram(erDiagramInput)
        setErDiagram(erDiagram)
      }
    } catch (error) {
      toast.error('Error updating ER diagram', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  useEffect(() => {
    updateErDiagram()
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessages((messages) => [...messages, { message: input, role: 'user' }])
    setInput('')
    setIsTyping(true)
    const schemaInfo = await getSchema()
    const response = await generateSqlQuery({
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
    updateErDiagram()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Database Schema</CardTitle>
        </CardHeader>
        <CardContent>
          {erDiagram && (
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: erDiagram }}
            />
          )}
        </CardContent>
      </Card>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Chat with the database</CardTitle>
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
