import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search, FolderTree, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from '@/components/ui/dialog'

// Build a nested tree from a flat [{id, name, parent_id, selectable}] array,
// and record each node's ancestor chain so we can render breadcrumbs / auto-expand.
function buildTree(flat) {
  const map = {}
  flat.forEach((c) => { map[c.id] = { ...c, _children: [] } })
  const roots = []
  flat.forEach((c) => {
    const node = map[c.id]
    if (c.parent_id != null && map[c.parent_id]) {
      map[c.parent_id]._children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach((n) => sortRec(n._children))
  }
  sortRec(roots)
  return { roots, map }
}

// All selectable leaf descendants of a node (a leaf node is its own sole descendant).
function collectLeaves(node, out) {
  if (node._children.length === 0) {
    if (node.selectable !== false) out.push(node)
    return
  }
  node._children.forEach((child) => collectLeaves(child, out))
}

function pathTo(map, id) {
  const path = []
  let cur = id != null ? map[id] : null
  while (cur) {
    path.unshift(cur)
    cur = cur.parent_id != null ? map[cur.parent_id] : null
  }
  return path
}

// Rebuild a tree containing only the given leaves and their ancestor chains,
// so search results keep their parent context instead of a flat list.
function buildFilteredTree(map, leafIds) {
  const included = new Map()
  leafIds.forEach((leafId) => {
    pathTo(map, leafId).forEach((n) => {
      if (!included.has(n.id)) included.set(n.id, { ...n, _children: [] })
    })
  })
  included.forEach((node) => {
    if (node.parent_id != null && included.has(node.parent_id)) {
      included.get(node.parent_id)._children.push(node)
    }
  })
  const roots = [...included.values()].filter((n) => n.parent_id == null || !included.has(n.parent_id))
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach((n) => sortRec(n._children))
  }
  sortRec(roots)
  return roots
}

function collectIds(nodes, out) {
  nodes.forEach((n) => { out.add(n.id); collectIds(n._children, out) })
}

// Categories matching the query, rebuilt as a tree so matched parents show with their children.
function searchCategories(map, categories, q) {
  const leafIds = new Set()
  for (const c of categories ?? []) {
    if (!c.name.toLowerCase().includes(q)) continue
    // A matched leaf is a result on its own; a matched parent contributes all of its leaves,
    // since parents aren't directly selectable — search should surface what you can actually pick.
    const leaves = []
    collectLeaves(map[c.id], leaves)
    leaves.forEach((leaf) => leafIds.add(leaf.id))
  }
  const roots = buildFilteredTree(map, [...leafIds])
  const expandedIds = new Set()
  collectIds(roots, expandedIds)
  return { roots, expandedIds, count: leafIds.size }
}

function TreeRow({ node, depth, expanded, onToggle, onSelect, selectedId }) {
  const hasChildren = node._children.length > 0
  const isOpen = expanded.has(node.id)
  // selectable:false only rules out picking a leaf — a branch's only job is expand/collapse,
  // so it's never "disabled" even when its whole subtree is unpicked/inactive.
  const disabled = !hasChildren && node.selectable === false

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm ${
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.06]'
        } ${selectedId === node.id ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium' : 'dark:text-slate-200'}`}
        style={{ paddingLeft: 8 + depth * 18 }}
        onClick={() => {
          if (hasChildren) { onToggle(node.id); return }
          if (disabled) return
          onSelect(node)
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id) }}
          className={`h-4 w-4 shrink-0 flex items-center justify-center text-slate-400 ${hasChildren ? '' : 'invisible'}`}
        >
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <span className="truncate flex-1">{node.name}</span>
        {selectedId === node.id && <Check className="h-3.5 w-3.5 shrink-0" />}
      </div>
      {hasChildren && isOpen && (
        <div>
          {node._children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Searchable, expandable tree picker for a single category.
 * `categories` accepts either a flat array ({id, name, parent_id}) or the
 * `?tree=1` shape that also includes inactive ancestors tagged `selectable: false`.
 */
export function CategoryTreeSelect({ categories, value, onChange, placeholder = '— Saýlaň —' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(new Set())

  const { roots, map } = useMemo(() => buildTree(categories ?? []), [categories])

  const selected = value ? map[value] : null
  const selectedPath = useMemo(
    () => (selected ? pathTo(map, selected.id).map((n) => n.name).join(' / ') : ''),
    [map, selected]
  )

  const openPicker = () => {
    setQuery('')
    setExpanded(value ? new Set(pathTo(map, value).slice(0, -1).map((n) => n.id)) : new Set())
    setOpen(true)
  }

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const select = (node) => {
    onChange(node.id)
  }

  const handleQueryChange = (v) => {
    setQuery(v)
    const q2 = v.trim().toLowerCase()
    if (!q2) return
    // Auto-expand newly matched branches, but don't clobber branches the user already
    // collapsed by hand while typing (setExpanded runs from this event handler, not an effect).
    const { expandedIds } = searchCategories(map, categories, q2)
    setExpanded((prev) => new Set([...prev, ...expandedIds]))
  }

  const q = query.trim().toLowerCase()
  const searchTree = useMemo(() => (q ? searchCategories(map, categories, q) : null), [q, categories, map])

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="w-full min-h-9 border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2 text-left"
      >
        <span className={`break-words ${selected ? '' : 'text-slate-400'}`}>
          {selected ? selectedPath : placeholder}
        </span>
        <FolderTree className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kategoriýa saýlaň</DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[70vh]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Kategoriýa gözle…"
                className="pl-8 h-9"
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
              {q ? (
                searchTree.count === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Hiç zat tapylmady</p>
                ) : (
                  searchTree.roots.map((node) => (
                    <TreeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      expanded={expanded}
                      onToggle={toggle}
                      onSelect={select}
                      selectedId={value}
                    />
                  ))
                )
              ) : (
                roots.map((node) => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggle}
                    onSelect={select}
                    selectedId={value}
                  />
                ))
              )}
            </div>
          </DialogBody>
          <DialogFooter className="items-center justify-between gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 break-words flex-1">
              {selected ? <>Saýlandy: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedPath}</span></> : 'Kategoriýa saýlanmady'}
            </span>
            <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!selected} className="shrink-0">
              Taýýar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
