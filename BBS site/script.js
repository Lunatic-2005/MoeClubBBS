// ģ���û�����
const users = JSON.parse(localStorage.getItem('bbsUsers')) || [];
let currentUser = null;

// �л�ҳ��
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
        showAdminDashboard();  // ���ع���Ա����
    }

    updateNavBar();
}

// ��������
function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    postsContainer.innerHTML = ''; // �����������

    savedPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
            <h2>${post.title}</h2>
            <p><strong>Posted by:</strong> ${post.author || 'Anonymous'} on ${post.date}</p>
            <p>${post.content}</p>

            <!-- ��������� -->
            <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
            <button onclick="addComment('${post.id}')">Add Comment</button>

            <!-- ����չʾ���� -->
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

// ��������
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
        id: Date.now().toString(),  // ʹ��ʱ�������ΨһID
        title,
        content,
        date: new Date().toLocaleString(),
        author: currentUser.username,
        comments: []  // ɾ�����۹���
    };

    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    savedPosts.unshift(newPost);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Post added successfully!');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    showSection('home');
}

// ��ģ̬��
function openModal(type) {
    console.log(`Attempting to open modal: ${type}-modal`);
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';     // ǿ����ʾ
        modal.style.visibility = 'visible'; // ȷ���ɼ�
        modal.style.opacity = '1';        // ȷ����͸��
        console.log(`${type}-modal is now visible`);
    } else {
        console.error(`Modal not found: ${type}-modal`);
    }
}
//����û���½״̬
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'login.html'; // �ض��򵽵�¼ҳ��
    }
}

// �ر�ģ̬��
function closeModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        console.log(`Closing modal: ${type}`);
        modal.style.display = 'none';  // ֱ������ display Ϊ none
    }
}

// ע�Ṧ��
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

// ��¼����
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
    // ȷ����ǰ�û��洢Ϊȫ�ֱ���
    window.currentUser = user;

    // �Զ���ת����ҳ
    showSection('home');
}


// �ǳ�����
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    alert('You have logged out successfully.');
    updateNavBar();
    showSection('home');
}


// ���µ�����
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

// ҳ�����ʱ�ָ���¼״̬
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
//����Ա��¼
function adminLogin() {
    // ��鵱ǰ�û��Ƿ��ѵ�¼
    if (typeof window.currentUser === 'undefined' || !window.currentUser) {
        alert('You must log in as a user first to access the admin panel.');
        closeModal('adminLogin');
        return;
    }

    // ��֤����Ա����
    const adminPasswordInput = document.getElementById('adminPassword').value.trim();
    const adminPassword = localStorage.getItem('adminPassword') || 'admin123'; // Ĭ������

    if (adminPasswordInput === adminPassword) {
        alert(`Admin login successful! Welcome, ${window.currentUser.username}`);
        closeModal('adminLogin');

        // ��ʾ����Ա���
        document.getElementById('admin-section').classList.remove('hidden');
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('create-section').classList.add('hidden');

        // ���ع���Ա����
        loadPostsForAdmin();
        loadUsersForAdmin();

        // ���� Admin Login ��ť
        const adminLoginButton = document.querySelector('a[onclick="openModal(\'adminLogin\')"]');
        if (adminLoginButton) {
            adminLoginButton.style.display = 'none';
        }
    } else {
        alert('Incorrect admin password. Please try again.');
    }
}




// ҳ�����ʱ��֤����Ա״̬
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
    // ��ȡ���ش洢�е���������
    const posts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    
    // ����Ҫɾ��������
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
        alert('Post not found.');
        return;
    }
    
    // ɾ���ҵ�������
    posts.splice(postIndex, 1);
    
    // ���±��ش洢
    localStorage.setItem('bbsPosts', JSON.stringify(posts));
    
    // ɾ����ˢ�½���
    loadPostsForAdmin();

    // ��ʾ�û�
    alert('Post deleted.');
}



// ����Ա���������б�

function loadPostsForAdmin() {
    const postsContainer = document.getElementById('post-list');
    const savedPosts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    postsContainer.innerHTML = ''; // �����������

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
        // ���û�� id��ʹ��ʱ�����Ϊ id
        post.id = Date.now().toString();
    }
});
localStorage.setItem('bbsPosts', JSON.stringify(posts));

        // ��������
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
//��������
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
        id: Date.now().toString(), // ΨһID
        author: currentUser.username,
        content: commentText,
        date: new Date().toLocaleString()
    };

    post.comments.push(newComment);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Comment added successfully!');
    loadPosts(); // ���¼������Ӻ�����
}
//ɾ������
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

    // ɾ������
    post.comments.splice(commentIndex, 1);
    localStorage.setItem('bbsPosts', JSON.stringify(savedPosts));

    alert('Comment deleted successfully.');
    loadPostsForAdmin(); // ���¼��ع���Ա����
}
