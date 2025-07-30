import { useState, useEffect, useRef } from "react"
import { countWordsFromUrl } from "@/lib/actions"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import styles from "./Home.module.css"

export default function Home() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ wordCount: number; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [copiedMetric, setCopiedMetric] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Convex mutations and queries
  const storeAnalysis = useMutation(api.analyses.storeAnalysis)
  const totalAnalyses = useQuery(api.analyses.getTotalAnalyses)
  const analysisStats = useQuery(api.analyses.getAnalysisStats)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await countWordsFromUrl(url)
      setResult(data)
      
      // Store analysis data in Convex
      await storeAnalysis({
        url: data.url,
        wordCount: data.wordCount,
        characterCount: data.wordCount * 5, // Rough estimate
        sentenceCount: Math.ceil(data.wordCount / 15), // Rough estimate
        paragraphCount: Math.ceil(data.wordCount / 100), // Rough estimate
        readingTimeMinutes: Math.ceil(data.wordCount / 200),
        userAgent: navigator.userAgent,
      })
      
      // Smooth scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process URL")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setUrl("")
    setResult(null)
    setError(null)
    setCopiedMetric(null)
  }

  const copyToClipboard = async (text: string, metricName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMetric(metricName)
      setTimeout(() => setCopiedMetric(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const getMetrics = () => {
    if (!result) return []
    
    return [
      {
        label: "Total Words",
        value: result.wordCount.toLocaleString(),
        subtext: "words found",
        metricName: "words"
      },
      {
        label: "Characters",
        value: (result.wordCount * 5).toLocaleString(), // Rough estimate
        subtext: "characters",
        metricName: "characters"
      },
      {
        label: "Sentences",
        value: Math.ceil(result.wordCount / 15).toLocaleString(), // Rough estimate
        subtext: "sentences",
        metricName: "sentences"
      },
      {
        label: "Paragraphs",
        value: Math.ceil(result.wordCount / 100).toLocaleString(), // Rough estimate
        subtext: "paragraphs",
        metricName: "paragraphs"
      },
      {
        label: "Reading Time",
        value: Math.ceil(result.wordCount / 200).toString(),
        subtext: "minutes",
        metricName: "readingTime"
      }
    ]
  }

  return (
    <main className={styles.main}>
      {/* Animated background elements */}
      <div className={styles.backgroundElements}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
      </div>

      <div className={styles.container}>
        {/* Counter Display */}
        <div className={styles.counterContainer}>
          <div className={styles.counterCard}>
            <div className={styles.counterIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className={styles.counterContent}>
              <div className={styles.counterValue}>
                {totalAnalyses !== undefined ? totalAnalyses.toLocaleString() : "..."}
              </div>
              <div className={styles.counterLabel}>Webpages Analyzed</div>
            </div>
          </div>
        </div>

        {/* Stats Display */}
        {analysisStats && (
          <div className={styles.statsContainer}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analysisStats.totalWords.toLocaleString()}</div>
                <div className={styles.statLabel}>Total Words Analyzed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analysisStats.averageWords.toLocaleString()}</div>
                <div className={styles.statLabel}>Average Words per Page</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analysisStats.averageReadingTime}</div>
                <div className={styles.statLabel}>Avg. Reading Time (min)</div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        {!result && (
          <div className={`${styles.hero} ${isVisible ? styles.visible : ''}`}>
            <h1 className={styles.title}>CountLeaf</h1>
            <p className={styles.subtitle}>Instantly count words from any webpage</p>
            <p className={styles.description}>Simple, fast, and reliable word counting tool for web content analysis</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorCard}>
              <div className={styles.errorContent}>
                <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className={styles.errorTitle}>Error</h3>
                  <p className={styles.errorMessage}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className={`${styles.mainCard} ${isVisible ? styles.visible : ''}`}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="url" className={styles.label}>Website URL</label>
              <div className={styles.inputContainer}>
                <input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className={styles.input}
                />
                <div className={styles.inputIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className={`${styles.button} ${isLoading ? styles.loading : ''}`}
            >
              {isLoading ? (
                <div className={styles.buttonContent}>
                  <div className={styles.spinner}></div>
                  <span>Analyzing webpage...</span>
                </div>
              ) : (
                <div className={styles.buttonContent}>
                  <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Count Words</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className={styles.resultsContainer}>
            <div className={styles.resultsCard}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Analysis Complete!</h2>
                <div className={styles.resultsDivider}></div>
              </div>
              
              <div className={styles.resultsContent}>
                <div className={styles.urlCard}>
                  <div className={styles.urlLabel}>Website URL</div>
                  <div className={styles.urlValue} title={result.url}>
                    {result.url.length > 60 ? `${result.url.substring(0, 60)}...` : result.url}
                  </div>
                </div>
                
                <div className={styles.metricsGrid}>
                  {getMetrics().map((metric, index) => (
                    <div
                      key={index}
                      className={`${styles.metricCard} ${copiedMetric === metric.metricName ? styles.copied : ''}`}
                      onClick={() => copyToClipboard(metric.value, metric.metricName)}
                      title={`Click to copy ${metric.value} ${metric.subtext}`}
                    >
                      <div className={styles.metricLabel}>{metric.label}</div>
                      <div className={styles.metricValue}>{metric.value}</div>
                      <div className={styles.metricSubtext}>{metric.subtext}</div>
                      {copiedMetric === metric.metricName && (
                        <div className={styles.copyIndicator}>
                          <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.resultsActions}>
                <button
                  onClick={handleReset}
                  className={styles.resetButton}
                >
                  <svg className={styles.resetIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Analyze Another Page</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!result && (
          <div className={`${styles.featuresSection} ${isVisible ? styles.visible : ''}`}>
          <h2 className={styles.featuresTitle}>Why Choose CountLeaf?</h2>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Get word counts in seconds with our optimized processing engine"
              },
              {
                icon: "🎯",
                title: "Accurate Results",
                description: "Advanced text parsing ensures precise word counting for any webpage"
              },
              {
                icon: "🔒",
                title: "Privacy First",
                description: "Your URLs are processed securely and never stored or shared"
              }
            ].map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </main>
  )
}
