---
name: design-system
description: Design system guidelines for OpenCode Mobile blending Agentic AI, Bento grid cards, and Shadcn minimal aesthetics.
category: ui-ux
version: 1.0.0
---

# OpenCode Mobile — Design System & UI/UX Guidelines

Adapted from `bergside/awesome-design-skills` (`agentic`, `bento`, `shadcn`).

## Foundations & Aesthetic Vision

OpenCode Mobile is a modern, high-performance AI agent client. The UI/UX balances:
- **Agentic Simplicity**: Focus on content, streaming progress, clear tool invocations, and low visual noise.
- **Bento Card Structure**: Modular card grids with subtle borders, soft elevations, and rich status tags.
- **Shadcn Minimalist Tokens**: Slate/zinc dark surfaces, precise violet accents (`#8B5CF6`), and crisp 1px borders (`#2A2A3C`).

## Color Palette Tokens

### Dark Theme (Primary Default)
- **Background**: `#09090B` (zinc 950)
- **Surface / Card**: `#18181B` (zinc 900)
- **Elevated Card**: `#27272A` (zinc 800)
- **Border**: `#27272A` (1px subtle border)
- **Accent Primary**: `#8B5CF6` (violet 500)
- **Accent Light**: `#A78BFA` (violet 400)
- **User Bubble**: `#27272A`
- **Assistant Bubble**: `#18181B` with `#27272A` border
- **Text Main**: `#FAFAFA` (zinc 50)
- **Text Muted**: `#A1A1AA` (zinc 400)

### Light Theme
- **Background**: `#F4F4F5` (zinc 100)
- **Surface / Card**: `#FFFFFF`
- **Elevated Card**: `#F4F4F5`
- **Border**: `#E4E4E7`
- **Accent Primary**: `#7C3AED` (violet 600)
- **User Bubble**: `#7C3AED` (white text)
- **Assistant Bubble**: `#FFFFFF` with `#E4E4E7` border
- **Text Main**: `#09090B`
- **Text Muted**: `#71717A`

## Typography Scale
- **Display**: 24px, bold (headings, titles)
- **Title**: 18px, semibold (card titles, headers)
- **Body**: 15px, regular / medium (messages, descriptions)
- **Caption**: 13px, medium (status text, metadata)
- **Code / Mono**: 13px, monospace (JetBrains Mono / System Mono)

## Spacing & Hit Targets
- Baseline spacing grid: `4, 8, 12, 16, 20, 24, 32`
- Touch targets: minimum `44×44px` for interactive buttons and pills
- Border radius:
  - `sm`: 8px (badges, pills)
  - `md`: 12px (cards, popovers)
  - `lg`: 16px (message bubbles, bottom sheets)
  - `full`: 9999px (circular buttons, avatars)
