"use client";

// Đầu trang của các màn trong khung ban điều hành: tờ lịch hôm nay cỡ vừa, tiêu đề, dòng phụ, nút.
// Tờ lịch mang cùng tên chuyển cảnh với trang chủ, nên khi chuyển trang nó dời và thu nhỏ lại thay vì vẽ lại.

import type { ReactNode } from "react";
import { TodayLeaf } from "./Leaf";
import { Skel, SkelLine } from "./motion";

export function PageTop({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="l-top md">
      <TodayLeaf size="md" />
      <div className="l-top-text">
        <h1>{title}</h1>
        {sub && <div className="l-top-sub">{sub}</div>}
      </div>
      {actions && <div className="l-top-actions">{actions}</div>}
    </header>
  );
}

/** Độ rộng cột cố định, dùng chung cho bảng thật và khung xương của nó: dữ liệu tới thì tiêu đề cột không nhảy ngang. */
export function ColGroup({ widths }: { widths: string[] }) {
  return <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>;
}

/** Bảng đang tải: tiêu đề cột là chữ thật, các ô là thanh giữ chỗ. `right`: các cột căn phải (số tiền, thao tác).
 *  action: cột cuối là nút (cao 34px); tags: các cột có nhãn trạng thái (cao 26px); foot: có dòng "Tổng" ở cuối bảng như bảng thật.
 *  Tiêu đề có phần phụ thuộc dữ liệu (ví dụ "Dự trù Fall 2026") thì truyền vào chữ kèm thanh giữ chỗ. */
export function TableSkeleton({ headers, widths, rows, right = [], tags = [], action = true, foot = false, className }: {
  headers: ReactNode[]; widths: string[]; rows: number; right?: number[]; tags?: number[]; action?: boolean; foot?: boolean;
  /** Lớp thêm của bảng thật, để khung xương cùng bề rộng và cùng chiều cao dòng. */
  className?: string;
}) {
  return (
    <div className="l-table-wrap">
      <table className={className ? `l-table l-fixed ${className}` : "l-table l-fixed"}>
        <ColGroup widths={widths} />
        <thead><tr>{headers.map((h, i) => <th key={i} className={right.includes(i) ? "r" : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {headers.map((_, i) => (
                <td key={i} className={right.includes(i) ? "r" : undefined}>
                  {/* Cột cuối là nút thao tác (cao 34px); các cột khác là một dòng chữ. */}
                  {action && i === headers.length - 1 ? <Skel w={104} h={34} className="l-skel-end" />
                    : tags.includes(i) ? <span className="l-tag off"><SkelLine w={64} /></span>
                    : <SkelLine w={`${50 + ((r * 7 + i * 13) % 35)}%`} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && <tfoot><tr>{headers.map((_, i) => <td key={i} className={right.includes(i) ? "r" : undefined}>{i === 0 ? "Tổng" : right.includes(i) ? <SkelLine w="60%" /> : null}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}
