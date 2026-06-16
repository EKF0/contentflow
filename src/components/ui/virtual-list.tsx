'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { List, useListRef } from 'react-window';
import type { CSSProperties } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number | string;
  width?: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  overscanCount?: number;
  className?: string;
  onScroll?: (scrollOffset: number) => void;
}

interface VirtualListHandle {
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
}

interface RowData {
  items: unknown[];
  renderItem: (item: unknown, index: number, style: CSSProperties) => React.ReactNode;
}

function VirtualListInner<T>(
  {
    items,
    height,
    width = '100%',
    itemHeight,
    renderItem,
    overscanCount = 5,
    className,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const listRef = useListRef();

  useImperativeHandle(ref, () => ({
    scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => {
      listRef.current?.scrollToRow({ index, align });
    },
  }));

  const rowData: RowData = { items: items as unknown[], renderItem: renderItem as RowData['renderItem'] };

  const RowComponent = (props: { index: number; style: CSSProperties }) => {
    const item = rowData.items[props.index] as T;
    return <>{rowData.renderItem(item, props.index, props.style)}</>;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ height, width, overflow: 'auto' }} className={className}>
      <List
        listRef={listRef}
        rowCount={items.length}
        rowHeight={itemHeight}
        rowComponent={RowComponent}
        rowProps={rowData}
        overscanCount={overscanCount}
      />
    </div>
  );
}

const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListHandle> },
) => ReturnType<typeof VirtualListInner>;

export { VirtualList, type VirtualListHandle, type VirtualListProps };
