import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AnalysisStats {
  medianWords: number;
  medianCharacters: number;
  medianSentences: number;
  medianParagraphs: number;
  medianReadingTime: number;
}

interface RadarChartProps {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  analysisStats?: AnalysisStats;
}

export const RadarChart: React.FC<RadarChartProps> = ({ 
  wordCount, 
  characterCount, 
  sentenceCount, 
  paragraphCount, 
  readingTimeMinutes, 
  analysisStats 
}) => {
  const calculateNormalizedValue = (value: number, median: number) => {
    if (median === 0) return 50; // Default to middle if no median available
    // Normalize based on percentage above/below median (capped at 200% of median)
    const percentage = (value / median) * 50; // 50 = 100% of median on our 0-100 scale
    return Math.min(percentage, 100);
  };

  // Use fallback medians if analysisStats is not available
  const fallbackStats = {
    medianWords: 2500,
    medianCharacters: 12500,
    medianSentences: 167,
    medianParagraphs: 25,
    medianReadingTime: 13
  };

  const stats = analysisStats || fallbackStats;

  const data = {
    labels: ['Words', 'Characters', 'Sentences', 'Paragraphs', 'Reading Time'],
    datasets: [
      {
        label: 'Content Metrics',
        data: [
          calculateNormalizedValue(wordCount, stats.medianWords),
          calculateNormalizedValue(characterCount, stats.medianCharacters),
          calculateNormalizedValue(sentenceCount, stats.medianSentences),
          calculateNormalizedValue(paragraphCount, stats.medianParagraphs),
          calculateNormalizedValue(readingTimeMinutes, stats.medianReadingTime),
        ],
        backgroundColor: 'rgba(0, 191, 174, 0.2)',
        borderColor: 'rgba(0, 191, 174, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(0, 191, 174, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(0, 191, 174, 1)',
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label;
            let actualValue: number;
            let medianValue: number;
            let unit: string;
            
            switch(label) {
              case 'Words':
                actualValue = wordCount;
                medianValue = stats.medianWords;
                unit = '';
                break;
              case 'Characters':
                actualValue = characterCount;
                medianValue = stats.medianCharacters;
                unit = '';
                break;
              case 'Sentences':
                actualValue = sentenceCount;
                medianValue = stats.medianSentences;
                unit = '';
                break;
              case 'Paragraphs':
                actualValue = paragraphCount;
                medianValue = stats.medianParagraphs;
                unit = '';
                break;
              case 'Reading Time':
                actualValue = readingTimeMinutes;
                medianValue = stats.medianReadingTime;
                unit = ' minutes';
                break;
              default:
                return `${label}: ${context.parsed.r}%`;
            }
            
            const percentage = medianValue > 0 ? Math.round((actualValue / medianValue) * 100) : 100;
            return [
              `${label}: ${actualValue.toLocaleString()}${unit}`,
              `Median: ${medianValue.toLocaleString()}${unit}`,
              `${percentage}% of median`
            ];
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false,
        },
        grid: {
          color: 'rgba(0, 191, 174, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 191, 174, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 600,
          },
          color: 'var(--text)',
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <Radar data={data} options={options} />
    </div>
  );
};