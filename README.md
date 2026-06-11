# Hệ thống Quản lý Giáo trình & Âm thanh Tự động - Yapsu Curriculum Management Pipeline

Tài liệu này hướng dẫn chi tiết các tính năng, luồng nghiệp vụ (Flow), dữ liệu đầu vào (Input), dữ liệu đầu ra (Output) và mô hình cơ sở dữ liệu (Data Model) của hệ thống **Yapsu Pipeline** (giao diện thử nghiệm tương tác xây dựng trên Next.js, React, Tailwind CSS và Supabase).

Hệ thống được thiết kế theo cấu trúc **3 Layer Core** kết hợp lớp phủ dịch thuật **Localization Overlay**, thay thế quy trình làm việc thủ công trên Excel cũ bằng một Pipeline tự động hóa tích hợp Gemini AI và quản lý dữ liệu đồng bộ.

---

## Danh sách Tính năng & Phân tích Nghiệp vụ

### 1. Quản lý Nội dung gốc (Excel Sheet View - UC01)
Tái hiện trực quan giao diện bảng tính (Spreadsheet Grid Editor) của tệp giáo trình mẫu `[Original] Yapsu AI Curriculum.xlsx` để Operator thao tác chỉnh sửa dữ liệu giáo trình trực tiếp.

*   **Input (Dữ liệu đầu vào)**:
    *   Lựa chọn cặp ngôn ngữ đích (ví dụ: `Chinese ➜ Vietnamese`) và Bài học cần cấu hình (`CN_L101`).
    *   Các dòng dữ liệu dạng:
        *   *Tutor Card (Mã A)*: Lời thoại giảng bài của giáo viên ảo (`CN` là `\`, `EN` chứa kịch bản lời thoại tiếng Anh).
        *   *Vocab Card (Mã V)*: Từ vựng mới (`CN` định dạng `[Chữ gốc] | [Phiên âm]`, `EN` là nghĩa tiếng Anh).
        *   *Sentence Card (Mã S)*: Mẫu câu gốc (`CN` định dạng `[Câu gốc] | [Phiên âm]`, `EN` là nghĩa tiếng Anh).
        *   *Grammar Card (Mã G)*: Cấu trúc ngữ pháp bổ trợ.
*   **Flow (Luồng xử lý)**:
    1.  Operator chọn cặp ngôn ngữ và Bài học từ Sidebar.
    2.  Hệ thống tải danh sách dòng dữ liệu Excel gốc tương ứng.
    3.  Operator chỉnh sửa trực tiếp nội dung các ô (CN, EN) hoặc bấm nút thêm mới dòng dữ liệu (+ Tutor, + Vocab, + Sentence, + Grammar).
    4.  Khi chỉnh sửa cột `CN` dạng `你好 | nǐ hǎo`, hệ thống sẽ tự động phân tách nội dung chữ viết gốc (`你好`) và phiên âm (`nǐ hǎo`) để lưu trữ độc lập.
    5.  Hệ thống tự động đồng bộ hóa dữ liệu này xuống các tab **Tutor Audio QA** và **Drill Config** thông qua liên kết mã định danh (Natural Code).
*   **Output (Dữ liệu đầu ra)**:
    *   Bộ khung bài học hoàn chỉnh bao gồm danh sách từ vựng, mẫu câu gốc được chuẩn hóa cấu trúc và gán mã định danh duy nhất (ví dụ: `CN_L101_V6`).
*   **Data Model (Liên kết DB)**:
    *   Bảng [lessons](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L34-L54): Lưu trữ metadata bài học.
    *   Bảng [vocab_items](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L56-L77) & [sentence_items](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L79-L97): Lưu trữ từ vựng và câu mẫu gốc đã tách chữ viết và phiên âm.
    *   Bảng [grammar_items](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L99-L108): Lưu trữ ngữ pháp.

---

### 2. Pipeline Tạo & QA Audio Bài học (Tutor & Audio QA - UC02)
Trình quản lý quy trình chuyển đổi văn bản kịch bản bài học (Tutor Script) thành file âm thanh giọng đọc bản xứ thông qua tích hợp Gemini TTS API và thực hiện kiểm tra chất lượng (QA).

*   **Input (Dữ liệu đầu vào)**:
    *   Kịch bản gốc (`CN` hoặc `EN` của Segment giáo trình).
    *   Văn bản dịch nghĩa địa phương (tiếng Việt) do Operator nhập vào ô dịch thuật overlay.
    *   Cấu hình giọng đọc (TTS Provider).
*   **Flow (Luồng xử lý)**:
    1.  Hệ thống tải danh sách các phân đoạn (Segments) trong bài học.
    2.  Operator nhập bản dịch nghĩa tiếng Việt hiển thị overlay cho học viên.
    3.  Click biểu tượng **Generate/Regenerate** để gửi văn bản đến Pipeline Gemini TTS.
    4.  Văn bản được chuyển đổi thành file âm thanh `.m4a` và trả về URL lưu trữ.
    5.  Hệ thống hiển thị **Mini Audio Player** cho phép nghe thử tệp âm thanh trực tiếp.
    6.  Operator thực hiện QA đối soát:
        *   Nếu nghe đúng ➜ Chọn **[Pass]** (Trạng thái chuyển sang màu xanh lá).
        *   Nếu audio lỗi/mất chữ ➜ Chọn **[Fail]** (Cột source text sẽ tự động mở khóa cho phép sửa nhanh kịch bản trực tiếp trên giao diện và bấm nút Regenerate để gọi lại API).
*   **Output (Dữ liệu đầu ra)**:
    *   Bản ghi âm thanh chuẩn `.m4a` và bản dịch nghĩa tiếng Việt được duyệt để đẩy lên ứng dụng di động cho học viên.
*   **Data Model (Liên kết DB)**:
    *   Bảng [guided_segments](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L137-L157): Cột `audio_url` (lưu liên kết m4a), `tts_status` ('success', 'failed', 'generating'), `tts_provider`, và `tts_message` (ghi nhận lỗi API).
    *   Bảng [localized_guided_segment_overlays](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L291-L304): Lưu trữ bản dịch overlay (`tutor_text`, `card_meaning`).

---

### 3. Cấu hình Bài tập Tương tác (Drill Config - UC03)
Trình thiết lập các hoạt động rèn luyện tương tác dựa trên kho dữ liệu từ vựng và câu mẫu của bài học, đảm bảo không bị vượt cấp độ (Out of Bounds).

*   **Input (Dữ liệu đầu vào)**:
    *   Lựa chọn thẻ từ vựng hoặc câu mẫu cần dùng làm học liệu từ cột bên trái (được đồng bộ trực tiếp từ Tab 1).
    *   Loại hình bài tập (`drillType`): `Listen & Repeat` (Luyện nghe nói), `Fill in the Blank` (Điền vào chỗ trống), `Sentence Order` (Sắp xếp câu).
    *   Tham số đục lỗ (chỉ hiển thị khi chọn *Fill in the Blank*): `Prompt Before` (văn bản đứng trước), `Blank Answer` (văn bản đáp án cần điền), `Prompt After` (văn bản đứng sau).
*   **Flow (Luồng xử lý)**:
    1.  Operator lọc danh sách học liệu của bài học ở cột trái.
    2.  Bấm biểu tượng **(+)** để import thẻ vào luồng bài tập.
    3.  Lựa chọn kiểu bài tập tương ứng thông qua dropdown.
    4.  Nhập cấu hình bài tập (ví dụ với điền từ: tách câu *"我是学生"* thành trước: *"我"*, ô trống: *"是"*, sau: *"学生"*).
    5.  Nhập nghĩa tiếng Việt gợi ý và kiểm tra độ chính xác của đáp án.
*   **Output (Dữ liệu đầu ra)**:
    *   Tệp cấu hình bài tập Drill dưới dạng JSON để Mobile App kết xuất thành giao diện câu hỏi tương tác.
*   **Data Model (Liên kết DB)**:
    *   Bảng [drill_items](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L210-L235): Chứa `drill_type`, `script_text`, `meaning`, `source_codes`.
    *   Bảng [fill_blank_configs](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L237-L246): Chứa `prompt_before`, `prompt_after`, `answer`.

---

### 4. Thiết lập Roleplay (Roleplay Setup - UC04)
Cấu hình ngữ cảnh và các tiêu chí đánh giá cho mô-đun hội thoại tình huống với AI Agent ở cuối bài học.

*   **Input (Dữ liệu đầu vào)**:
    *   Bối cảnh ngữ cảnh bằng tiếng Anh (`Setup Context`): Mô tả tình huống, vai trò của người học và AI.
    *   Ghi chú ý đồ bài học (`Notes`).
    *   Danh sách nhiệm vụ cần đạt (`Success Criteria` / `Goals`): Các cột tiêu chí tiếng Anh và bản dịch tiếng Việt tương ứng.
*   **Flow (Luồng xử lý)**:
    1.  Operator nhập văn bản mô tả bối cảnh tình huống vào khung Textarea.
    2.  Hệ thống kiểm tra độ dài ký tự: Nếu vượt quá 1000 ký tự (giới hạn token an toàn của mô hình ngôn ngữ lớn LLM trên app di động), hệ thống sẽ nháy đỏ viền Textarea và đưa ra cảnh báo lỗi (Warning).
    3.  Operator bấm nút **Add Goal** để thêm mục tiêu hội thoại cần chấm điểm.
    4.  Nhập tiêu chí thành công (Success Criteria) bằng tiếng Anh và tiếng Việt để hiển thị hướng dẫn cho học viên.
*   **Output (Dữ liệu đầu ra)**:
    *   Metadata bối cảnh và mảng tiêu chí chấm điểm để đẩy vào prompt khởi tạo của AI Agent.
*   **Data Model (Liên kết DB)**:
    *   Bảng [roleplays](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L257-L269): Chứa bối cảnh (`setup`) và ghi chú (`notes`).
    *   Bảng [roleplay_goals](file:///c:/Users/PC/Downloads/Yapsu%20-%20Curriculum%20-%20Management%20-%20Platform/supabase/migrations/20260611000000_init_schema.sql#L271-L282): Chứa danh sách tiêu chí chấm điểm (`success_criteria`, `description_native`, `order_index`).

---

## Cách Khởi Chạy Dự Án Thử Nghiệm (Local Development)

Dự án Next.js đã được cấu hình hoàn chỉnh sẵn sàng cho việc phát triển tiếp:

1.  Cài đặt các gói phụ thuộc:
    ```bash
    npm install
    ```
2.  Chạy máy chủ phát triển cục bộ:
    ```bash
    npm run dev
    ```
3.  Mở trình duyệt truy cập:
    👉 **[http://localhost:3000](http://localhost:3000)**
