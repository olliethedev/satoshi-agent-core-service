"use client"
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/api-docs'
  }, [])
  return (
    <main >
      Redirecting to docs....
    </main>
  )
}
