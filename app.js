// Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUxJSMP5MBWeyV2cqi7tqpcSWCTO2Q2is",
  authDomain: "abuadlink.firebaseapp.com",
  projectId: "abuadlink",
  storageBucket: "abuadlink.firebasestorage.app",
  messagingSenderId: "202427306773",
  appId: "1:202427306773:web:cab414ef5a0df2e30a8f1c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// Signup
window.signup = async function () {
  const email = document.getElementById("signup-email").value;
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const emoji = document.getElementById("signup-emoji").value || "🙂";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      username,
      emoji,
      friends: [],
      friendRequests: [],
      notifications: []
    });

    location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
};

// Login
window.login = async function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
};

// Group creation
window.createGroup = async function () {
  const user = auth.currentUser;
  const groupName = prompt("Enter group name:");

  if (!user || !groupName) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  if (userData.friends.length < 10) {
    alert("You need at least 10 friends to create a group.");
    return;
  }

  await addDoc(collection(db, "groups"), {
    name: groupName,
    createdBy: user.uid,
    members: [user.uid],
    requests: []
  });

  alert("Group created!");
};

// Friend Request
window.sendFriendRequest = async function (targetUid) {
  const user = auth.currentUser;
  if (!user || !targetUid) return;

  const targetRef = doc(db, "users", targetUid);
  await updateDoc(targetRef, {
    friendRequests: arrayUnion(user.uid),
    notifications: arrayUnion(`${user.uid} sent you a friend request.`)
  });
};

// Accept Request
window.acceptFriendRequest = async function (requesterUid) {
  const user = auth.currentUser;
  if (!user || !requesterUid) return;

  const userRef = doc(db, "users", user.uid);
  const requesterRef = doc(db, "users", requesterUid);

  await updateDoc(userRef, {
    friends: arrayUnion(requesterUid),
    friendRequests: []
  });

  await updateDoc(requesterRef, {
    friends: arrayUnion(user.uid),
    notifications: arrayUnion(`${user.uid} accepted your friend request.`)
  });

  alert("Friend added!");
};

// Channel Creation
window.createChannel = async function () {
  const user = auth.currentUser;
  const channelName = prompt("Enter channel name:");
  if (!user || !channelName) return;

  await addDoc(collection(db, "channels"), {
    name: channelName,
    createdBy: user.uid,
    posts: []
  });

  alert("Channel created.");
};

// Post to Channel
window.postToChannel = async function (channelId, content) {
  const user = auth.currentUser;
  if (!user || !channelId || !content) return;

  const channelRef = doc(db, "channels", channelId);
  const channelDoc = await getDoc(channelRef);
  if (!channelDoc.exists()) return;

  const posts = channelDoc.data().posts || [];
  posts.push({ user: user.uid, content, timestamp: Date.now() });

  await updateDoc(channelRef, { posts });
};

// Notifications
window.loadNotifications = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.data();
  const notificationDiv = document.getElementById("notifications");

  if (notificationDiv) {
    notificationDiv.innerHTML = "";
    data.notifications?.forEach(note => {
      const p = document.createElement("p");
      p.textContent = note;
      notificationDiv.appendChild(p);
    });
  }
};

// Load on auth
auth.onAuthStateChanged(user => {
  if (user && location.pathname.includes("dashboard")) {
    loadNotifications();
  }
});