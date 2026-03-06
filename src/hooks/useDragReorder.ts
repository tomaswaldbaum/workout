import { useRef, useState, useCallback, useEffect } from 'react';

interface DragState {
  /** Index of the item currently being dragged */
  dragIndex: number;
  /** Current visual offset Y of the dragged item */
  offsetY: number;
  /** Index the dragged item is hovering over (insert position) */
  hoverIndex: number;
}

interface UseDragReorderReturn<T> {
  /** Items in their current visual order */
  items: T[];
  /** Current drag state (null if idle) */
  dragState: DragState | null;
  /** Props to spread on each draggable container */
  getItemProps: (index: number) => {
    ref: (el: HTMLElement | null) => void;
    style: React.CSSProperties;
    'data-drag-index': number;
  };
  /** Props to spread on the drag handle element */
  getHandleProps: (index: number) => {
    onPointerDown: (e: React.PointerEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  /** Whether a drag is currently active */
  isDragging: boolean;
}

/**
 * Lightweight touch+pointer drag-to-reorder hook.
 * Works on mobile (PWA) and desktop. No external dependencies.
 */
export function useDragReorder<T>(
  sourceItems: T[],
  onReorder: (from: number, to: number) => void
): UseDragReorderReturn<T> {
  const [items, setItems] = useState(sourceItems);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Keep items in sync with source when not dragging
  useEffect(() => {
    if (!dragState) setItems(sourceItems);
  }, [sourceItems, dragState]);

  // Refs for measuring
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const startY = useRef(0);
  const startIndex = useRef(0);
  const heights = useRef<number[]>([]);
  const containerTop = useRef(0);
  const scrollParent = useRef<HTMLElement | null>(null);
  const rafId = useRef(0);
  const autoScrollRaf = useRef(0);

  // Find scrollable parent
  const findScrollParent = (el: HTMLElement): HTMLElement => {
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const { overflow, overflowY } = getComputedStyle(node);
      if (overflow === 'auto' || overflow === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') {
        return node;
      }
      node = node.parentElement;
    }
    return document.documentElement;
  };

  // Snapshot heights for displacement math
  const snapshotHeights = useCallback(() => {
    const h: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const el = itemRefs.current.get(i);
      h.push(el ? el.getBoundingClientRect().height : 0);
    }
    heights.current = h;
  }, [items.length]);

  // Given a Y offset from the drag start, compute what index the item is hovering over
  const computeHoverIndex = useCallback(
    (offsetY: number): number => {
      const idx = startIndex.current;
      const h = heights.current;
      let hoverIdx = idx;

      if (offsetY > 0) {
        // Moving down
        let accumulated = 0;
        for (let i = idx + 1; i < h.length; i++) {
          accumulated += h[i];
          if (offsetY > accumulated - h[i] / 2) {
            hoverIdx = i;
          } else {
            break;
          }
        }
      } else {
        // Moving up
        let accumulated = 0;
        for (let i = idx - 1; i >= 0; i--) {
          accumulated -= h[i];
          if (offsetY < accumulated + h[i] / 2) {
            hoverIdx = i;
          } else {
            break;
          }
        }
      }
      return hoverIdx;
    },
    []
  );

  // Auto-scroll when dragging near edges
  const autoScroll = useCallback((clientY: number) => {
    const sp = scrollParent.current;
    if (!sp) return;

    const rect = sp === document.documentElement
      ? { top: 0, bottom: window.innerHeight }
      : sp.getBoundingClientRect();

    const edgeZone = 60;
    const maxSpeed = 12;

    let speed = 0;
    if (clientY < rect.top + edgeZone) {
      speed = -maxSpeed * (1 - (clientY - rect.top) / edgeZone);
    } else if (clientY > rect.bottom - edgeZone) {
      speed = maxSpeed * (1 - (rect.bottom - clientY) / edgeZone);
    }

    if (speed !== 0) {
      sp.scrollTop += speed;
    }
  }, []);

  // Pointer/Touch move handler
  const onMove = useCallback(
    (clientY: number) => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const offsetY = clientY - startY.current;
        const hoverIndex = computeHoverIndex(offsetY);
        setDragState((prev) =>
          prev ? { ...prev, offsetY, hoverIndex } : null
        );
        autoScroll(clientY);
      });
    },
    [computeHoverIndex, autoScroll]
  );

  // Pointer/Touch end handler
  const onEnd = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    cancelAnimationFrame(autoScrollRaf.current);

    const state = dragState;
    if (state && state.dragIndex !== state.hoverIndex) {
      // Commit the reorder
      onReorder(state.dragIndex, state.hoverIndex);
    }

    setDragState(null);

    // Cleanup global listeners
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchEnd);

    // Re-enable scrolling
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('touch-action');
  }, [dragState, onReorder]);

  // We need stable references for the global event listeners
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onMoveRef.current = onMove;
    onEndRef.current = onEnd;
  }, [onMove, onEnd]);

  // Global event handlers (stable)
  function handlePointerMove(e: PointerEvent) {
    e.preventDefault();
    onMoveRef.current(e.clientY);
  }
  function handlePointerUp() {
    onEndRef.current();
  }
  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    onMoveRef.current(e.touches[0].clientY);
  }
  function handleTouchEnd() {
    onEndRef.current();
  }

  // Start drag
  const startDrag = useCallback(
    (index: number, clientY: number, el: HTMLElement) => {
      startIndex.current = index;
      startY.current = clientY;
      snapshotHeights();

      scrollParent.current = findScrollParent(el);
      const firstRect = itemRefs.current.get(0)?.getBoundingClientRect();
      containerTop.current = firstRect?.top ?? 0;

      setDragState({ dragIndex: index, offsetY: 0, hoverIndex: index });

      // Prevent body scrolling during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Attach global listeners
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    },
    [snapshotHeights]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafId.current);
      cancelAnimationFrame(autoScrollRaf.current);
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
    };
  }, []);

  // Compute displacement styles for non-dragged items
  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => {
      if (!dragState) return { transition: 'transform 200ms ease' };

      const { dragIndex, hoverIndex } = dragState;

      if (index === dragIndex) {
        return {
          transform: `translateY(${dragState.offsetY}px) scale(1.02)`,
          zIndex: 50,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(236,72,153,0.2)',
          opacity: 0.95,
          transition: 'box-shadow 200ms ease, scale 200ms ease',
          pointerEvents: 'none',
        };
      }

      // Compute displacement: items between dragIndex and hoverIndex shift
      const itemHeight = heights.current[dragIndex] || 0;
      let displacement = 0;

      if (dragIndex < hoverIndex) {
        // Dragging down: items between (dragIndex, hoverIndex] shift up
        if (index > dragIndex && index <= hoverIndex) {
          displacement = -itemHeight - 12; // 12 = gap (space-y-3 = 0.75rem ≈ 12px)
        }
      } else if (dragIndex > hoverIndex) {
        // Dragging up: items between [hoverIndex, dragIndex) shift down
        if (index >= hoverIndex && index < dragIndex) {
          displacement = itemHeight + 12;
        }
      }

      return {
        transform: displacement !== 0 ? `translateY(${displacement}px)` : 'translateY(0)',
        transition: 'transform 200ms ease',
        position: 'relative',
        zIndex: 1,
      };
    },
    [dragState]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        if (el) itemRefs.current.set(index, el);
        else itemRefs.current.delete(index);
      },
      style: getItemStyle(index),
      'data-drag-index': index,
    }),
    [getItemStyle]
  );

  const getHandleProps = useCallback(
    (index: number) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return; // only primary button
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        startDrag(index, e.clientY, target);
      },
      onTouchStart: (e: React.TouchEvent) => {
        // Touch is already handled by pointer events on most browsers,
        // but we keep this as a fallback
        e.stopPropagation();
      },
      style: {
        cursor: dragState ? 'grabbing' : 'grab',
        touchAction: 'none' as const,
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
      },
    }),
    [startDrag, dragState]
  );

  return {
    items,
    dragState,
    getItemProps,
    getHandleProps,
    isDragging: dragState !== null,
  };
}
