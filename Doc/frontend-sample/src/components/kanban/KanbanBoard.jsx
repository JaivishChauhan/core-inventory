import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import StatusBadge from '../ui/StatusBadge'
import SkuPill from '../ui/SkuPill'

function KanbanCard({ item, onCardClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(item)}
      className={`glass rounded-lg border border-slate-700/50 p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all group ${
        isDragging ? 'shadow-2xl shadow-primary/20 scale-105 rotate-1' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-primary font-semibold">{item.reference}</span>
        <StatusBadge status={item.status} />
      </div>
      <p className="text-sm text-slate-300 truncate">{item.vendor_name || item.contact_name || '—'}</p>
      {item.schedule_date && (
        <p className="text-xs text-slate-600 mt-1.5">
          {new Date(item.schedule_date).toLocaleDateString('en-IN')}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-slate-600">{item.line_count || 0} products</span>
        {item.sku && <SkuPill sku={item.sku} />}
      </div>
    </div>
  )
}

function KanbanColumn({ status, items, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const statusConfig = {
    draft: { label: 'Draft', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    waiting: { label: 'Waiting', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    ready: { label: 'Ready', color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
    done: { label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
    canceled: { label: 'Canceled', color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
  }

  const cfg = statusConfig[status] || statusConfig.draft

  return (
    <div
      className={`flex flex-col gap-3 p-3 rounded-xl border min-h-[200px] transition-colors ${
        cfg.bg
      } ${isOver ? `${cfg.border} shadow-lg` : 'border-slate-800/50'}`}
    >
      <div className="flex items-center justify-between px-1">
        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {items.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[100px]">
        <SortableContext items={items.map((item) => item.id)}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} onCardClick={onCardClick} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-slate-700 border border-dashed border-slate-800 rounded-lg">
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ items, columns, onStatusChange, onCardClick }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const grouped = {}
  columns.forEach((column) => {
    grouped[column] = items.filter((item) => item.status === column)
  })

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const activeItem = items.find((item) => item.id === active.id)
    const targetStatus = columns.find((column) => grouped[column].some((item) => item.id === over.id)) || over.id
    if (activeItem && targetStatus && activeItem.status !== targetStatus) {
      onStatusChange(activeItem.id, targetStatus)
    }
  }

  const activeItem = items.find((item) => item.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((status) => (
          <KanbanColumn key={status} status={status} items={grouped[status] || []} onCardClick={onCardClick} />
        ))}
      </div>
      <DragOverlay>{activeItem && <KanbanCard item={activeItem} onCardClick={onCardClick} />}</DragOverlay>
    </DndContext>
  )
}
