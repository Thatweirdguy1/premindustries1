import sqlite3

def upgrade_db():
    conn = sqlite3.connect('maintenance.db')
    cursor = conn.cursor()
    
    # Create the new table for Inspection Reports
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS machine_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            engineer_type TEXT NOT NULL,
            engineer_name TEXT NOT NULL,
            notes TEXT,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (machine_id) REFERENCES machines (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database successfully upgraded! 'machine_reports' table added.")

if __name__ == '__main__':
    upgrade_db()