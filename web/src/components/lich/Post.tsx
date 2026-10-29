"use client";

// Một dòng tin của Cộng đồng: sự kiện có tờ lịch nhỏ của ngày diễn ra (đỏ khi còn từ 3 ngày trở xuống, theo luật Lịch bloc),
// tin khác có chữ cái đầu của CLB. Cả dòng là một link tới chi tiết tin.
// Duyệt trước, hiện sau (Hiệu chốt 29/10/2026): tin chưa được trường duyệt hiện cho người đăng như đã đăng lên nhưng mờ đi, kèm nhãn "Chờ trường duyệt";
// tin bị từ chối cũng mờ, kèm nhãn và lý do. Nhãn và lý do giữ rõ nét: mờ chỉ là gợi ý thêm, người đọc màn hình vẫn biết trạng thái nhờ nhãn.

import Link from "next/link";
import type { ReactNode } from "react";
import type { PostDto } from "@contract";
import { agoLabel, initials } from "@/lib/format";
import { POST_KIND_LABEL, POST_STATUS_LABEL } from "@/lib/types";
import { isUrgent, Leaf } from "./Leaf";
import { LinkIcon } from "./motion";

export function PostRow({ post, internal = false, action }: { post: PostDto; /** Màn của ban điều hành: hiện thêm người đăng. */ internal?: boolean; /** Nút dưới dòng tin (ví dụ "Sửa và gửi lại"), nằm ngoài link để không lồng nút trong link. */ action?: ReactNode }) {
  const sum = post.body.length > 140 ? `${post.body.slice(0, 137).trimEnd()}…` : post.body;
  const event = post.eventAt ? Date.parse(post.eventAt) : undefined;
  const waiting = post.status !== "approved";
  return (
    <li>
      <Link className={`l-post${waiting ? " dim" : ""}`} href={`/feed/${post.id}`}>
        <span className="l-post-lead">
          {event !== undefined
            ? <Leaf date={event} size="md" tone={isUrgent(event) ? "urgent" : undefined} label={`Sự kiện ngày ${new Date(event).toLocaleDateString("vi-VN")}`} />
            : <span className="l-avatar" aria-hidden="true">{initials(post.club.name)}</span>}
        </span>
        <span className="l-post-main">
          <span className="l-post-club">{post.club.name}<span className={`l-tag ${post.kind === "event" ? "wait" : "off"}`}>{POST_KIND_LABEL[post.kind]}</span></span>
          <strong className="l-post-title">{post.title}</strong>
          <span className="l-post-sum">{sum}</span>
          <span className="l-note">Đăng {agoLabel(post.createdAt)}{internal && post.author ? ` · ${post.author.name}` : ""}</span>
          {waiting && (
            <span className="l-post-state">
              <span className={`l-tag ${post.status === "rejected" ? "warn" : "wait"}`}>{POST_STATUS_LABEL[post.status]}</span>
              {post.status === "rejected" && post.rejectReason && <span className="l-note">Lý do: {post.rejectReason}</span>}
            </span>
          )}
        </span>
        <span className="l-post-arrow"><LinkIcon name="chevronRight" size={18} /></span>
      </Link>
      {action && <div className="l-post-action">{action}</div>}
    </li>
  );
}
