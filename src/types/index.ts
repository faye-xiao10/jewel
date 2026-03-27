export interface Node {
  id: string
  canvasId: string
  text: string | null
  url: string | null
  x: number
  y: number
  createdAt: string
  updatedAt: string
}

export interface Edge {
  id: string
  canvasId: string
  fromId: string
  toId: string
  createdAt: string
}
