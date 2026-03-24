import { useState, useRef, useCallback } from 'react'
import { GripVertical, Edit, Trash2, Plus, Clock, User } from 'lucide-react'

export interface KanbanColumn {
  id: string
  title: string
  color?: string
}

export interface KanbanItem {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  due_date?: string
  assigned_to?: string
  [key: string]: unknown
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  items: KanbanItem[]
  onStatusChange: (itemId: string, newStatus: string) => void
  onEdit?: (item: KanbanItem) => void
  onDelete?: (item: KanbanItem) => void
  onAdd?: (status: string) => void
  renderExtraContent?: (item: KanbanItem) => React.ReactNode
  getPriorityColor?: (priority: string) => string
}

export default function KanbanBoard({
  columns,
  items,
  onStatusChange,
  onEdit,
  onDelete,
  onAdd,
  renderExtraContent,
  getPriorityColor
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const dragNodeRef = useRef<HTMLDivElement | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, item: KanbanItem) => {
    setDraggedItem(item)
    dragNodeRef.current = e.target as HTMLDivElement
    
    // Set drag image
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    
    // Add dragging class after a small delay for visual feedback
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.classList.add('dragging')
      }
    }, 0)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove('dragging')
    }
    setDraggedItem(null)
    setDragOverColumn(null)
    dragNodeRef.current = null
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem.status !== columnId) {
      setDragOverColumn(columnId)
    }
  }, [draggedItem])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    const currentTarget = e.currentTarget as HTMLElement
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem.status !== columnId) {
      onStatusChange(draggedItem.id, columnId)
    }
    setDraggedItem(null)
    setDragOverColumn(null)
  }, [draggedItem, onStatusChange])

  const getItemsByColumn = (columnId: string) => {
    return items.filter(item => item.status === columnId)
  }

  const defaultGetPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'var(--gray-400)',
      medium: 'var(--blue-500)',
      high: 'var(--yellow-500)',
      critical: 'var(--red-500)'
    }
    return colors[priority] || 'var(--gray-400)'
  }

  const priorityColorFn = getPriorityColor || defaultGetPriorityColor

  const getColumnColor = (column: KanbanColumn) => {
    if (column.color) return column.color
    
    const colors: Record<string, string> = {
      'todo': 'var(--gray-500)',
      'in-progress': 'var(--blue-500)',
      'review': 'var(--yellow-500)',
      'done': 'var(--green-500)',
      'cancelled': 'var(--red-500)',
      'planning': 'var(--blue-500)',
      'active': 'var(--green-500)',
      'on-hold': 'var(--yellow-500)',
      'completed': 'var(--gray-500)'
    }
    return colors[column.id] || 'var(--gray-500)'
  }

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const columnItems = getItemsByColumn(column.id)
        const isOver = dragOverColumn === column.id
        
        return (
          <div
            key={column.id}
            className={`kanban-column ${isOver ? 'kanban-column-drop-target' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <span 
                  className="kanban-column-indicator" 
                  style={{ backgroundColor: getColumnColor(column) }}
                />
                <span>{column.title}</span>
                <span className="kanban-column-count">{columnItems.length}</span>
              </div>
              {onAdd && (
                <button 
                  className="kanban-add-btn"
                  onClick={() => onAdd(column.id)}
                  title={`Add to ${column.title}`}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            <div className="kanban-column-content">
              {columnItems.map((item) => {
                const isDragging = draggedItem?.id === item.id
                
                return (
                  <div
                    key={item.id}
                    className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="kanban-card-header">
                      <GripVertical className="kanban-card-grip" size={14} />
                      <div className="kanban-card-actions">
                        {onEdit && (
                          <button 
                            className="kanban-card-action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(item)
                            }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            className="kanban-card-action-btn kanban-card-action-btn-danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(item)
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="kanban-card-title">{item.title}</div>
                    
                    {item.description && (
                      <div className="kanban-card-description">
                        {item.description.length > 80 
                          ? `${item.description.substring(0, 80)}...` 
                          : item.description}
                      </div>
                    )}
                    
                    {renderExtraContent && renderExtraContent(item)}
                    
                    <div className="kanban-card-footer">
                      {item.priority && (
                        <span 
                          className="kanban-priority-badge"
                          style={{ backgroundColor: priorityColorFn(item.priority) }}
                        >
                          {item.priority}
                        </span>
                      )}
                      
                      <div className="kanban-card-meta">
                        {item.due_date && (
                          <span className="kanban-due-date">
                            <Clock size={12} />
                            {new Date(item.due_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                        {item.assigned_to && (
                          <span className="kanban-assigned">
                            <User size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {columnItems.length === 0 && !isOver && (
                <div className="kanban-empty">
                  <span>Drop items here</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}