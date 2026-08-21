# Dashboard nhạc (Next.js App Router)

Trang chủ/dashboard client, thay thế `views/client/pages/songs/list.pug`.
Gọi 1 API duy nhất `GET /dashboard` từ backend Express (xem project `backend-dashboard`).

## Cấu trúc

```
src/
├─ app/
│  ├─ layout.tsx        # root layout, load font Fraunces/Inter/IBM Plex Mono
│  ├─ page.tsx           # trang dashboard - server component, fetch dữ liệu
│  └─ globals.css
│
├─ components/
│  ├─ layout/            # khung trang, dùng chung mọi page
│  │  ├─ Sidebar.tsx
│  │  ├─ TopBar.tsx
│  │  └─ PlayerBar.tsx
│  ├─ dashboard/         # component riêng cho trang dashboard
│  │  ├─ HeroFeatured.tsx
│  │  ├─ TrackTable.tsx
│  │  └─ TopicCarousel.tsx
│  └─ ui/                 # component nhỏ, tái sử dụng nhiều nơi
│     ├─ WaveDivider.tsx
│     └─ PlayingBars.tsx
│
├─ lib/
│  ├─ api/
│  │  └─ dashboard.ts     # gọi GET /dashboard, có fallback an toàn nếu lỗi
│  └─ utils/
│     └─ format.ts         # formatCompactNumber() dùng chung, tránh lặp code
│
└─ types/
   └─ dashboard.ts         # Song, Topic, Singer — khớp đúng response Express thật
```

**Quy ước import**: luôn dùng absolute path `@/...` (map tới `src/`), không dùng
`./Component` tương đối giữa các thư mục khác nhau — tránh lỗi khi di chuyển file.

## Cài đặt

```bash
npm install
cp .env.example .env.local   # sửa API_BASE_URL trỏ tới Express backend
npm run dev
```

## Backend cần có

Route `GET /dashboard` (đã viết sẵn ở project `backend-dashboard`, layered
controller → service → repository), trả về:

```json
{
  "code": 200,
  "message": "Thành công",
  "data": {
    "featured": [ { "title", "slug", "avatar", "description" } ],
    "topTracks": [ { "title", "slug", "avatar", "like", "listen", "singer", "topic" } ],
    "newReleases": [ ... ]
  }
}
```
