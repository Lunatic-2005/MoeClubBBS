// Firebase ���� - �滻Ϊ���Լ�������
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ��ʼ�� Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// ȫ�ֱ���
let currentUser = null;

// ҳ�����ʱ����¼״̬
window.onload = function() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // �û��ѵ�¼����ȡ�û���Ϣ
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
      // �û�δ��¼
      currentUser = null;
      updateNavBar();
      showSection('home');
    }
  });
};

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
    loadPostsForAdmin();
    loadUsersForAdmin();
  }
}

// ��������
function loadPosts() {
  const postsContainer = document.getElementById('posts-container');
  postsContainer.innerHTML = '<p>Loading posts...</p>';

  database.ref('posts').orderByChild('date').once('value')
    .then((snapshot) => {
      const posts = snapshot.val() || {};
      postsContainer.innerHTML = '';

      // ת��Ϊ���鲢����������
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

          <!-- ��������� -->
          <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
          <button onclick="addComment('${post.id}')">Add Comment</button>

          <!-- ����չʾ���� -->
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

// ��������
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

// ע�Ṧ��
async function register() {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const email = `${username}@example.com`; // ��ʾ����ʵ��Ӧ��Ӧ�����û�������ʵ����

  if (!username || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    // ����û����Ƿ��Ѵ���
    const usernameSnapshot = await database.ref('usernames').child(username).once('value');
    if (usernameSnapshot.exists()) {
      alert('Username already exists.');
      return;
    }

    // �����û�
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // �洢�û���Ϣ
    await database.ref('users/' + userCredential.user.uid).set({
      username: username,
      role: 'user',
      email: email
    });
    
    // �洢�û���ӳ�䣬���ڼ��Ψһ��
    await database.ref('usernames/' + username).set(userCredential.user.uid);

    alert('Registration successful!');
    closeModal('register');
  } catch (error) {
    console.error('Registration error:', error);
    alert('Error: ' + error.message);
  }
}

// ��¼����
async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const email = `${username}@example.com`; // ��ע��һ��

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    // ��ȡ�û���Ϣ
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

// �ǳ�����
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

// ���µ�����
function updateNavBar() {
  const loginLink = document.querySelector('a[onclick="openModal(\'login\')"]');
  const registerLink = document.querySelector('a[onclick="openModal(\'register\')"]');
  const logoutLink = document.querySelector('a[onclick="logout()"]');
  const adminLoginLink = document.querySelector('a[onclick="openModal(\'adminLogin\')"]');

  if (currentUser) {
    loginLink.style.display = 'none';
    registerLink.style.display = 'none';
    logoutLink.style.display = 'block';
    
    // ����ǹ���Ա����ʾ����Ա���
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

// ����Ա����
async function adminLogin() {
  const adminPasswordInput = document.getElementById('adminPassword').value.trim();
  
  if (!currentUser) {
    alert('You must log in as a user first to access the admin panel.');
    closeModal('adminLogin');
    return;
  }

  // ������˹���Ա������֤��ʵ��Ӧ����Ӧ���и���ȫ�ķ�ʽ
  if (adminPasswordInput === 'admin123') {
    // �����û���ɫΪ����Ա
    try {
      await database.ref('users/' + currentUser.uid).update({ role: 'admin' });
      
      // ���µ�ǰ�û���Ϣ
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

// �����û��б�����Ա��
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

// ɾ���û�������Ա��
async function deleteUser(uid, username) {
  if (!confirm(`Are you sure you want to delete user ${username}?`)) {
    return;
  }

  try {
    // ɾ���û�����
    await database.ref('users/' + uid).remove();
    
    // ɾ���û���ӳ��
    await database.ref('usernames/' + username).remove();
    
    // ɾ���û�����֤��Ϣ
    // ע�⣺ʵ��Ӧ���п�����Ҫʹ��Admin SDK�ڷ�������ִ�д˲���
    alert('User deleted successfully!');
    loadUsersForAdmin();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user. Please try again.');
  }
}

// ���������б�����Ա��
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

// ɾ�����ӣ�����Ա��
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

// �������
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

    // ������۵�����
    const commentRef = database.ref(`posts/${postId}/comments`).push();
    await commentRef.set(newComment);

    alert('Comment added successfully!');
    commentInput.value = '';
    loadPosts(); // ���¼�������
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Error adding comment. Please try again.');
  }
}

// ɾ������
async function deleteComment(postId, commentId) {
  if (!currentUser) {
    alert('You must be logged in to delete comments.');
    return;
  }

  // ���Ȩ��
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
    loadPosts(); // ���¼�������
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Error deleting comment. Please try again.');
  }
}

// ģ̬����
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

// �˳�����Աģʽ
function exitAdminMode() {
  showSection('home');
}