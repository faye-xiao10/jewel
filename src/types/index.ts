export interface Canvas {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Node {
  id: string
  canvasId: string
  text: string | null
  url: string | null
  color?: string | null
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
  color?: string | null
  createdAt: string
}
