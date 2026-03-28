document.addEventListener('DOMContentLoaded', () => {

    const sbdInput = document.getElementById('sbdInput');
    const cccdInput = document.getElementById('cccdInput');
    const emailInput = document.getElementById('emailInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');

    let studentData = [];

    // ===== Chuẩn hóa dữ liệu =====
    function normalize(str) {
        return String(str || '').trim().toLowerCase();
    }

    // ===== Kiểm tra điểm hợp lệ =====
    function isValidScore(score) {
        if (!score) return false;
        const s = String(score).toUpperCase();
        if (s.includes('VẮNG') || s.includes('N/V')) return false;
        return !isNaN(parseFloat(s.replace(',', '.')));
    }

    function parseScore(score) {
        if (!score) return 0;
        const s = String(score).toUpperCase();
        if (s.includes('VẮNG') || s.includes('N/V')) return 0;
        return parseFloat(s.replace(',', '.')) || 0;
    }

    // ===== Tính tổng điểm =====
    function calculateTotalScore(student) {
        const subjects = [
            'TIẾNG VIỆT', 'TIẾNG ANH', 'TOÁN HỌC',
            'LOGIC-PTSL', 'HÓA HỌC', 'VẬT LÝ',
            'SINH HỌC', 'ĐỊA LÝ', 'LỊCH SỬ', 'KTPL'
        ];

        let total = 0;
        subjects.forEach(sub => {
            if (isValidScore(student[sub])) {
                total += parseScore(student[sub]);
            }
        });

        return total;
    }

    // ===== Parse CSV =====
    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());

        const students = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter);

            if (values.length === headers.length) {
                let student = {};

                headers.forEach((h, idx) => {
                    student[h.trim()] = values[idx]?.trim();
                });

                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            }
        }

        return students;
    }

    // ===== Load dữ liệu từ Google Sheet =====
    async function loadStudentData() {
        try {
            const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSqiGl1wR_ghrX2rvkjXZfv9S_qLAt3iuhlmZSF83mRZrhP51mt8_N2TCK-NtE69XIFffB3yuFbKUrQ/pub?output=csv');
            const text = await response.text();
            studentData = parseCSV(text);

            console.log("DATA:", studentData[0]); // debug
        } catch (error) {
            resultContainer.innerHTML = '<p style="color:red;">Không tải được dữ liệu!</p>';
        }
    }

    // ===== Tìm học sinh (FIX CHÍNH) =====
    function findStudent(sbd, cccd, email) {
        return studentData.find(std =>
            normalize(std['SBD']) === normalize(sbd) &&
            normalize(std['CCCD']) === normalize(cccd) &&
            normalize(std['EMAIL']) === normalize(email)
        );
    }

    // ===== Click tra cứu =====
    searchBtn.addEventListener('click', async () => {

        const sbd = sbdInput.value.trim();
        const cccd = cccdInput.value.trim();
        const email = emailInput.value.trim();

        if (!sbd || !cccd || !email) {
            resultContainer.innerHTML = '<p style="color:red;">Vui lòng nhập đầy đủ thông tin.</p>';
            return;
        }

        if (!/^\d{12}$/.test(cccd)) {
            resultContainer.innerHTML = '<p style="color:red;">CCCD phải đủ 12 số!</p>';
            return;
        }

        // Gửi log (giữ nguyên)
        fetch("https://script.google.com/macros/s/AKfycbztV01MdUklsAJBZyVoJ50NMKEuaGx_qJ_HP34zQZRTg3InRZrE2Heu1G6gzwuSdUt6-Q/exec", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({ sbd, cccd, email })
        });

        if (studentData.length === 0) {
            await loadStudentData();
        }

        const student = findStudent(sbd, cccd, email);

        if (!student) {
            resultContainer.innerHTML = `<p style="color:orange;">Sai thông tin hoặc không tìm thấy dữ liệu!</p>`;
        } else {
            displayStudent(student);
        }
    });

    // ===== Hiển thị kết quả =====
    function displayStudent(data) {

        const infoFields = ['SBD', 'HỌ VÀ TÊN', 'NGÀY SINH'];

        const scoreFields = [
            { key: 'TIẾNG VIỆT', max: 300 },
            { key: 'TIẾNG ANH', max: 300 },
            { key: 'TOÁN HỌC', max: 300 },
            { key: 'LOGIC-PTSL', max: 120 },
            { key: 'HÓA HỌC', max: 30 },
            { key: 'VẬT LÝ', max: 30 },
            { key: 'SINH HỌC', max: 30 },
            { key: 'ĐỊA LÝ', max: 30 },
            { key: 'LỊCH SỬ', max: 30 },
            { key: 'KTPL', max: 30 }
        ];

        let html = `<div class="score-report">`;

        // Thông tin
        html += `<div class="student-info-box">`;
        infoFields.forEach(f => {
            if (data[f]) {
                html += `<p><strong>${f}:</strong> ${data[f]}</p>`;
            }
        });
        html += `</div>`;

        // Điểm
        let tong = 0;

        scoreFields.forEach(sf => {
            const diem = parseScore(data[sf.key]);
            tong += diem;

            const width = Math.min((diem / sf.max) * 100, 100);

            html += `
                <div class="score-item">
                    <span>${sf.key}</span>
                    <div class="score-bar">
                        <div class="score-bar-fill" style="width:${width}%">${diem}</div>
                    </div>
                    <span>${sf.max}</span>
                </div>
            `;
        });

        html += `
            <div class="total-score">
                TỔNG ĐIỂM <br>
                <span>${tong}</span>
            </div>
        </div>
        `;

        resultContainer.innerHTML = html;
    }

    // Load sẵn dữ liệu
    loadStudentData();
});