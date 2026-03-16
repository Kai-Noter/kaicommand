# Push KaiCommand to GitHub – Simple Step-by-Step

You are stuck because your computer is using the wrong GitHub account (jacklwinga-cyber) but your repo is under **Kai-Noter**. Follow these steps **in order**.

---

## Part 1: Clear the Old Account (So the Computer Asks Again)

### Step 1: Open Keychain Access
- Press **Command + Space** (opens Spotlight).
- Type: **Keychain Access**
- Press **Enter**.

### Step 2: Find GitHub in Keychain
- At the top right there is a **search box**.
- Type: **github**
- Press **Enter**.

### Step 3: Delete the GitHub Entry
- You will see one or more rows with **github.com** in the name.
- **Double-click** the row that says something like "github.com" or "Internet password".
- A small window will open.
- Click the **"Access Control"** or **"Access"** tab (or stay on "Attributes").
- At the bottom, click **"Delete"** or the minus **"-"** button to remove this password.
- When it asks "Are you sure?", click **Delete** or **OK**.
- Close the small window.

### Step 4: Close Keychain Access
- You can close Keychain Access now. The old GitHub password is removed.

---

## Part 2: Push Again (So the Computer Asks for Kai-Noter)

### Step 5: Open Terminal
- In Cursor (or VS Code), open the **Terminal** at the bottom.
- Or press **Command + Space**, type **Terminal**, press **Enter**.

### Step 6: Go to Your Project
Type this and press **Enter** (you can copy and paste):

```
cd "/Users/jacksonlwinga/Desktop/MPJL APPS/KaiCommand"
```

### Step 7: Push to GitHub
Type this and press **Enter**:

```
git push -u origin main
```

### Step 8: When a Box or the Terminal Asks for Your Details
The computer will ask you to sign in. It might pop up a **window** or ask in the **terminal**.

**If it asks in a WINDOW (pop-up):**
- **Username or Login:** type **Kai-Noter** (exactly like that).
- **Password:** paste your **Personal Access Token** (the long code that starts with `ghp_` that you made on GitHub). Do not type your normal GitHub password.
- Click **OK** or **Sign in**.

**If it asks in the TERMINAL (same line where you typed the command):**
- It might say "Username for 'https://github.com':" → type **Kai-Noter** and press **Enter**.
- Then it might say "Password for 'https://Kai-Noter@github.com':" → **paste your token** (the `ghp_...` one). You will not see it when you paste. Press **Enter**.

### Step 9: Check If It Worked
- If you see something like **"Counting objects"** and then **"done"** or **"Branch 'main' set up to track..."** with no red error, it worked.
- Open your browser and go to: **https://github.com/Kai-Noter/kaicommand**  
  You should see your KaiCommand files there.

---

## If You Don’t Have a Token (Or You Lost It)

1. Open the browser and go to **github.com**.
2. **Log in as Kai-Noter** (the account that owns the repo).
3. Click your **profile picture** (top right) → **Settings**.
4. On the left, scroll down and click **Developer settings**.
5. Click **Personal access tokens** → **Tokens (classic)**.
6. Click **Generate new token** → **Generate new token (classic)**.
7. **Note:** type **KaiCommand** (or any name you like).
8. **Expiration:** choose 90 days (or whatever you like).
9. Under **Scopes**, tick **repo** (full control of private repositories).
10. Scroll down and click **Generate token**.
11. **Copy the token** (it looks like `ghp_xxxxxxxxxxxx`) and save it in a safe place. You won’t see it again.
12. Use this token as the **Password** in Step 8 above.

---

## If You Are Still Stuck: Use GitHub Desktop Instead

1. Download **GitHub Desktop** from: https://desktop.github.com  
2. Install it and open it.
3. When it asks, **Sign in to GitHub** and choose **Sign in with your browser**.
4. In the browser, log in as **Kai-Noter** and allow GitHub Desktop.
5. In GitHub Desktop: **File** → **Add local repository**.
6. Click **Choose** and select the folder:  
   **Desktop → MPJL APPS → KaiCommand**
7. If it says "this directory is a Git repository", click **Add repository**.
8. You should see your project. At the top, click **Publish repository** (or **Push origin**).
9. Make sure it says **Kai-Noter/kaicommand**. Then click **Push** or **Publish**.

Your code will be on GitHub under Kai-Noter.

---

## Quick Checklist

- [ ] Opened Keychain Access and searched "github"
- [ ] Deleted the github.com password
- [ ] Opened Terminal and went to the KaiCommand folder
- [ ] Ran: git push -u origin main
- [ ] When asked, used **Kai-Noter** as username and **token** as password
- [ ] Checked https://github.com/Kai-Noter/kaicommand to see the files

If you do these steps and it still says "denied to jacklwinga-cyber", try the **GitHub Desktop** way at the end.
