import sqlite3

# ----------------------------------------------------
# 1. Connect to SQLite (creates 'database.db' if missing)
# ----------------------------------------------------
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# ----------------------------------------------------
# 2. Create Tables for Users & Sound Settings
# ----------------------------------------------------
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER UNIQUE,
        sleep_vol REAL DEFAULT 0.0,
        study_vol REAL DEFAULT 0.0,
        refresh_vol REAL DEFAULT 0.0,
        ocean_vol REAL DEFAULT 0.0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
''')

conn.commit()
print("✅ SQLite Database & Tables created successfully!\n")

# ----------------------------------------------------
# 3. Helper Functions to Save & Fetch Data
# ----------------------------------------------------

def register_user(email, password):
    """ Registers a new user and creates their default sound settings """
    try:
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO preferences (user_id) VALUES (?)", (user_id,))
        conn.commit()
        print(f"🎉 User registered successfully with ID: {user_id}")
    except sqlite3.IntegrityError:
        print("❌ Error: An account with this email already exists.")

def login_user(email, password):
    """ Validates login credentials """
    cursor.execute("SELECT id FROM users WHERE email = ? AND password = ?", (email, password))
    user = cursor.fetchone()
    if user:
        print(f"✅ Login successful! User ID: {user[0]}")
        return user[0]
    else:
        print("❌ Invalid email or password.")
        return None

def save_sound_preferences(user_id, sleep, study, refresh, ocean):
    """ Saves or updates volume levels for a user """
    cursor.execute('''
        INSERT INTO preferences (user_id, sleep_vol, study_vol, refresh_vol, ocean_vol)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            sleep_vol = excluded.sleep_vol,
            study_vol = excluded.study_vol,
            refresh_vol = excluded.refresh_vol,
            ocean_vol = excluded.ocean_vol
    ''', (user_id, sleep, study, refresh, ocean))
    conn.commit()
    print("💾 Sound preferences saved to SQLite!")

def get_sound_preferences(user_id):
    """ Fetches saved sound settings for a user """
    cursor.execute("SELECT sleep_vol, study_vol, refresh_vol, ocean_vol FROM preferences WHERE user_id = ?", (user_id,))
    prefs = cursor.fetchone()
    if prefs:
        print(f"🎵 Current Sound Settings for User {user_id}:")
        print(f"   - Sleep Volume:   {prefs[0]}")
        print(f"   - Study Volume:   {prefs[1]}")
        print(f"   - Refresh Volume: {prefs[2]}")
        print(f"   - Ocean Volume:   {prefs[3]}")
    return prefs

# ----------------------------------------------------
# 4. Test Example (Run it directly!)
# ----------------------------------------------------
if __name__ == "__main__":
    print("--- 1. Testing Registration ---")
    register_user("alex@example.com", "mypassword123")

    print("\n--- 2. Testing Login ---")
    user_id = login_user("alex@example.com", "mypassword123")

    if user_id:
        print("\n--- 3. Saving Volume Preferences ---")
        # Save volume levels (0.0 to 1.0)
        save_sound_preferences(user_id, sleep=0.8, study=0.5, refresh=0.2, ocean=0.9)

        print("\n--- 4. Reading Saved Preferences ---")
        get_sound_preferences(user_id)

    conn.close()