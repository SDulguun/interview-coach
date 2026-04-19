// Simple auth utility for MVP — localStorage-based accounts

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('interview-users') || '[]');
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem('interview-users', JSON.stringify(users));
}

export function registerUser(username, password, displayName) {
  const users = getUsers();
  if (users.find(u => u.username === username.toLowerCase())) {
    return { success: false, error: 'username_taken' };
  }
  const userId = 'u_' + Date.now().toString(36);
  const user = {
    id: userId,
    username: username.toLowerCase(),
    hashedPassword: simpleHash(password),
    displayName: displayName || username,
  };
  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export function loginUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username.toLowerCase());
  if (!user) return { success: false, error: 'user_not_found' };
  if (user.hashedPassword !== simpleHash(password)) return { success: false, error: 'wrong_password' };
  return { success: true, user };
}

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('interview-current-user'));
  } catch { return null; }
}

export function setCurrentUser(user) {
  if (user) {
    sessionStorage.setItem('interview-current-user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('interview-current-user');
  }
}

export function logoutUser() {
  setCurrentUser(null);
}

// Namespace localStorage keys per user (guest = no prefix change)
export function userKey(userId, key) {
  if (!userId) return `interview-${key}`;
  return `interview-${userId}-${key}`;
}
