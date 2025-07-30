import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const COUNTER_FILE = path.join(process.cwd(), 'data', 'counter.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(COUNTER_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read counter from file
function readCounter(): number {
  try {
    ensureDataDir()
    if (fs.existsSync(COUNTER_FILE)) {
      const data = fs.readFileSync(COUNTER_FILE, 'utf8')
      return JSON.parse(data).count || 0
    }
  } catch (error) {
    console.error('Error reading counter:', error)
  }
  return 0
}

// Write counter to file
function writeCounter(count: number) {
  try {
    ensureDataDir()
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count, lastUpdated: new Date().toISOString() }))
  } catch (error) {
    console.error('Error writing counter:', error)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    // Get current counter value
    const count = readCounter()
    res.status(200).json({ count })
  } else if (req.method === 'POST') {
    // Increment counter
    const currentCount = readCounter()
    const newCount = currentCount + 1
    writeCounter(newCount)
    res.status(200).json({ count: newCount })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 