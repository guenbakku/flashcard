export interface Deck {
  id: number
  name: string
  description: string
  cardCount: number
  lastStudied: string | null
  progress: number
}

export interface Card {
  id: number
  front: string
  back: string
}
