public class FakeLlm : ILLM
{
    public async Task<string> RunAsync(string text)
    {
        await Task.Delay(1000);

        return @"1: Vào tháng 2 năm 2012, vận động viên trượt tuyết chuyên nghiệp Elyse Saugstad đang lướt qua những sườn dốc
2: của dãy núi Cascade
3: thì một vết nứt hình thành trong lớp tuyết phía trên cô.
4: Trước khi cô hoàn toàn bị nhấn chìm bởi một bức tường tuyết nặng 5.000 tấn,
5: Elyse nghe thấy tiếng “TUYẾT LỞ!” vừa kịp lúc để phản ứng bằng một động tác cứu mạng.
6: Vậy, làm thế nào cô ấy có thể sống sót sau dòng tuyết nghiền nát này?
7: Tuyết lở là sự trượt xuống nhanh chóng của tuyết, băng, đá hoặc sự kết hợp của những thứ này
8: xuống một sườn dốc.
9: Chúng có thể là những thảm họa thiên nhiên tàn phá và những bi kịch cá nhân:
10: chỉ riêng tại Hoa Kỳ, tuyết lở giết chết trung bình 27 người mỗi năm.
11: Những cơn ác mộng trên núi cao này không tự nhiên xuất hiện từ hư không;
12: chúng cần ba điều kiện cụ thể.
13: Đầu tiên, ngọn núi cần có độ dốc phù hợp,
14: thường nằm trong khoảng từ 30 đến 45 độ.
15: Độ dốc này đủ thoải để tuyết tích tụ trên sườn,
16: nhưng cũng đủ dốc để tạo ra năng lượng tiềm năng cần thiết cho chuyển động.
17: Thứ hai, chúng thường cần một lớp tuyết chắc chắn
18: được phủ lên trên một lớp yếu hoặc không ổn định,
19: hay đôi khi được gọi là “cái có trên cái không có”.
20: Hãy xem vụ tuyết lở ở dãy núi Cascade,
21: nơi những cơn bão lớn gần đây đã tạo ra một lớp tuyết mới dày gần 1 mét.
22: Bên dưới lớp này là một lớp sương muối bề mặt mỏng.
23: Đây là những tinh thể băng mỏng manh, giống như lông vũ,
24: hình thành khi hơi nước trong không khí đóng băng nhanh chóng trên bề mặt tuyết,
25: gần giống như sương đọng vào mùa đông.
26: Cuối cùng, tuyết lở cần một tác nhân kích hoạt,
27: thứ gì đó làm sụp lớp yếu và khiến tuyết bắt đầu chuyển động.
28: Tác nhân kích hoạt có thể là tự nhiên, chẳng hạn như tuyết rơi dày, gió mạnh, mưa,
29: hoặc thậm chí là những trận tuyết lở khác.
30: Hoặc chúng có thể do con người gây ra, như tác động của người trượt tuyết hoặc xe trượt tuyết.
31: Vì các vết nứt có thể lan truyền nhanh chóng qua lớp tuyết,
32: tác nhân kích hoạt có thể bắt nguồn cách đó hàng trăm mét—
33: ở phía trên, phía dưới, hoặc thậm chí ngay bên cạnh đường đi của trận tuyết lở.
34: Khi đã bắt đầu chuyển động, tốc độ của tuyết lở phụ thuộc vào độ dốc của sườn núi,
35: mức độ phơi bày hoặc lớp thực vật che phủ, độ gồ ghề của địa hình,
36: và loại cũng như lượng tuyết tham gia.
37: Ví dụ, tuyết khô, nhẹ và liên kết lỏng lẻo thường di chuyển nhanh,
38: tạo thành một đám mây bột tuyết khi trượt đi.
39: Ngược lại, tuyết lở do tuyết ướt,
40: gây ra bởi nước di chuyển qua lớp tuyết,
41: di chuyển chậm hơn nhưng đặc hơn nhiều và có thể đặc biệt nguy hiểm.
42: Những trận tuyết lở lớn có thể di chuyển với tốc độ hơn 160 km/h,
43: làm gãy cây, phá hủy các tòa nhà và vùi lấp đường sá.
44: Năm 1970, một trận tuyết lở khổng lồ đặc biệt
45: bao gồm từ 50 đến 100 triệu mét khối
46: băng hà, tuyết, bùn và đá
47: đã đạt tốc độ hơn 300 km/h.
48: Trận tuyết lở này được xem là chết chóc nhất trong lịch sử,
49: nhấn chìm toàn bộ một thị trấn ở Peru và khiến 18.000 người thiệt mạng.
50: Tuyết lở không phải lúc nào cũng lớn như vậy,
51: nhưng ngay cả những trận nhỏ hơn cũng có thể nguy hiểm với bất kỳ ai bị cuốn vào đường đi của chúng.
52: Khi tuyết lao xuống dốc, nó có thể hoạt động vừa như chất rắn vừa như chất lỏng,
53: khiến chuyển động của nó rất khó dự đoán.
54: Ở phần đầu di chuyển nhanh nhất,
55: lớp tuyết trên bề mặt di chuyển nhanh hơn lớp tuyết bên dưới,
56: kéo nạn nhân sâu vào trong lớp tuyết và phân tán họ trên một khu vực rộng,
57: khiến việc cứu hộ trở nên khó khăn.
58: Khi tuyết lở chậm lại, tuyết mất đặc tính giống chất lỏng và bị nén chặt,
59: khiến nạn nhân bị bất động và không thể tự thoát ra.
60: Vì những lý do này, cách tốt nhất để sống sót sau một trận tuyết lở
61: là tránh nó ngay từ đầu.
62: May mắn thay, tại hầu hết các khu trượt tuyết, công viên và thậm chí cả đường cao tốc,
63: các nhân viên ứng phó tuyết lở giảm thiểu rủi ro bằng cách liên tục theo dõi thời tiết,
64: độ ổn định của lớp tuyết và hoạt động của con người.
65: Nếu phát hiện mối đe dọa,
66: họ sẽ đóng cửa khu vực
67: và thậm chí có thể chủ động kích hoạt một trận tuyết lở có kiểm soát
68: bằng thuốc nổ hoặc pháo binh.
69: Tuy nhiên, có những khu vực mà nguy cơ tuyết lở không được giảm thiểu chủ động,
70: được gọi là vùng hoang dã.
71: Ở đây, bạn phải tự chịu trách nhiệm quản lý rủi ro của mình.
72: Các trung tâm tuyết lở địa phương cung cấp dự báo tuyết lở,
73: và bất kỳ ai đi vào vùng hoang dã cũng nên hiểu rõ chúng,
74: được đào tạo đầy đủ và mang theo thiết bị cứu hộ cần thiết.
75: Và cuối cùng, trong địa hình có nguy cơ cao,
76: không có cách nào loại bỏ hoàn toàn rủi ro.
77: Nhóm người ở dãy núi Cascade bao gồm những vận động viên trượt tuyết giàu kinh nghiệm.
78: Tuy nhiên, khu vực này rất dễ bị ảnh hưởng, và sau một trận bão lớn,
79: mức cảnh báo nguy hiểm tuyết lở đã được nâng cao.
80: Cuối cùng, ba người trượt tuyết đã thiệt mạng.
81: Nhưng Elyse thì không, vì cô ấy đã kịp kích hoạt một chiếc túi khí phao cứu hộ.
82: Những thiết bị này không hoàn hảo và là tuyến phòng thủ cuối cùng,
83: nhưng chúng có thể giúp nạn nhân ở gần bề mặt hơn,
84: tăng cơ hội được cứu sống nếu thảm họa xảy ra.
";
    }
}

