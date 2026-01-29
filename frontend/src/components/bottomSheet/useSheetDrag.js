import { useRef, useState } from "react";

const SHEET_HEIGHTS = {
  peek: 80,
  partial: window.innerHeight * 0.45,
  full: window.innerHeight * 0.9,
};

export default function useSheetDrag({ sheetState, setSheetState }) {
  const startYRef = useRef(null);
  const startHeightRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [dragHeight, setDragHeight] = useState(null);

  const DRAG_THRESHOLD = 60;

  const onDragStart = (clientY) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = SHEET_HEIGHTS[sheetState];
  };

  const onDragMove = (clientY) => {
    if (!isDraggingRef.current) return;

    const deltaY = clientY - startYRef.current;
    const nextHeight = startHeightRef.current - deltaY;

    const min = SHEET_HEIGHTS.peek;
    const max = SHEET_HEIGHTS.full;

    setDragHeight(Math.max(min, Math.min(max, nextHeight)));
  };

  const onDragEnd = () => {
    if (!isDraggingRef.current) return;

    const current = dragHeight ?? SHEET_HEIGHTS[sheetState];

    // 스냅 기준
    if (current > SHEET_HEIGHTS.partial + DRAG_THRESHOLD) {
      setSheetState("full");
    } else if (current < SHEET_HEIGHTS.partial - DRAG_THRESHOLD) {
      setSheetState("peek");
    } else {
      setSheetState("partial");
    }

    setDragHeight(null);
    isDraggingRef.current = false;
  };

  return {
    dragHeight,
    handlers: {
      onMouseDown: (e) => onDragStart(e.clientY),
      onMouseMove: (e) => onDragMove(e.clientY),
      onMouseUp: onDragEnd,
      onTouchStart: (e) => onDragStart(e.touches[0].clientY),
      onTouchMove: (e) => onDragMove(e.touches[0].clientY),
      onTouchEnd: onDragEnd,
    },
  };
}
