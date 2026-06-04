import sqlite3
import os

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'maintenance.db')

def upgrade_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create the new table for Spare Parts Inventory
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS spare_parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            part_name TEXT NOT NULL,
            part_number TEXT,
            quantity INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (machine_id) REFERENCES machines (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database successfully upgraded! 'spare_parts' table added.")

if __name__ == '__main__':
    upgrade_db()