const features = [
  {
    title: 'The Canvas',
    summary:
      'Infinite, pannable, zoomable. Tap anywhere to create a node and it auto-connects to its nearest neighbor. Long-press a node handle to draw explicit edges between any two nodes.',
  },
  {
    title: 'Node Editing',
    summary:
      'Click any node to open the editor. Type, voice-transcribe, or paste a URL. Nodes stay minimal by default — structure appears only when you add it.',
  },
  {
    title: 'Keyboard-First',
    summary:
      'Build entire graphs without touching the mouse. Tab moves to the next node, Shift+Enter chains a new child, and Shift+arrows let you traverse the tree.',
  },
  {
    title: 'Subtree Actions',
    summary:
      'Shift+click selects a node and all its descendants as a subtree. Move, copy as Markdown, delete, detach from its parent, or reattach to a new one — all as a unit.',
  },
  {
    title: 'Session Colors',
    summary:
      'Every session gets a unique color automatically applied to the nodes and edges you create. See at a glance which thoughts came from which visit — and edit colors retroactively.',
  },
  {
    title: 'Heading Hierarchy',
    summary:
      'Prefix any node with #, ##, or ### to set its heading level. Build structured outlines inside an unstructured spatial canvas — no folders required.',
  },
]

export default function FeaturesGrid() {
  return (
    <section className="px-6 py-16 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-5"
            style={{
              background: '#0d1527',
              border: '1px solid #1e293b',
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#a78bfa' }}>
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
              {f.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
