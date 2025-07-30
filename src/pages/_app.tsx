import type { AppProps } from 'next/app'
import { ConvexProvider } from "convex/react"
import { convex } from "../lib/convex"
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConvexProvider client={convex}>
      <Component {...pageProps} />
    </ConvexProvider>
  )
}
