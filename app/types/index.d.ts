export interface Deck {
  identifier: string
  name: string
  description: string
  cardCount: number
  lastStudied: string | null
  masteredCards: Record<string, true>
  progress: number
}

export interface Card {
  front: string
  back: string
  backSub?: string
}
