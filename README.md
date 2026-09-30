# Chia đội đế chế VDQG

Ứng dụng React + Vite để nhập người chơi từ Excel hoặc trực tiếp trên app, chọn người tham gia hôm nay và bốc thăm hai đội theo nhóm xếp hạng.

## Chạy ứng dụng

Trong thư mục App_Test, sử dụng Node.js đáp ứng yêu cầu của Vite 8 (20.19+ hoặc 22.12+):

```sh
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal, mặc định http://localhost:5173. Nếu cổng bận, Vite tự chọn cổng tiếp theo.

```sh
npm test
npm run lint
npm run build
npm run preview
```

## File Excel

- Định dạng `.xlsx`, tối đa 10 MB và 5.000 người chơi.
- Đọc trang tính đầu tiên; dòng đầu tiên phải chứa cột `Người chơi` và `nhóm`. Thứ tự hai cột không quan trọng.
- Nhóm có thể là số hoặc tên. Không suy diễn thứ hạng từ tên nhóm.
- Bỏ qua dòng trống; báo lỗi nếu thiếu dữ liệu hoặc trùng tên, kể cả khác chữ hoa/thường.
- Hai người cùng tên cần thêm dấu hiệu phân biệt trong cột Người chơi.
- File `.xls` cần được lưu lại thành `.xlsx` bằng Excel trước khi nhập.
- Nút **File mẫu** tải một bảng có sẵn hai cột và tám người chơi ví dụ.

## Sử dụng và quy tắc

1. Nhập Excel bằng nút nhập file hoặc kéo thả file vào vùng nhập; hoặc điền **Người chơi** và **Nhóm** trong mục **Nhập trực tiếp**, rồi nhấn dấu cộng (hoặc Enter) để thêm từng người.
2. Tích chọn người tham gia. Sau khi nhập, không ai được chọn sẵn.
3. Với mỗi người tham gia, có thể chọn **Đội Đỏ**, **Đội Xanh** hoặc giữ **Ngẫu nhiên**.
4. Chọn ít nhất hai người rồi nhấn **Bốc thăm chia đội**. Người đã xếp trước giữ nguyên đội; chỉ những người còn lại được bốc thăm.
5. Có thể bốc thăm lại hoặc tải kết quả bằng nút xuất Excel. Bốc thăm lại không thay đổi các lựa chọn xếp trước.

Thuật toán ưu tiên giữ nguyên người đã xếp trước, sau đó giảm tối đa chênh lệch trong từng nhóm, rồi giảm chênh lệch tổng quân số trong các phương án đó. Người chưa xếp đội và thứ tự nhóm được xáo trộn ngẫu nhiên bằng Lodash shuffle. Khi không có lựa chọn xếp trước, chênh lệch của từng nhóm và tổng quân số hai đội luôn không quá một người.

Nếu các lựa chọn xếp trước không cho phép cân bằng, app vẫn giữ đúng các lựa chọn và hiển thị cảnh báo trong kết quả. Ví dụ: một nhóm có bốn người, trong đó ba người được xếp trước vào Đội Đỏ, thì người còn lại vào Đội Xanh, kết quả nhóm là 3:1. Nếu tất cả người tham gia được xếp trước vào cùng một đội, đội còn lại sẽ trống. Đổi lựa chọn về **Ngẫu nhiên** để bỏ cố định đội. Biểu tượng khóa trong kết quả đánh dấu người được xếp trước.

Bộ lọc không thay đổi người đã chọn hoặc đội đã gán. Nút chọn tất cả chỉ tác động các hàng đang hiển thị. Thay đổi người tham gia hoặc đội được gán sẽ xóa kết quả cũ. Bỏ chọn một người sẽ xóa lựa chọn đội của người đó. Nhập file mới thành công sẽ xóa toàn bộ lựa chọn và kết quả. Nhập file lỗi không làm mất danh sách hiện tại.

## Nhập trực tiếp

- Có thể tạo danh sách không cần Excel hoặc bổ sung người vào danh sách đã nhập từ Excel.
- Tên và nhóm bắt buộc, giới hạn tương ứng 100 và 60 ký tự; tổng danh sách tối đa 5.000 người.
- Kiểm tra tên trùng và chuẩn hóa nhóm dùng cùng quy tắc với nhập Excel, bao gồm không phân biệt chữ hoa/thường và gộp khoảng trắng thừa.
- Ô nhóm gợi ý các nhóm đã có và vẫn cho nhập nhóm mới. Sau khi thêm, giữ lại nhóm để nhập tiếp người cùng nhóm.
- Người mới chưa được tích tham gia. Những lựa chọn tham gia và đội đã gán cho người cũ được giữ nguyên.
- Nút thùng rác xóa người khỏi danh sách, đồng thời xóa lựa chọn tham gia và đội được gán của người đó. Có thể thêm lại với dữ liệu đúng nếu nhập nhầm.
- Thêm hoặc xóa người làm mất kết quả bốc thăm cũ. Nhập một file Excel mới thành công sẽ thay thế toàn bộ danh sách, kể cả người đã nhập trực tiếp.
- Chưa chạy kiểm thử thực thi hoặc kiểm thử trình duyệt cho luồng nhập trực tiếp; chỉ kiểm tra chẩn đoán của VS Code theo yêu cầu không chạy thử app.

## Dữ liệu và giới hạn

Không cần backend. File Excel được xử lý cục bộ trong trình duyệt và không được tải lên máy chủ. Danh sách và kết quả chỉ tồn tại trong bộ nhớ của phiên hiện tại; tải lại trang sẽ xóa chúng.

Font được tải từ Google Fonts; ảnh banner Age of Empires được tải từ Steam CDN. Chức năng chia đội không phụ thuộc vào việc các tài nguyên này tải thành công. Ảnh thuộc chủ sở hữu tương ứng; cần kiểm tra quyền sử dụng hoặc thay bằng tài nguyên được cấp phép khi phát hành công khai.

ExcelJS 4.4.0 hiện kéo theo `uuid` có cảnh báo npm audit mức moderate (GHSA-w5hq-g745-h8pq, kiểm tra buffer ở v3/v5/v6). Ứng dụng không trực tiếp gọi các API đó. Cần đánh giá hoặc cập nhật dependency trước khi triển khai công khai; chưa áp dụng thay đổi phiên bản cưỡng bức.

## Trạng thái kiểm tra

- Ba kiểm thử thuật toán chia đội phiên bản ban đầu đã chạy thành công, bao gồm 700 lượt kiểm tra cân bằng trên các cấu hình nhóm.
- Đã bổ sung kiểm thử xếp trước với 729 cấu hình, giữ nguyên đội khi bốc lại và bỏ qua người không tham gia. Chưa chạy lại bộ kiểm thử sau thay đổi này do lệnh bị bỏ qua.
- Đã bổ sung kiểm thử đọc Excel và dữ liệu lỗi; bộ kiểm thử mở rộng chưa được chạy trong phiên tạo app.
- VS Code không báo lỗi trên các file chức năng đã sửa.
- Build và máy chủ phát triển chưa được chạy do các lệnh tương ứng bị bỏ qua. Chưa kiểm thử trình duyệt desktop/mobile.
