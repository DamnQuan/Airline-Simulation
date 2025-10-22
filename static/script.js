// 航班运营相关功能
document.addEventListener('DOMContentLoaded', function() {
    const flightForm = document.getElementById('flightForm');
    const questionsModal = document.getElementById('questionsModal');
    const resultModal = document.getElementById('resultModal');
    const questionsContainer = document.getElementById('questionsContainer');
    
    if (flightForm) {
        flightForm.addEventListener('submit', function(e) {
            e.preventDefault();
            startFlight();
        });
    }
    
    function startFlight() {
        // 获取表单数据
        const formData = new FormData(flightForm);
        const flightData = {
            flight_number: formData.get('flight_number'),
            departure: formData.get('departure'),
            arrival: formData.get('arrival'),
            aircraft_id: formData.get('aircraft'),
            ticket_price: formData.get('ticket_price')
        };
        
        // 验证表单
        if (!flightData.aircraft_id) {
            alert('请选择飞机');
            return;
        }
        
        // 显示问题模态框
        questionsModal.classList.add('show');
        loadQuestions();
    }
    
    function loadQuestions() {
        fetch('/get_questions')
            .then(response => response.json())
            .then(questions => {
                questionsContainer.innerHTML = '';
                questions.forEach((question, index) => {
                    const questionDiv = document.createElement('div');
                    questionDiv.className = 'question';
                    questionDiv.innerHTML = `
                        <p><strong>问题 ${index + 1}:</strong> ${question.question}</p>
                        ${question.options.map((option, optIndex) => `
                            <label>
                                <input type="radio" name="question${index}" value="${optIndex + 1}">
                                ${option}
                            </label><br>
                        `).join('')}
                    `;
                    questionsContainer.appendChild(questionDiv);
                });
                // 初始化进度条
                updateAnswerProgress();
            });
    }
    
    // 提交答案
    const submitAnswersBtn = document.getElementById('submitAnswers');
    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', function() {
            const formData = new FormData(flightForm);
            const answers = [];
            
            // 收集答案
            for (let i = 0; i < 5; i++) {
                const answer = document.querySelector(`input[name="question${i}"]:checked`);
                if (answer) {
                    answers.push(parseInt(answer.value));
                } else {
                    alert(`请回答第${i + 1}题`);
                    return;
                }
            }
            
            // 提交飞行数据
            const flightData = {
                flight_number: formData.get('flight_number'),
                departure: formData.get('departure'),
                arrival: formData.get('arrival'),
                aircraft_id: formData.get('aircraft'),
                ticket_price: formData.get('ticket_price'),
                answers: answers
            };
            
            fetch('/operate_flight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(flightData)
            })
            .then(response => response.json())
            .then(data => {
                questionsModal.classList.remove('show');
                showResult(data);
            });
        });
    }
    
    function showResult(data) {
        const resultMessage = document.getElementById('resultMessage');
        // 添加显示正确答案数量的信息
        const correctInfo = data.correct_answers !== undefined ? `（答对了 ${data.correct_answers} 题）` : '';
        resultMessage.textContent = data.message + correctInfo;
        resultModal.classList.add('show');
        
        // 控制台输出调试信息，帮助排查问题
        console.log('答题结果:', data);
        
        // 更新主页数据（如果成功）
        if (data.success) {
            // 这里可以添加更新主页数据的逻辑
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
    
    // 关闭结果模态框
    const closeResultBtn = document.getElementById('closeResult');
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', function() {
            resultModal.classList.remove('show');
            location.reload();
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === questionsModal) {
            questionsModal.classList.remove('show');
        }
        if (event.target === resultModal) {
            resultModal.classList.remove('show');
            location.reload();
        }
    });
});

// 答题进度条功能
function updateAnswerProgress() {
    const totalQuestions = 5;
    let answeredQuestions = 0;
    
    for (let i = 0; i < totalQuestions; i++) {
        if (document.querySelector(`input[name="question${i}"]:checked`)) {
            answeredQuestions++;
        }
    }
    
    const progress = (answeredQuestions / totalQuestions) * 100;
    const progressBar = document.getElementById('answerProgress');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

// 监听答案选择
document.addEventListener('change', function(e) {
    if (e.target.type === 'radio' && e.target.name.startsWith('question')) {
        updateAnswerProgress();
    }
});

// 购买飞机功能
function purchaseAircraft(aircraftType, isWideBody) {
    fetch('/purchase_aircraft', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            aircraft_type: aircraftType,
            is_wide_body: isWideBody
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            location.reload();
        }
    });
}

// 购买配件功能
function buyAccessory(accessoryType) {
    fetch('/buy_accessory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accessory_type: accessoryType
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            location.reload();
        }
    });
}

// 出售飞机功能
let sellAircraftId = null;
let sellAircraftName = null;

function sellAircraft(aircraftId, aircraftName) {
    sellAircraftId = aircraftId;
    sellAircraftName = aircraftName;
    
    // 获取出售价格
    fetch('/get_aircraft_info/' + aircraftId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sellPrice = data.purchase_price * 0.5;
                document.getElementById('sellMessage').innerHTML = 
                    `您确定要出售 <strong>${aircraftName}</strong> 吗？<br>
                     出售价格：¥${sellPrice.toLocaleString()}`;
                document.getElementById('sellModal').style.display = 'block';
            }
        });
}

// 确认出售
document.getElementById('confirmSell')?.addEventListener('click', function() {
    if (sellAircraftId) {
        fetch('/sell_aircraft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aircraft_id: sellAircraftId
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                location.reload();
            }
        });
    }
});

// 取消出售
document.getElementById('cancelSell')?.addEventListener('click', function() {
    document.getElementById('sellModal').style.display = 'none';
    sellAircraftId = null;
    sellAircraftName = null;
});

// 关闭出售模态框
document.querySelector('#sellModal .close')?.addEventListener('click', function() {
    document.getElementById('sellModal').style.display = 'none';
    sellAircraftId = null;
    sellAircraftName = null;
});

// 点击外部关闭模态框
window.addEventListener('click', function(event) {
    const sellModal = document.getElementById('sellModal');
    if (event.target === sellModal) {
        sellModal.style.display = 'none';
        sellAircraftId = null;
        sellAircraftName = null;
    }
});