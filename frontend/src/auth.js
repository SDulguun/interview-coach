// Auth utility — localStorage-based accounts with SHA-256 hashing

async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous fallback hash for migration/compat
function syncHash(str) {
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

export async function registerUser(username, password, displayName) {
  const users = getUsers();
  if (users.find(u => u.username === username.toLowerCase())) {
    return { success: false, error: 'username_taken' };
  }
  const userId = 'u_' + Date.now().toString(36);
  const hashedPassword = await sha256(password);
  const user = {
    id: userId,
    username: username.toLowerCase(),
    hashedPassword,
    hashVersion: 2, // SHA-256
    displayName: displayName || username,
  };
  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export async function loginUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username.toLowerCase());
  if (!user) return { success: false, error: 'user_not_found' };

  // Support both old (syncHash) and new (SHA-256) passwords
  if (user.hashVersion === 2) {
    const hash = await sha256(password);
    if (user.hashedPassword !== hash) return { success: false, error: 'wrong_password' };
  } else {
    // Legacy: migrate on successful login
    if (user.hashedPassword !== syncHash(password)) return { success: false, error: 'wrong_password' };
    // Upgrade hash
    user.hashedPassword = await sha256(password);
    user.hashVersion = 2;
    saveUsers(users);
  }
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
