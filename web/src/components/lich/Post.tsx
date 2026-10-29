"use client";

// Một dòng tin của trang chung (DỮ LIỆU MẪU, xem lib/feed-sample.ts): sự kiện có tờ lịch nhỏ của ngày diễn ra (đỏ khi còn từ 3 ngày trở xuống,
// theo luật Lịch bloc), tin khác có chữ cái đầu của CLB. Cả dòng là một link tới chi tiết tin.

import Link from "next/link";
import { agoLabel, initials } from "@/lib/format";
import { POST_KIND_LABEL, type SamplePost } from "@/lib/feed-sample";
import { isUrgent, Leaf } from "./Leaf";
import { LinkIcon } from "./motion";

export function PostRow({ post }: { post: SamplePost }) {
  const sum = post.body.length > 140 ? `${post.body.slice(0, 137).trimEnd()}…` : post.body;
  return (
    <li>
      <Link className="l-post" href={`/feed/${post.id}`}>
        <span className="l-post-lead">
          {post.eventAt
            ? <Leaf date={post.eventAt} size="md" tone={isUrgent(post.eventAt) ? "urgent" : undefined} label={`Sự kiện ngày ${new Date(post.eventAt).toLocaleDateString("vi-VN")}`} />
            : <span className="l-avatar" aria-hidden="true">{initials(post.clubName)}</span>}
        </span>
        <span className="l-post-main">
          <span className="l-post-club">{post.clubName}<span className={`l-tag ${post.kind === "event" ? "wait" : "off"}`}>{POST_KIND_LABEL[post.kind]}</span></span>
          <strong className="l-post-title">{post.title}</strong>
          <span className="l-post-sum">{sum}</span>
          <span className="l-note">Đăng {agoLabel(post.postedAt)}</span>
        </span>
        <span className="l-post-arrow"><LinkIcon name="chevronRight" size={18} /></span>
      </Link>
    </li>
  );
}
