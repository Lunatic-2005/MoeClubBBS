// Firebase 配置 - 替换为你自己的配置
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// 全局变量
let currentUser = null;

// 页面加载时检查登录状态
window.onload = function() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // 用户已登录，获取用户信息
      database.ref('users/' + user.uid).once('value')
        .then((snapshot) => {
          const userData = snapshot.val();
          currentUser = {
            uid: user.uid,
            username: userData.username,
            role: userData.role || 'user',
            email: user.email
          };
          updateNavBar();
          showSection('home');
        });
    } else {
      // 用户未登录
      currentUser = null;
      updateNavBar();
      showSection('home');
    }
  });
};

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
    loadPostsForAdmin();
    loadUsersForAdmin();
  }
}

// 加载帖子
function loadPosts() {
  const postsContainer = document.getElementById('posts-container');
  postsContainer.innerHTML = '<p>Loading posts...</p>';

  database.ref('posts').orderByChild('date').once('value')
    .then((snapshot) => {
      const posts = snapshot.val() || {};
      postsContainer.innerHTML = '';

      // 转换为数组并按日期排序
      const postsArray = Object.entries(posts).map(([id, post]) => ({ id, ...post }));
      postsArray.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (postsArray.length === 0) {
        postsContainer.innerHTML = '<p>No posts yet. Be the first to post!</p>';
        return;
      }

      postsArray.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
          <h2>${post.title}</h2>
          <p><strong>Posted by:</strong> ${post.author || 'Anonymous'} on ${new Date(post.date).toLocaleString()}</p>
          <p>${post.content}</p>

          <!-- 评论输入框 -->
          <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
          <button onclick="addComment('${post.id}')">Add Comment</button>

          <!-- 评论展示区域 -->
          <div class="comments-section">
            <h3>Comments:</h3>
            ${post.comments ? Object.entries(post.comments).map(([commentId, comment]) => `
              <div class="comment">
                <p><strong>${comment.author}</strong> - ${new Date(comment.date).toLocaleString()}</p>
                <p>${comment.content}</p>
                ${
                  currentUser && (currentUser.role === 'admin' || currentUser.uid === comment.authorId) ?
                  `<button onclick="deleteComment('${post.id}', '${commentId}')">Delete</button>` :
                  ''
                }
              </div>
            `).join('') : '<p>No comments yet.</p>'}
          </div>
        `;
        postsContainer.appendChild(postDiv);
      });
    })
    .catch((error) => {
      console.error('Error loading posts:', error);
      postsContainer.innerHTML = '<p>Error loading posts. Please try again.</p>';
    });
}

// 发帖功能
async function addPost() {
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

  try {
    const newPost = {
      title,
      content,
      author: currentUser.username,
      authorId: currentUser.uid,
      date: new Date().toISOString(),
      comments: {}
    };

    const newPostRef = database.ref('posts').push();
    await newPostRef.set(newPost);

    alert('Post added successfully!');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    showSection('home');
  } catch (error) {
    console.error('Error adding post:', error);
    alert('Error adding post. Please try again.');
  }
}

// 注册功能
async function register() {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const email = `${username}@example.com`; // 简单示例，实际应用应该让用户输入真实邮箱

  if (!username || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    // 检查用户名是否已存在
    const usernameSnapshot = await database.ref('usernames').child(username).once('value');
    if (usernameSnapshot.exists()) {
      alert('Username already exists.');
      return;
    }

    // 创建用户
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // 存储用户信息
    await database.ref('users/' + userCredential.user.uid).set({
      username: username,
      role: 'user',
      email: email
    });
    
    // 存储用户名映射，用于检查唯一性
    await database.ref('usernames/' + username).set(userCredential.user.uid);

    alert('Registration successful!');
    closeModal('register');
  } catch (error) {
    console.error('Registration error:', error);
    alert('Error: ' + error.message);
  }
}

// 登录功能
async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const email = `${username}@example.com`; // 与注册一致

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    // 获取用户信息
    const snapshot = await database.ref('users/' + userCredential.user.uid).once('value');
    const userData = snapshot.val();
    
    currentUser = {
      uid: userCredential.user.uid,
      username: userData.username,
      role: userData.role || 'user',
      email: userData.email
    };
    
    alert(`Welcome, ${currentUser.username}!`);
    closeModal('login');
    showSection('home');
  } catch (error) {
    console.error('Login error:', error);
    alert('Error: ' + error.message);
  }
}

// 登出功能
function logout() {
  auth.signOut()
    .then(() => {
      currentUser = null;
      alert('You have logged out successfully.');
      updateNavBar();
      showSection('home');
    })
    .catch((error) => {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    });
}

// 更新导航栏
function updateNavBar() {
  const loginLink = document.querySelector('a[onclick="openModal(\'login\')"]');
  const registerLink = document.querySelector('a[onclick="openModal(\'register\')"]');
  const logoutLink = document.querySelector('a[onclick="logout()"]');
  const adminLoginLink = document.querySelector('a[onclick="openModal(\'adminLogin\')"]');

  if (currentUser) {
    loginLink.style.display = 'none';
    registerLink.style.display = 'none';
    logoutLink.style.display = 'block';
    
    // 如果是管理员，显示管理员入口
    if (currentUser.role === 'admin') {
      adminLoginLink.style.display = 'block';
    } else {
      adminLoginLink.style.display = 'none';
    }
  } else {
    loginLink.style.display = 'block';
    registerLink.style.display = 'block';
    logoutLink.style.display = 'none';
    adminLoginLink.style.display = 'none';
  }
}

// 管理员功能
async function adminLogin() {
  const adminPasswordInput = document.getElementById('adminPassword').value.trim();
  
  if (!currentUser) {
    alert('You must log in as a user first to access the admin panel.');
    closeModal('adminLogin');
    return;
  }

  // 这里简化了管理员密码验证，实际应用中应该有更安全的方式
  if (adminPasswordInput === 'admin123') {
    // 更新用户角色为管理员
    try {
      await database.ref('users/' + currentUser.uid).update({ role: 'admin' });
      
      // 更新当前用户信息
      currentUser.role = 'admin';
      
      alert('Admin access granted!');
      closeModal('adminLogin');
      showSection('admin');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error granting admin access. Please try again.');
    }
  } else {
    alert('Incorrect admin password. Please try again.');
  }
}

// 加载用户列表（管理员）
function loadUsersForAdmin() {
  const userList = document.getElementById('user-list');
  userList.innerHTML = '<p>Loading users...</p>';

  database.ref('users').once('value')
    .then((snapshot) => {
      const users = snapshot.val() || {};
      userList.innerHTML = '';

      Object.entries(users).forEach(([uid, user]) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
          <p>
            <strong>Username:</strong> ${user.username}<br>
            <strong>Email:</strong> ${user.email}<br>
            <strong>Role:</strong> ${user.role || 'user'}
            ${
              currentUser && currentUser.uid !== uid ?
              `<button onclick="deleteUser('${uid}', '${user.username}')">Delete User</button>` :
              ''
            }
          </p>
        `;
        userList.appendChild(userDiv);
      });
    })
    .catch((error) => {
      console.error('Error loading users:', error);
      userList.innerHTML = '<p>Error loading users. Please try again.</p>';
    });
}

// 删除用户（管理员）
async function deleteUser(uid, username) {
  if (!confirm(`Are you sure you want to delete user ${username}?`)) {
    return;
  }

  try {
    // 删除用户数据
    await database.ref('users/' + uid).remove();
    
    // 删除用户名映射
    await database.ref('usernames/' + username).remove();
    
    // 删除用户的认证信息
    // 注意：实际应用中可能需要使用Admin SDK在服务器端执行此操作
    alert('User deleted successfully!');
    loadUsersForAdmin();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user. Please try again.');
  }
}

// 加载帖子列表（管理员）
function loadPostsForAdmin() {
  const postsContainer = document.getElementById('post-list');
  postsContainer.innerHTML = '<p>Loading posts...</p>';

  database.ref('posts').once('value')
    .then((snapshot) => {
      const posts = snapshot.val() || {};
      postsContainer.innerHTML = '';

      Object.entries(posts).forEach(([postId, post]) => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `
          <h2>${post.title}</h2>
          <p><strong>Posted by:</strong> ${post.author || 'Anonymous'} on ${new Date(post.date).toLocaleString()}</p>
          <p>${post.content}</p>
          <button onclick="deletePost('${postId}')">Delete Post</button>
          <h3>Comments:</h3>
          ${
            post.comments ? 
            Object.entries(post.comments).map(([commentId, comment]) => `
              <div class="comment">
                <p><strong>${comment.author}</strong> on ${new Date(comment.date).toLocaleString()}</p>
                <p>${comment.content}</p>
                <button onclick="deleteComment('${postId}', '${commentId}')">Delete Comment</button>
              </div>
            `).join('') : 
            '<p>No comments yet.</p>'
          }
        `;
        postsContainer.appendChild(postDiv);
      });
    })
    .catch((error) => {
      console.error('Error loading posts:', error);
      postsContainer.innerHTML = '<p>Error loading posts. Please try again.</p>';
    });
}

// 删除帖子（管理员）
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) {
    return;
  }

  try {
    await database.ref('posts/' + postId).remove();
    alert('Post deleted successfully!');
    loadPostsForAdmin();
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Error deleting post. Please try again.');
  }
}

// 添加评论
async function addComment(postId) {
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

  try {
    const newComment = {
      author: currentUser.username,
      authorId: currentUser.uid,
      content: commentText,
      date: new Date().toISOString()
    };

    // 添加评论到帖子
    const commentRef = database.ref(`posts/${postId}/comments`).push();
    await commentRef.set(newComment);

    alert('Comment added successfully!');
    commentInput.value = '';
    loadPosts(); // 重新加载帖子
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Error adding comment. Please try again.');
  }
}

// 删除评论
async function deleteComment(postId, commentId) {
  if (!currentUser) {
    alert('You must be logged in to delete comments.');
    return;
  }

  // 检查权限
  const postSnapshot = await database.ref(`posts/${postId}`).once('value');
  const post = postSnapshot.val();
  
  const comment = post.comments[commentId];
  
  if (currentUser.role !== 'admin' && currentUser.uid !== comment.authorId) {
    alert('You do not have permission to delete this comment.');
    return;
  }

  if (!confirm('Are you sure you want to delete this comment?')) {
    return;
  }

  try {
    await database.ref(`posts/${postId}/comments/${commentId}`).remove();
    alert('Comment deleted successfully!');
    loadPosts(); // 重新加载帖子
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Error deleting comment. Please try again.');
  }
}

// 模态框功能
function openModal(type) {
  const modal = document.getElementById(`${type}-modal`);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'block';
  }
}

function closeModal(type) {
  const modal = document.getElementById(`${type}-modal`);
  if (modal) {
    modal.style.display = 'none';
  }
}

// 退出管理员模式
function exitAdminMode() {
  showSection('home');
}