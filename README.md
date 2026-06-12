# Yapsu Curriculum Management Platform

Presentation MVP cho quy trình biên soạn, review và chuẩn bị publish curriculum ngôn ngữ của Yapsu. UI hiện tại được xây dựng từ Meeting Feedback, PRD, Use Cases, Revision Plan, ERD đã xác nhận với app mobile và snapshot dữ liệu Notion.

## Trạng thái hiện tại

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS.
- Dữ liệu demo: `src/data/mockNotionData.ts`, được export từ Notion.
- Database source of truth: `ERD Platform.txt`.
- Chế độ chạy: presentation MVP, state lưu trong browser memory.
- Chưa kết nối database/API, authentication, storage, TTS hoặc AI QA thật.

Không còn khái niệm `Language Pair`. Platform quản lý một `LANGUAGE` học và tạo nhiều bản địa hóa theo native language bằng `LOCALIZED_*_OVERLAY`.

## Tài liệu chuẩn

| Tài liệu | Vai trò |
|---|---|
| `ERD Platform.txt` | Cấu trúc entity, field và relationship chuẩn |
| `docs/UI-ERD-DATA-MAPPING.md` | Mapping UI → ERD → database fields |
| `Product Requirements Document.pdf` | Phạm vi và yêu cầu sản phẩm |
| `MeetingfeedbackUI.html` | Feedback review UI/UX |
| `Meeting Feedback ERD.pdf` | Feedback về cấu trúc dữ liệu |
| `MVP-Revision-Plan.html` | Checklist chỉnh sửa MVP |
| `UC01`–`UC04` PDF/XLSX | Input, action, output và acceptance criteria |

Khi tài liệu mâu thuẫn, thứ tự ưu tiên là: ERD → Meeting Feedback → PRD/Use Cases → Revision Plan → snapshot Notion.

## Kiến trúc dữ liệu

```text
LANGUAGE
└── LESSON
    ├── VOCAB_ITEM / SENTENCE_ITEM / GRAMMAR_ITEM / TOPIC_ITEM
    ├── GUIDED_LESSON
    │   └── GUIDED_SEGMENT
    │       ├── GUIDED_SCRIPT ── AUDIO
    │       └── GUIDED_CARD ── source content reference
    ├── DRILL_SET ── DRILL_PART ── DRILL_ITEM
    ├── EXTRA_DRILL_SET ── EXTRA_DRILL_PART ── EXTRA_DRILL_ITEM
    ├── ROLEPLAY ── ROLEPLAY_GOAL
    └── LOCALIZED_*_OVERLAY
```

`AUDIO` tham chiếu source record bằng `sourceDataId` và `sourceDataType`. Main Drill và Extra Drill là hai cấu trúc độc lập. Localization không được ghi trực tiếp đè lên source content.

## Workflow

### UC01 - Curriculum & Language Editor

1. Chọn learning language và lesson.
2. Import CSV/XLSX hoặc thêm Tutor, Vocab, Sentence, Grammar Card.
3. Preview import; validate schema, required fields, system code và duplicate.
4. Edit source content và localization trong spreadsheet view.
5. Reorder bằng drag handle hoặc arrow actions.
6. Chỉ enable record khi required fields đầy đủ.
7. Save Draft hoặc Submit Lesson; submit kiểm tra duplicate, localization coverage, audio và QA.

System code được sinh tự động và readonly. Add Card tự scroll, highlight, focus field đầu tiên và hiển thị toast có row number. Sửa/xóa source đang được Audio, Drill hoặc Roleplay dùng sẽ cảnh báo dependency.

*Note: Đối với tính năng Import Curriculum (ở trang riêng `/import`), bảng mapping giữa code cũ và code mới hiện tại chỉ duy trì cột "New Code" nhưng để trống dữ liệu. Sau này khi có các lesson mới được thêm vào, cột code mới này mới bắt đầu được sử dụng và cấp phát.*

### UC02 - Tutor Audio QA

UC02 dùng chung bảng source với UC01:

1. Upload nhiều file audio, match filename với card code; hoặc generate selected/missing audio.
2. Theo dõi audio source, script version và audio version.
3. Chạy AI QA cho selected/all eligible records.
4. Human QA chỉ được Pass/Fail sau AI QA Pass; Fail yêu cầu reason.
5. Khi script/source thay đổi, audio chuyển `Outdated` và QA bị reset.

Đây là mô phỏng UX. File upload, generation và QA chưa gọi service thật.

### UC03 - Drill Editor

1. Chọn source card từ Layer 2.
2. Gán `Not Added`, `Main Drill` hoặc `Extra Drill`.
3. Source và meaning là readonly, tránh duplicate data.
4. Chọn drill type: Listen & Repeat, Fill Blank hoặc Sentence Ordering.
5. Fill Blank chọn một khoảng ký tự liên tục.
6. Reorder và Save Drill Configuration.

Payload backend tương lai phải ghi vào đúng chuỗi `DRILL_*` hoặc `EXTRA_DRILL_*`; không trộn hai loại.

### UC04 - Roleplay Editor

1. Lesson title được inherit và readonly.
2. Edit Mobile Roleplay Title và user-facing Context Description.
3. Add, edit, enable, reorder hoặc remove goals.
4. Goal active bắt buộc có English description và success criteria.
5. Save Roleplay tạo output theo `ROLEPLAY` và `ROLEPLAY_GOAL`.

Internal/system prompt không được hiển thị như mobile context. Field `notes` chưa có use case rõ nên không xuất hiện trong editor.

## Dữ liệu Notion

`src/data/mockNotionData.ts` cung cấp:

- Source content cho 5 lesson Chinese và 5 lesson Japanese.
- Drill configuration cho các lesson đã export.
- Roleplay data cho các Chinese lesson có dữ liệu trong snapshot.

Lesson chưa có Roleplay trong Notion được hiển thị dưới dạng cấu hình mới, không tạo dữ liệu giả để che coverage gap. ID/code từ snapshot được giữ nguyên để trace về nguồn.

Một số Drill record trong snapshot có `sourceCode: "Unknown"`. Runtime loại các record này khỏi editor vì không thể map an toàn sang Layer 2; platform không đoán source code thay cho dữ liệu nguồn.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://127.0.0.1:3000`.

Nếu localhost đang giữ bundle cũ:

```bash
npm run dev:fresh
```

Script này xóa `.next` trước khi khởi động development server.

Kiểm tra chất lượng:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

`test:e2e` yêu cầu app đang chạy tại `http://127.0.0.1:3000` trong một terminal khác.

## Cấu trúc code chính

```text
src/app/page.tsx
src/components/CurriculumDashboard.tsx
src/data/mockNotionData.ts
docs/UI-ERD-DATA-MAPPING.md
ERD Platform.txt
scripts/clean-next-cache.mjs
```

`CurriculumDashboard.tsx` hiện chứa view model và interaction của cả UC01–UC04 để presentation dễ theo dõi. Khi tích hợp backend nên tách theo feature và thêm repository/adapter layer, nhưng không thay đổi entity boundaries của ERD.

## Đã hoàn thành

- Audit Meeting Feedback, PRD, ERD, Use Cases và Revision Plan.
- Loại bỏ `LanguagePair` khỏi runtime code và tài liệu.
- Mapping chính thức UI → ERD → database fields.
- UC01 import preview, validation, card actions, reorder, status, enable và dependency warning.
- UC02 upload/generate audio, versioning, Outdated state, AI QA và Human QA gate.
- UC03 table editor, Main/Extra assignment, readonly source data và Fill Blank range.
- UC04 mobile-aligned context, goal editor, validation, reorder và save output.
- Dùng snapshot Notion làm dữ liệu trình diễn.

## Chưa hoàn thành ở tầng production

- Backend persistence và transaction.
- Adapter tách localization columns thành `LOCALIZED_*_OVERLAY`.
- Auth/RBAC và audit log.
- Object storage, audio upload thật, TTS provider và AI QA service.
- Publish API đồng bộ sang mobile app.
- Database integration tests.

Các phần trên là công việc tích hợp production, không phải dữ liệu giả lập trong presentation MVP.
