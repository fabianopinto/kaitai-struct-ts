import { useMemo } from 'react'
import { TreeNode } from './TreeNode'
import { resultToTree } from '@/lib/parse-tree-utils'

interface ParseTreeProps {
  data: unknown | null
  onFieldSelect?: (fieldName: string) => void
  selectedField?: string | null
}

export function ParseTree({ data, onFieldSelect, selectedField }: ParseTreeProps) {
  const tree = useMemo(() => {
    if (!data) return null
    return resultToTree(data, 'root')
  }, [data])

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center border border-border rounded-lg bg-muted/20">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No parse result</p>
          <p className="text-sm text-muted-foreground">
            Parse a file to see the structure
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-2">
        <span className="text-sm font-medium">Parse Tree</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {tree && (
          <TreeNode
            node={tree}
            depth={0}
            onSelect={onFieldSelect}
            selectedPath={selectedField}
          />
        )}
      </div>
    </div>
  )
}
