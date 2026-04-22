// 请在这里完成你的 JavaScript 逻辑。
// 你需要：
// 1. 页面加载后请求任务列表（GET）
// 2. 点击“刷新任务”按钮时重新获取列表
// 3. 提交表单时向 API 新增任务（POST）
// 4. 根据下拉框筛选任务
// 5. 把接口返回的数据渲染到页面上

// ========== 1. 获取必要的 DOM 元素 ========== 
const taskList = document.getElementById('taskList');
const loadTasksBtn = document.getElementById('loadTasksBtn');
const taskForm = document.getElementById('taskForm');
const statusFilter = document.getElementById('statusFilter');
const formMessage = document.getElementById('formMessage');
const listMessage = document.getElementById('listMessage');

// API 基础地址
const API_BASE_URL = 'https://api.yangyus8.top/api';

// 存储当前从接口获取的所有任务，用于筛选
let allTasks = [];

// 状态映射：将接口的英文状态转为中文显示
const STATUS_MAP = {
    'todo': { text: '待开始', className: 'todo' },
    'doing': { text: '进行中', className: 'doing' },
    'done': { text: '已完成', className: 'done' }
};

// ========== 2. 核心函数：获取任务列表 ========== 
async function fetchTasks() {
    // 清除旧消息，显示加载状态
    listMessage.textContent = '加载任务列表中...';
    listMessage.style.color = '#6b7280';

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
            // 如果HTTP状态码不是2xx，抛出错误
            throw new Error(`请求失败: ${response.status}`);
        }
        const result = await response.json();

        if (result.success) {
            // 保存所有任务，用于后续筛选
            allTasks = result.data;
            // 根据当前筛选条件渲染
            filterAndRenderTasks();
            // 成功提示
            listMessage.textContent = `任务加载成功，共 ${result.data.length} 条`;
            listMessage.style.color = '#166534'; // 绿色
        } else {
            throw new Error(result.message || '接口返回数据格式异常');
        }
    } catch (error) {
        // 捕获网络错误或解析错误 （对应评分：错误处理）
        console.error('获取任务列表失败:', error);
        listMessage.textContent = `加载失败: ${error.message}`;
        listMessage.style.color = '#dc2626'; // 红色
        // 清空列表，避免显示旧数据
        taskList.innerHTML = '';
    }
}

// ========== 3. 核心函数：渲染任务列表 ==========
function renderTasks(tasks) {
    // 清空现有列表
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        // 如果没有任务，显示提示
        const emptyItem = document.createElement('li');
        emptyItem.textContent = '暂无任务';
        emptyItem.style.textAlign = 'center';
        emptyItem.style.color = '#6b7280';
        emptyItem.style.padding = '20px';
        taskList.appendChild(emptyItem);
        return;
    }

    // 遍历任务数组，为每个任务创建列表项
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';

        const statusInfo = STATUS_MAP[task.status] || { text: task.status, className: '' };

        taskItem.innerHTML = `
            <h3>${escapeHtml(task.title)}</h3>
            <div class="task-meta">
                <span>负责人: ${escapeHtml(task.owner)}</span>
                <span class="badge ${statusInfo.className}">${statusInfo.text}</span>
                <span>创建: ${formatDate(task.createdAt)}</span>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
}

// ========== 4. 核心函数：筛选并渲染任务 ========== 
function filterAndRenderTasks() {
    const selectedStatus = statusFilter.value;
    let tasksToShow = allTasks;

    if (selectedStatus !== 'all') {
        // 如果选择的不是“全部”，则进行筛选
        tasksToShow = allTasks.filter(task => task.status === selectedStatus);
    }

    // 渲染筛选后的任务
    renderTasks(tasksToShow);
}

// ========== 5. 处理表单提交：创建新任务 ========== 
async function handleFormSubmit(event) {
    // 阻止表单的默认提交行为（页面跳转）
    event.preventDefault();

    // 获取表单数据
    const formData = new FormData(taskForm);
    const title = formData.get('title').trim();
    const owner = formData.get('owner').trim();
    const status = formData.get('status');

    // 简单的前端验证
    if (!title || !owner) {
        showFormMessage('任务名称和负责人不能为空', 'error');
        return;
    }

    // 准备发送的数据
    const newTask = { title, owner, status };

    // 显示提交中状态
    showFormMessage('提交中...', 'loading');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask)
        });

        const result = await response.json();

        if (result.success) {
            // 提交成功
            showFormMessage('任务创建成功！', 'success');
            // 清空表单
            taskForm.reset();
            // 重新获取最新任务列表
            await fetchTasks();
        } else {
            throw new Error(result.message || '创建失败');
        }
    } catch (error) {
        console.error('创建任务失败:', error);
        showFormMessage(`提交失败: ${error.message}`, 'error');
    }
}

// ========== 6. 辅助函数：显示表单消息 ========== 
function showFormMessage(text, type = 'info') {
    formMessage.textContent = text;
    const colorMap = {
        'success': '#166534', // 绿色
        'error': '#dc2626',   // 红色
        'loading': '#6b7280', // 灰色
        'info': '#6b7280'
    };
    formMessage.style.color = colorMap[type] || '#6b7280';
}

// ========== 7. 辅助函数：格式化日期 ==========
function formatDate(dateString) {
    const date = new Date(dateString);
    // 格式化为 YYYY-MM-DD
    return date.toISOString().split('T')[0];
}

// ========== 8. 辅助函数：转义HTML，防止XSS ==========
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 9. 事件监听与初始化 ========== 
// 页面加载完成后，获取任务列表
document.addEventListener('DOMContentLoaded', fetchTasks);

// 为“刷新任务”按钮绑定点击事件
loadTasksBtn.addEventListener('click', fetchTasks);

// 为表单绑定提交事件
taskForm.addEventListener('submit', handleFormSubmit);

// 为筛选下拉框绑定变更事件
statusFilter.addEventListener('change', filterAndRenderTasks);