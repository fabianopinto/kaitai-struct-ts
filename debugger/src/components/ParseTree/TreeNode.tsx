/**
 * @fileoverview Parse tree node component (recursive)
 * @module debugger/components/ParseTree/TreeNode
 * @author Fabiano Pinto
 * @license MIT
 */

import { useState, memo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { formatValue, getNodeIcon } from '@/lib/parse-tree-utils'
import type { ParseTreeNode } from '@/types'

/**
 * Tree node component props
 */
interface TreeNodeProps {
  /** Parse tree node data */
  node: ParseTreeNode
  /** Nesting depth for indentation */
  depth: number
  /** Callback when node is selected */
  onSelect?: (path: string) => void
  /** Currently selected node path */
  selectedPath?: string | null
  /** Parent node path */
  parentPath?: string
}

/**
 * Recursive tree node component for displaying parse tree hierarchy
 *
 * @param props - Component props
 * @returns Tree node component
 */
export const TreeNode = memo(function TreeNode({
  node,
  depth,
  onSelect,
  selectedPath,
  parentPath = '',
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2) // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0

  const currentPath = parentPath ? `${parentPath}.${node.name}` : node.name
  const isSelected = selectedPath === currentPath

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
    onSelect?.(currentPath)
  }

  const icon = getNodeIcon(node.type)
  const displayValue = formatValue(node.value)

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className={`
          flex items-center gap-2 px-2 py-1 rounded cursor-pointer
          hover:bg-accent/50 transition-colors
          ${isSelected ? 'bg-accent' : ''}
        `}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <span className="w-4" />
          )}
        </div>

        {/* Icon */}
        <span className="text-sm">{icon}</span>

        {/* Name */}
        <span className="font-mono text-sm font-medium">{node.name}</span>

        {/* Type */}
        <span className="text-xs text-muted-foreground">({node.type})</span>

        {/* Value */}
        {!hasChildren && <span className="text-sm text-muted-foreground ml-2">{displayValue}</span>}

        {/* Metadata */}
        {node.offset !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto">
            @ 0x{node.offset.toString(16).toUpperCase()}
          </span>
        )}
        {node.size !== undefined && (
          <span className="text-xs text-muted-foreground">({node.size} bytes)</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${currentPath}.${child.name}-${index}`}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
})
