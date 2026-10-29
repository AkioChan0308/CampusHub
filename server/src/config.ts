// Cấu hình đọc từ biến môi trường (xem .env.example).

export interface Config {
  port: number;
  authMode: "demo" | "google";
  qrSecret: string;
  webOrigin: string;
  /** Khóa đăng nhập Google. Trống thì nút Google trên trang đăng nhập bị ẩn. */
  googleClientId: string;
  googleClientSecret: string;
  /** Ghép email Google thật với người trong dữ liệu mẫu, để thử từng vai: email viết thường → mã người. */
  loginAs: Record<string, string>;
  /** Cookie chỉ gửi qua HTTPS: bật khi web chạy bằng https. */
  cookieSecure: boolean;
  /** Địa chỉ PostgreSQL (docs/postgresql.md). Trống thì dữ liệu chỉ nằm trong bộ nhớ, tắt máy chủ là mất. */
  databaseUrl: string;
  /** mock: trợ lý bản mẫu, tính từ dữ liệu của CLB (mặc định). real: gọi Gemini; lỗi hoặc hết hạn mức thì lùi về bản mẫu. */
  aiMode: "mock" | "real";
  /** Khóa Gemini API (Google AI Studio). Bắt buộc khi AI_MODE=real; chỉ để trong .env. */
  geminiApiKey: string;
  /** Tên mô hình gọi qua Gemini API, ví dụ gemini-3.1-flash-lite hoặc một mô hình Gemma. */
  aiModel: string;
  /** Chỉ chế độ demo, để quay video: đồng hồ của máy chủ bắt đầu từ thời điểm này rồi chạy tiếp bình thường (dữ liệu mẫu đặt quanh 03/10/2026). Trống là dùng giờ thật. */
  demoNow: number | undefined;
  /** Số lần gọi Gemini tối đa của cả hệ thống trong 24 giờ (hạn mức miễn phí của dự án là 500 lượt mỗi ngày với gemini-3.1-flash-lite, đặt thấp hơn để chừa chỗ). Vượt thì dùng bản mẫu. 0 là không giới hạn. */
  aiDailyCap: number;
  /** Số lượt hỏi trợ lý tối đa mỗi CLB mỗi học kỳ ở bản miễn phí. 0 là không giới hạn: mức giới hạn chưa có nên mặc định không chặn. */
  aiFreeAsks: number;
}

const DEMO_QR_SECRET = "chi-dung-cho-ban-demo";

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const authMode = (env.AUTH_MODE ?? "demo") === "demo" ? "demo" : "google";
  const qrSecret = env.QR_SECRET || (authMode === "demo" ? DEMO_QR_SECRET : "");
  if (!qrSecret) throw new Error("Thiếu QR_SECRET. Bản thật phải đặt khóa bí mật để ký mã QR điểm danh.");
  const webOrigin = env.WEB_ORIGIN ?? "http://localhost:3000";
  const aiMode = env.AI_MODE === "real" ? "real" : "mock";
  if (aiMode === "real" && !env.GEMINI_API_KEY) throw new Error("Thiếu GEMINI_API_KEY. AI_MODE=real cần khóa tạo ở Google AI Studio, đặt trong server/.env.");
  return {
    port: Number(env.PORT ?? 4000),
    authMode,
    qrSecret,
    webOrigin,
    googleClientId: env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    loginAs: parseLoginAs(env.LOGIN_AS ?? ""),
    cookieSecure: webOrigin.startsWith("https://"),
    databaseUrl: env.DATABASE_URL ?? "",
    aiMode,
    geminiApiKey: env.GEMINI_API_KEY ?? "",
    aiModel: env.AI_MODEL || "gemini-3.1-flash-lite",
    demoNow: authMode === "demo" && env.DEMO_NOW && Number.isFinite(Date.parse(env.DEMO_NOW)) ? Date.parse(env.DEMO_NOW) : undefined,
    aiDailyCap: env.AI_DAILY_CAP === undefined || env.AI_DAILY_CAP === "" ? 400 : Math.max(0, Math.floor(Number(env.AI_DAILY_CAP)) || 0),
    aiFreeAsks: Math.max(0, Math.floor(Number(env.AI_FREE_ASKS_PER_TERM ?? 0)) || 0),
  };
}

/** "ban@example.com=a001, khoa@example.com=a002" → { "ban@example.com": "a001", ... } */
function parseLoginAs(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of text.split(",")) {
    const [email, personId] = pair.split("=").map((x) => x.trim());
    if (email && personId) map[email.toLowerCase()] = personId;
  }
  return map;
}
