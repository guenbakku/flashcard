export interface Deck {
  identifier: string
  name: string
  description: string
  cardCount: number
  lastStudied: string | null
  correct: Record<string, true>
  progress: number
}

export interface Card {
  front: string
  back: string
  backSub?: string
}
