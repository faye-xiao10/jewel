'use client'

import { useState } from 'react'
import type { CanvasSettings } from '@/lib/settings'

interface SettingsPanelProps {
  settings: CanvasSettings
  onUpdate: <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => void
  onReset: () => void
}

export default function SettingsPanel({ settings, onUpdate, onReset }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
        title="Settings"
      >
        ⚙
      </button>

      {open && (
        <div
          className="absolute top-14 right-4 z-50 rounded-lg shadow-xl overflow-y-auto overflow-x-hidden"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            maxHeight: 'calc(100vh - 80px)',
            width: '300px',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">Canvas Settings</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-200 text-lg leading-none">×</button>
          </div>

          <div className="px-4 py-3 space-y-4">
            <Section label="Font Sizes">
              <SliderInput label="H1" value={settings.h1Size} min={20} max={120} onChange={(v) => onUpdate('h1Size', v)} />
              <SliderInput label="H2" value={settings.h2Size} min={16} max={90} onChange={(v) => onUpdate('h2Size', v)} />
              <SliderInput label="H3" value={settings.h3Size} min={14} max={60} onChange={(v) => onUpdate('h3Size', v)} />
              <SliderInput label="Default" value={settings.defaultSize} min={10} max={24} onChange={(v) => onUpdate('defaultSize', v)} />
            </Section>

            <Section label="Colors">
              <ColorRow label="Node" value={settings.nodeColor} onChange={(v) => onUpdate('nodeColor', v)} />
              <ColorRow label="Edge" value={settings.edgeColor} onChange={(v) => onUpdate('edgeColor', v)} />
              <ColorRow label="Question (?)" value={settings.questionColor} onChange={(v) => onUpdate('questionColor', v)} />
            </Section>

            <Section label="Text Wrapping">
              <SliderInput label="Wrap at (chars)" value={settings.wrapLength} min={10} max={100} onChange={(v) => onUpdate('wrapLength', v)} />
            </Section>

            <Section label="Indent Spacing">
              <SliderInput label="Tab X" value={settings.tabIndentX} min={0} max={200} onChange={(v) => onUpdate('tabIndentX', v)} />
              <SliderInput label="Tab Y" value={settings.tabIndentY} min={0} max={200} onChange={(v) => onUpdate('tabIndentY', v)} />
              <SliderInput label="Shift+Enter Y" value={settings.shiftEnterIndentY} min={20} max={200} onChange={(v) => onUpdate('shiftEnterIndentY', v)} />
            </Section>

            <button
              onClick={onReset}
              className="w-full rounded px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SliderInput({ label, value, min, max, onChange }: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 shrink-0" style={{ width: '90px' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-indigo-500 min-w-0"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!isNaN(v) && v >= min && v <= max) onChange(v)
        }}
        className="text-xs text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 shrink-0"
        style={{ width: '44px' }}
      />
    </div>
  )
}

function ColorRow({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 shrink-0" style={{ width: '90px' }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-6 rounded cursor-pointer border-0 bg-transparent shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
        }}
        className="flex-1 text-xs text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 min-w-0"
        maxLength={7}
      />
    </div>
  )
}