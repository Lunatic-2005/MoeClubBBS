// 模拟用户数据
const users = JSON.parse(localStorage.getItem('bbsUsers')) || [];
let currentUser = null;

// 切换页面
function showSection(section) {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('create-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');

    if (section === 'home') {
        document.getElementById('home-section').classList.remove('hidden');
        loadPosts();
    } else if (section === 'create') {
        document.getElementById('create-section').classList.remove('hidden');
    } else if (section === 'admin') {
        document.getElementById('admin-section').classList.remove('hidden');
        showAdminDashboard();  // 加载管理员内容
    }

    updateNavBar();
}

// 加载帖子
function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    postsContainer.innerHTML = ''; // 清空现有内容

    savedPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
            <h2>${post.title}</h2>
            <p><strong>Posted by:</strong> ${post.author || 'Anonymous'} on ${post.date}</p>
            <p>${post.content}</p>

            <!-- 评论输入框 -->
            <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
            <button onclick="addComment('${post.id}')">Add Comment</button>

            <!-- 评论展示区域 -->
            <div class="comments-section">
                <h3>Comments:</h3>
                ${post.comments && post.comments.length > 0 ? 
                    post.comments.map(comment => `
                        <div class="comment">
                            <p><strong>${comment.author}</strong> - ${comment.date}</p>
                            <p>${comment.content}</p>
                            ${
                                currentUser && (currentUser.role === 'admin' || currentUser.username === comment.author) ?
                                `<button onclick="deleteComment('${post.id}', '${comment.id}')">Delete</button>` :
                                ''
                            }
                        </div>
                    `).join('') : '<p>No comments yet.</p>'}
            </div>
        `;
        postsContainer.appendChild(postDiv);
    });
}

// 发帖功能
function addPost() {
    if (!currentUser) {
        alert('You must be logged in to post.');
        openModal('login');
        return;
    }

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title || !content) {
        alert('Please fill in all fields.');
        return;
    }

    const newPost = {
        id: Date.now().toString(),  // 使用时间戳生成唯一ID
        title,
        content,
        date: new Date().toLocaleString(),
        author: currentUser.username,
        comments: []  // 删除评论功能
    };

    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    savedPosts.unshift(newPost);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Post added successfully!');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    showSection('home');
}

// 打开模态框
function openModal(type) {
    console.log(`Attempting to open modal: ${type}-modal`);
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';     // 强制显示
        modal.style.visibility = 'visible'; // 确保可见
        modal.style.opacity = '1';        // 确保不透明
        console.log(`${type}-modal is now visible`);
    } else {
        console.error(`Modal not found: ${type}-modal`);
    }
}
//检查用户登陆状态
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'login.html'; // 重定向到登录页面
    }
}

// 关闭模态框
function closeModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        console.log(`Closing modal: ${type}`);
        modal.style.display = 'none';  // 直接设置 display 为 none
    }
}

// 注册功能
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!username || !password) {
        alert('Please fill in all fields.');
        return;
    }

    const existingUsers = JSON.parse(localStorage.getItem('bbsUsers')) || [];
    if (existingUsers.find(user => user.username === username)) {
        alert('Username already exists.');
        return;
    }

    existingUsers.push({ username, password });
    localStorage.setItem('bbsUsers', JSON.stringify(existingUsers));

    alert('Registration successful!');
    closeModal('register');
    showSection('home');
}

// 登录功能
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    const users = JSON.parse(localStorage.getItem('bbsUsers')) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        alert('Invalid username or password.');
        return;
    }

    currentUser = user;
    alert(`Welcome, ${username}!`);
    closeModal('login');
    // 确保当前用户存储为全局变量
    window.currentUser = user;

    // 自动跳转到主页
    showSection('home');
}


// 登出功能
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    alert('You have logged out successfully.');
    updateNavBar();
    showSection('home');
}


// 更新导航栏
function updateNavBar() {
    const loginLink = document.querySelector('a[onclick="openModal(\'login\')"]');
    const registerLink = document.querySelector('a[onclick="openModal(\'register\')"]');
    const logoutLink = document.querySelector('a[onclick="logout()"]');

    if (currentUser) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

// 页面加载时恢复登录状态
window.onload = function() {
    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (savedUser) {
        currentUser = savedUser;
    }
    updateNavBar();
};

let adminPassword = localStorage.getItem('adminPassword') || '12345';

function updateAdminPassword() {
    const newPassword = prompt('Enter new admin password:');
    if (newPassword) {
        adminPassword = newPassword;
        localStorage.setItem('adminPassword', newPassword);
        alert('Admin password updated successfully!');
    }
}

let isAdminMode = false;
//管理员登录
function adminLogin() {
    // 检查当前用户是否已登录
    if (typeof window.currentUser === 'undefined' || !window.currentUser) {
        alert('You must log in as a user first to access the admin panel.');
        closeModal('adminLogin');
        return;
    }

    // 验证管理员密码
    const adminPasswordInput = document.getElementById('adminPassword').value.trim();
    const adminPassword = localStorage.getItem('adminPassword') || 'admin123'; // 默认密码

    if (adminPasswordInput === adminPassword) {
        alert(`Admin login successful! Welcome, ${window.currentUser.username}`);
        closeModal('adminLogin');

        // 显示管理员面板
        document.getElementById('admin-section').classList.remove('hidden');
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('create-section').classList.add('hidden');

        // 加载管理员功能
        loadPostsForAdmin();
        loadUsersForAdmin();

        // 隐藏 Admin Login 按钮
        const adminLoginButton = document.querySelector('a[onclick="openModal(\'adminLogin\')"]');
        if (adminLoginButton) {
            adminLoginButton.style.display = 'none';
        }
    } else {
        alert('Incorrect admin password. Please try again.');
    }
}




// 页面加载时验证管理员状态
window.onload = function () {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        document.getElementById('admin-section').classList.remove('hidden');
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('create-section').classList.add('hidden');
    }
};


function loadUsersForAdmin() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users.forEach((user, index) => {
        const userDiv = document.createElement('div');
        userDiv.innerHTML = `
            <p>
                <strong>Username:</strong> ${user.username}<br>
                <strong>Password:</strong> ${user.password}
                <button onclick="deleteUser(${index})">Delete User</button>
            </p>
        `;
        userList.appendChild(userDiv);
    });
}

function deleteUser(index) {
    if (confirm('Are you sure you want to delete this user?')) {
        users.splice(index, 1);
        localStorage.setItem('bbsUsers', JSON.stringify(users));
        loadUsersForAdmin();
    }
}

function deletePost(postId) {
    // 获取本地存储中的所有帖子
    const posts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    
    // 查找要删除的帖子
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
        alert('Post not found.');
        return;
    }
    
    // 删除找到的帖子
    posts.splice(postIndex, 1);
    
    // 更新本地存储
    localStorage.setItem('bbsPosts', JSON.stringify(posts));
    
    // 删除后刷新界面
    loadPostsForAdmin();

    // 提示用户
    alert('Post deleted.');
}



// 管理员加载帖子列表

function loadPostsForAdmin() {
    const postsContainer = document.getElementById('post-list');
    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    postsContainer.innerHTML = ''; // 清空现有内容

    savedPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
            <h2>${post.title}</h2>
            <p><strong>Posted by:</strong> ${post.author || 'Anonymous'} on ${post.date}</p>
            <p>${post.content}</p>
            <button onclick="deletePost('${post.id}')">Delete Post</button>
            <h3>Comments:</h3>
        `;
        const posts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
posts.forEach(post => {
    if (!post.id) {
        // 如果没有 id，使用时间戳作为 id
        post.id = Date.now().toString();
    }
});
localStorage.setItem('bbsPosts', JSON.stringify(posts));

        // 加载评论
        if (post.comments && post.comments.length > 0) {
            const commentsList = document.createElement('div');
            post.comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.innerHTML = `
                    <p><strong>${comment.author}</strong> on ${comment.date}</p>
                    <p>${comment.content}</p>
                    <button onclick="deleteComment('${post.id}', '${comment.id}')">Delete Comment</button>
                `;
                commentsList.appendChild(commentDiv);
            });
            postDiv.appendChild(commentsList);
        } else {
            postDiv.innerHTML += `<p>No comments yet.</p>`;
        }

        postsContainer.appendChild(postDiv);
    });
}

function exitAdminMode() {
    isAdminMode = false;
    alert("Exited admin mode.");
    showSection('home');
    const adminLoginButton = document.querySelector('a[onclick="openModal(\'adminLogin\')"]');
if (adminLoginButton) {
    adminLoginButton.style.display = 'block';
}
}
//更新评论
function addComment(postId) {
    if (!currentUser) {
        alert('You must be logged in to comment.');
        openModal('login');
        return;
    }

    const commentInput = document.getElementById(`comment-${postId}`);
    const commentText = commentInput.value.trim();

    if (!commentText) {
        alert('Please enter a comment.');
        return;
    }

    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    const post = savedPosts.find(p => p.id === postId);

    if (!post.comments) {
        post.comments = [];
    }

    const newComment = {
        id: Date.now().toString(), // 唯一ID
        author: currentUser.username,
        content: commentText,
        date: new Date().toLocaleString()
    };

    post.comments.push(newComment);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Comment added successfully!');
    loadPosts(); // 重新加载帖子和评论
}
//删除评论
function deleteComment(postId, commentId) {
    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    const post = savedPosts.find(p => p.id === postId);

    if (!post || !post.comments) {
        alert('No comments found for this post.');
        return;
    }

    const commentIndex = post.comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
        alert('Comment not found.');
        return;
    }

    // 删除评论
    post.comments.splice(commentIndex, 1);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Comment deleted successfully.');
    loadPostsForAdmin(); // 重新加载管理员界面
}
