import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
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
  averageWords: number;
  averageCharacters: number;
  averageSentences: number;
  averageParagraphs: number;
  averageReadingTime: number;
}

interface RadarChartProps {
  wordCount: number;
  analysisStats?: AnalysisStats;
}

export const RadarChart: React.FC<RadarChartProps> = ({ wordCount, analysisStats }) => {
  const calculateNormalizedValue = (value: number, average: number) => {
    if (average === 0) return 50; // Default to middle if no average available
    // Normalize based on percentage above/below average (capped at 200% of average)
    const percentage = (value / average) * 50; // 50 = 100% of average on our 0-100 scale
    return Math.min(percentage, 100);
  };

  const characters = wordCount * 5;
  const sentences = Math.ceil(wordCount / 15);
  const paragraphs = Math.ceil(wordCount / 100);
  const readingTime = Math.ceil(wordCount / 200);

  // Use fallback averages if analysisStats is not available
  const fallbackStats = {
    averageWords: 2500,
    averageCharacters: 12500,
    averageSentences: 167,
    averageParagraphs: 25,
    averageReadingTime: 13
  };

  const stats = analysisStats || fallbackStats;

  const data = {
    labels: ['Words', 'Characters', 'Sentences', 'Paragraphs', 'Reading Time'],
    datasets: [
      {
        label: 'Content Metrics',
        data: [
          calculateNormalizedValue(wordCount, stats.averageWords),
          calculateNormalizedValue(characters, stats.averageCharacters),
          calculateNormalizedValue(sentences, stats.averageSentences),
          calculateNormalizedValue(paragraphs, stats.averageParagraphs),
          calculateNormalizedValue(readingTime, stats.averageReadingTime),
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

  const options = {
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
            let averageValue: number;
            let unit: string;
            
            switch(label) {
              case 'Words':
                actualValue = wordCount;
                averageValue = stats.averageWords;
                unit = '';
                break;
              case 'Characters':
                actualValue = characters;
                averageValue = stats.averageCharacters;
                unit = '';
                break;
              case 'Sentences':
                actualValue = sentences;
                averageValue = stats.averageSentences;
                unit = '';
                break;
              case 'Paragraphs':
                actualValue = paragraphs;
                averageValue = stats.averageParagraphs;
                unit = '';
                break;
              case 'Reading Time':
                actualValue = readingTime;
                averageValue = stats.averageReadingTime;
                unit = ' minutes';
                break;
              default:
                return `${label}: ${context.parsed.r}%`;
            }
            
            const percentage = averageValue > 0 ? Math.round((actualValue / averageValue) * 100) : 100;
            return [
              `${label}: ${actualValue.toLocaleString()}${unit}`,
              `Average: ${averageValue.toLocaleString()}${unit}`,
              `${percentage}% of average`
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
            weight: '600' as const,
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