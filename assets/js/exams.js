let examData;
let GCompletionTime;
const startTime = new Date().toISOString(); // استخدام الوقت الحالي كـ startTime

function getExamId(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function fetchExamData(Id) {
    const examId = Id || null;
    try {


        const response = await fetch('https://examinationsystem-dfaxfka2hqhwgncc.westeurope-01.azurewebsites.net/api/Exam/' + examId);
        if (!response.ok) {
            throw new Error('حدث خطأ أثناء جلب البيانات');
            document.getElementById('reportButton').style.left = '0px';


        }

        examData = await response.json();
        //console.log("Exam Data:", examData); // For debugging
        displayExamData(examData);
        document.getElementById('reportButton').style.display = 'inline-block';
    } catch (error) {
        document.getElementById('reportButton').style.display = 'inline-block';
        document.getElementById('exam-content').innerText = error.message;
    }
}

function submitExam() {

    var btn = document.querySelector('.btn-submit');
    var spinnert = btn.querySelector('.spinner-border');
    btn.disabled = true;
    spinnert.classList.remove('d-none');


    const questions = document.querySelectorAll('.question');
    const elements = [...questions].map((q, i) => {
        var getInput = q.querySelectorAll('input')[0];
        var n = getInput.name;
        if (!q.querySelector('input[name=' + n + ']:checked')) {
            return 'يجب الإجابة على السؤال ' + (i + 1) + '<br>';
            error = true;
        }
        return null;
    });
    if (elements.join('') != null && elements.join('') != "") {
        document.querySelector('.alerts').innerHTML = elements.join('');
        btn.disabled = false;
        spinnert.classList.add('d-none');
    }
    else {
        document.querySelector('.alerts').innerHTML = "";

        const selectedAnswers = examData.questionsList.map(question => {
            const selectedOption = document.querySelector(`input[name="question_${question.questionID}"]:checked`);
            return {
                questionID: question.questionID,
                studentAnswerID: selectedOption ? parseInt(selectedOption.value) : 0
            };
        });

        const now = new Date();
        const completionTime = now.toISOString(); // استخدام الوقت الحالي كـ completionTime
        GCompletionTime = completionTime;
        const submissionData = {
            examID: examData.examID,
            courseID: examData.courseID,
            examType: examData.examType,
            createdByUserID: examData.createdByUserID,
            questionsList: selectedAnswers,
            startTime: startTime,
            completionTime: completionTime
        };



        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.setAttribute('readonly', true); // جعل الزر غير قابل للتعديل
            radio.setAttribute('onclick', 'return false;'); // منع التفاعل مع الزر
        });



        fetch('https://examinationsystem-dfaxfka2hqhwgncc.westeurope-01.azurewebsites.net/api/Exam/SubmitAndGetResult', {
            // fetch('https://localhost:7023/api/Exam/SubmitAndGetResult', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        })
            .then(response => response.json())
            .then(result => {
                console.log(result)
                displayResult(result);
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
                btn.disabled = true;
                spinnert.classList.add('d-none');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('حدث خطأ أثناء إرسال الإجابات.');
                btn.disabled = false;
                spinnert.classList.add('d-none');
            });


    }

}

function displayExamData(exam) {
    const examContent = document.getElementById('exam-content');
    examContent.innerHTML = ''; // Clear previous content

    if (!exam || !exam.questionsList || exam.questionsList.length === 0) {
        examContent.innerHTML = '<p>لا توجد أسئلة لعرضها.</p>';
        return;
    }

    // عرض نوع الامتحان
    const examType = document.createElement('p');
    examType.classList = "description";
    examType.innerHTML = `نوع الامتحان : ${exam.examType}<br>المعرّف : ${exam.examID}`;
    examContent.appendChild(examType);

    // عرض قائمة الأسئلة
    exam.questionsList.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';

        // عرض نص السؤال
        const questionText = document.createElement('h5');
        // questionText.textContent = `سؤال ${index + 1}: ${question.questionText}`;
        questionText.textContent = `${index + 1}: ${question.questionText}`;

        questionDiv.appendChild(questionText);

        // عرض خيارات الإجابة
        const optionsList = document.createElement('ul');
        optionsList.className = 'options';
        question.optionsDTO.forEach(option => {
            const optionItem = document.createElement('li');
            optionItem.className = 'option';

            // إضافة اختيار الإجابة باستخدام radio button
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `question_${question.questionID}`;
            optionInput.value = option.optionID;
            optionInput.id = `option_${option.optionID}`;

            const optionLabel = document.createElement('label');
            optionLabel.setAttribute('for', `option_${option.optionID}`);
            optionLabel.textContent = option.optionText;

            optionItem.appendChild(optionInput);
            optionItem.appendChild(optionLabel);
            optionsList.appendChild(optionItem);
        });

        questionDiv.appendChild(optionsList);
        examContent.appendChild(questionDiv);
        document.querySelector('.btn-submit').classList.remove('d-none');
        const separator = document.createElement('hr');
        examContent.appendChild(separator);
    });
    // وضع خط بين كل سؤال وسؤال
}

function displayResult(result) {
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');

    const scorePercentage = result.data.result.scorePersantage;
    const correctAnswers = result.data.studentAnswersDTO.filter(answer => answer.isCorrect).length;
    const incorrectAnswers = result.data.studentAnswersDTO.filter(answer => !answer.isCorrect).length;

    const startTimee = new Date(startTime);
    const completionTime = new Date(GCompletionTime);
    const differenceInMilliseconds = completionTime.getTime() - startTimee.getTime();

    // تحويل الفرق من ميلي ثانية إلى ثواني
    const differenceInSeconds = Math.round(differenceInMilliseconds / 1000);

    // حساب الساعات والدقائق والثواني
    const hours = Math.floor(differenceInSeconds / 3600); // 3600 ثانية في الساعة
    const minutes = Math.floor((differenceInSeconds % 3600) / 60); // 60 ثانية في الدقيقة
    const seconds = differenceInSeconds % 60;

    // تنسيق الوقت إلى "ساعات:دقائق:ثواني" مع إضافة الأصفار البادئة إذا لزم الأمر
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // تحويل النسبة المئوية من سلسلة نصية إلى عدد

    // تحديد لون النتيجة بناءً على النسبة المحولة
    let scoreColor = scorePercentage < 50 ? 'red' : 'green';

    resultContent.innerHTML = `
<h4 id="resultTitle">النتيجة:</h4>
<p>النسبة المئوية: <span style="color: ${scoreColor}; font-size: 1.5em;">${scorePercentage}%</span></p>
<p>عدد الإجابات الصحيحة: <span style="color: green;">${correctAnswers}</span></p>
<p>عدد الإجابات الخاطئة: <span style="color: red;">${incorrectAnswers}</span></p>
<p>الوقت المنقضي: ${formattedTime}</p>
<style>
@keyframes flash {
0% { opacity: 1; }
50% { opacity: 0; }
100% { opacity: 1; }
}
.flash {
animation: flash 0.4s infinite;
}
</style>
`;
    const resultTitle = document.getElementById('resultTitle');

    // تطبيق تأثير الوميض
    resultTitle.classList.add('flash');

    // إزالة تأثير الوميض بعد 4 ثوانٍ
    setTimeout(() => {
        resultTitle.classList.remove('flash');
    }, 4000);

    // عرض تفاصيل إجابات الطالب
    result.data.studentAnswersDTO.forEach((answer, index) => {
        const questionDiv = document.querySelector(`input[name="question_${answer.questionID}"]`).closest('.question');
        const optionsList = questionDiv.querySelectorAll('.option');

        optionsList.forEach(optionItem => {
            const inputElement = optionItem.querySelector('input');
            const labelElement = optionItem.querySelector('label');

            if (parseInt(inputElement.value) === answer.selectedOptionID) {
                labelElement.style.color = answer.isCorrect ? 'green' : 'red';
            }

            if (parseInt(inputElement.value) === answer.correctAnswerID) {
                labelElement.style.color = 'green';
            }
        });

        const answerDiv = document.createElement('div');
        resultContent.appendChild(answerDiv);
    });

    resultContainer.style.display = 'block';

    // زر إعادة الامتحان
    setTimeout(() => {
        // إنشاء الزر
        const retryButton = document.createElement('button');

        // تعيين الخصائص للزر
        retryButton.className = 'btn btn-primary';
        retryButton.textContent = 'إعادة الامتحان';

        // تعيين دالة onclick للزر
        retryButton.onclick = () => {
            // إعادة تحميل الصفحة
            location.reload();
        };

        // إضافة الزر إلى resultContainer
        resultContainer.appendChild(retryButton);
    }, 2000);
}

function displayResult1(result) {
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const Score = result.data.result.scorePersantage;
    //alert('نتيجتك: ' + Score);
    resultContent.innerHTML = `
<p>المجموع الكلي: ${Score}</p>
`;
    // <p>الوقت المستغرق: ${result.data.timeSpent} دقيقة</p>`;
    // التمرير إلى أسفل الصفحة
    // عرض تفاصيل إجابات الطالب
    result.data.studentAnswersDTO.forEach((answer, index) => {
        const questionDiv = document.querySelector(`input[name="question_${answer.questionID}"]`).closest('.question');
        const optionsList = questionDiv.querySelectorAll('.option');

        optionsList.forEach(optionItem => {
            const inputElement = optionItem.querySelector('input');
            const labelElement = optionItem.querySelector('label');

            if (parseInt(inputElement.value) === answer.selectedOptionID) {
                labelElement.style.color = answer.isCorrect ? 'green' : 'red';
            }

            if (parseInt(inputElement.value) === answer.correctAnswerID) {
                labelElement.style.color = 'green';
            }
        });

        const answerDiv = document.createElement('div');


        resultContent.appendChild(answerDiv);
    });

    resultContainer.style.display = 'block';
}









//Cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}


//themes
function applyTheme() {
    var theme = getCookie('theme');
    if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('theme-switch').checked = theme == 'dark' ? true : false;
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    setCookie('theme', newTheme, 30);
    document.documentElement.setAttribute('data-theme', newTheme);
}

document.addEventListener('DOMContentLoaded', applyTheme);
document.getElementById('theme-switch').addEventListener('change', toggleTheme);


var reportBtns = document.querySelectorAll('.report-btn');
reportBtns.forEach(r => {
    r.addEventListener('click', function () {
        const form = document.getElementById('reportForm');
        form.style.left = form.style.left === '5px' ? '-360px' : '5px';
    });
});

document.getElementById('submitReportButton').addEventListener('click', function (event) {
    event.preventDefault();
    var msg = document.getElementById('messages');
    msg.innerHTML = 'جارِ الإرسال';
    msg.style.color = '#000';

    document.getElementById('submitReportButton').disabled = true;
    const reportType = document.getElementById('reportType');
    const userName = document.getElementById('userName');
    const CanPublish = document.getElementById('CanPublish');
    const reportMessage = document.getElementById('reportMessage');
    if (!reportMessage.value.trim()) {
        msg.innerHTML = 'الرجاء كتابة نص الرسالة';
        msg.style.color = 'red';
        document.getElementById('submitReportButton').disabled = false;
        return;
    }
    const finalReportMessage = `${reportMessage.value}\n\n-- الاسم: ${userName.value}\n\n-- مسموح النشر : ${CanPublish.value}`;

    fetch('https://examinationsystem-dfaxfka2hqhwgncc.westeurope-01.azurewebsites.net/api/Report/add', {
        method: 'POST',
        headers: {
            'Accept': 'text/plain',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: 18,
            reportType: reportType.value,
            reportText: finalReportMessage,
            examID: 0,
            questionID: 0,
            optionID: 0
        })
    })
        .then(response => {
            if (response.status === 201 || response.status === 200) {
                reportType.value = 'اقتراح';
                CanPublish.value = 'نعم';
                reportMessage.value = '';
                return response.text();
            } else if (response.status === 400) {
                return response.json().then(error => {
                    throw new Error(`${error.title}: ${error.detail}`);
                });
            } else {
                document.getElementById('submitReportButton').disabled = false;
                throw new Error('خطأ في الخادم');
            }
        })
        .then(data => {
            msg.innerHTML = 'تم إرسال الإبلاغ بنجاح!';
            msg.style.color = 'green';
            setTimeout(() => {
                document.getElementById('submitReportButton').disabled = false;
            }, 2000)
        })
        .catch(error => {
            document.getElementById('submitReportButton').disabled = false;
            msg.innerHTML = 'فشل إرسال الإبلاغ\n' + error;
            msg.style.color = 'red';
        });
});
