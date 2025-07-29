# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CountLeaf is a Next.js web application that analyzes webpages and counts their word content. It's built with TypeScript and uses server-side processing to fetch and parse web content.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Components
- **Frontend**: Single-page React application (`src/pages/index.tsx`) with form-based URL input and results display
- **API Layer**: Next.js API routes in `src/pages/api/`
- **Business Logic**: Utility functions in `src/lib/actions.ts`

### Key Files
- `src/pages/index.tsx` - Main UI component with form, loading states, and results display
- `src/lib/actions.ts` - Core word counting logic using Cheerio for HTML parsing
- `src/pages/api/webcrawler.ts` - API endpoint that fetches HTML content from URLs
- `src/styles/Home.module.css` - Component-specific styling

### Data Flow
1. User enters URL in frontend form
2. Frontend calls `countWordsFromUrl()` from `actions.ts`
3. Action function calls `/api/webcrawler` endpoint with URL
4. API route fetches HTML content from the target URL
5. HTML is parsed using Cheerio to extract text content
6. Words are counted and result returned to frontend

### Dependencies
- **cheerio**: HTML parsing and manipulation
- **axios**: HTTP client (installed but not actively used)
- **lucide-react**: Icon components
- **clsx**: Conditional CSS class utility

### Styling Approach
- CSS Modules for component-specific styles
- Custom CSS animations and transitions
- No external CSS framework (previously removed Tailwind CSS)
- Space Mono font family for typography

## Development Notes

The application uses TypeScript path aliases (`@/*` maps to `./src/*`) configured in `tsconfig.json`. The webcrawler API endpoint currently has minimal error handling and could be enhanced for production use.