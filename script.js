document.addEventListener('DOMContentLoaded', () => { 
    const sbdInput = document.getElementById('sbdInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultContainer = document.getElementById('resultContainer');
    let studentData = [];

    function isValidScore(score) {
        if (!score || score === '') return false;
        if (typeof score === 'string') {
            if (score.toUpperCase().includes('VẮNG') || score.toUpperCase().includes('N/V')) return false;
            const normalized = score.replace(',', '.');
            return !isNaN(parseFloat(normalized));
        }
        return !isNaN(parseFloat(score));
    }

    function parseScore(score) {
        if (!score || score === '') return null;
        if (typeof score === 'string') {
            if (score.toUpperCase().includes('VẮNG') || score.toUpperCase().includes('N/V')) return 'N/V';
            const normalized = score.replace(',', '.');
            const num = parseFloat(normalized);
            return isNaN(num) ? score : num;
        }
        return parseFloat(score);
    }

    function calculateTotalScore(student) {
        let total = 0;
        const subjects = ['TIẾNG VIỆT','TIẾNG ANH','TOÁN HỌC','LOGIC-PTSL','HÓA HỌC','VẬT LÝ','SINH HỌC','ĐỊA LÝ','LỊCH SỬ','KTPL'];
        subjects.forEach(sub => {
            const score = student[sub];
            if (isValidScore(score)) total += parseScore(score);
        });
        return total;
    }

    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const students = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = [];
            let current = '', inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === delimiter && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            if (values.length === headers.length) {
                const student = {};
                headers.forEach((h, idx) => {
                    student[h] = values[idx];
                });

                student['Tổng điểm'] = calculateTotalScore(student);
                students.push(student);
            }
        }
        return students;
    }

    async function loadStudentData() {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSqiGl1wR_ghrX2rvkjXZfv9S_qLAt3iuhlmZSF83mRZrhP51mt8_N2TCK-NtE69XIFffB3yuFbKUrQ/pub?output=csv');
        const text = await response.text();
        studentData = parseCSV(text);
    }

    function findStudentBySBD(sbd) {
        return studentData.find(std => String(std['SBD']).trim() === sbd);
    }

    searchBtn.addEventListener('click', async () => {
        const sbd = sbdInput.value.trim();

        if (!sbd) {
            resultContainer.innerHTML = '<p style="color:red;">Vui lòng nhập số báo danh.</p>';
            return;
        }

        if (studentData.length === 0) await loadStudentData();

        const student = findStudentBySBD(sbd);

        if (!student) {
            resultContainer.innerHTML = `<p style="color:orange;">Không tìm thấy SBD <strong>${sbd}</strong></p>`;
        } else {
            displayStudent(student);
        }
    });

    function displayStudent(data) {
        const infoFields = ['SBD', 'HỌ VÀ TÊN','NGÀY SINH'];

        const scoreFields = [
            {key: 'TIẾNG VIỆT', max: 300},
            {key: 'TIẾNG ANH', max: 300},
            {key: 'TOÁN HỌC', max: 300},
            {key: 'LOGIC-PTSL', max: 120},
            {key: 'HÓA HỌC', max: 30},
            {key: 'VẬT LÝ', max: 30},
            {key: 'SINH HỌC', max: 30},
            {key: 'ĐỊA LÝ', max: 30},
            {key: 'LỊCH SỬ', max:30},
            {key: 'KTPL', max: 30}
        ];

        let html = `<div class="score-report">`;

        html += `<div class="student-info-box">`;
        infoFields.forEach(f => {
            if (data[f]) html += `<p><strong>${f}:</strong> ${data[f]}</p>`;
        });
        html += `</div>`;

        let tong = 0;
        scoreFields.forEach(sf => {
            const diem = parseFloat(data[sf.key]) || 0;
            tong += diem;
            const width = Math.min((diem / sf.max) * 100, 100);

            html += `
            <div class="score-item">
                <span>${sf.key}</span>
                <div class="score-bar">
                    <div class="score-bar-fill" style="width:${width}%">${diem}</div>
                </div>
                <span>${sf.max}</span>
            </div>`;
        });

        html += `<div class="total-score">TỔNG ĐIỂM <br><span>${tong}</span></div></div>`;

        resultContainer.innerHTML = html;
    }

    loadStudentData();
});