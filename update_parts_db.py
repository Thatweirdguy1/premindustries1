import sqlite3
import os

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'maintenance.db')

def update_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add the new column to hold the image URL
        cursor.execute('ALTER TABLE spare_parts ADD COLUMN photo_url TEXT')
        print("✅ Success! 'photo_url' column added to your inventory.")
    except Exception as e:
        print(f"Note: {e} (Column might already exist)")
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_db()