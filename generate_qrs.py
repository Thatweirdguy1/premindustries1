import sqlite3
import qrcode
import os

# --- CONFIGURATION ---
# Change this to your Server IP when you deploy (e.g., "http://192.168.1.100:3000")
BASE_URL = "http://localhost:3000"
OUTPUT_DIR = "qr_codes"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_stickers():
    try:
        conn = sqlite3.connect("maintenance.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, asset_tag FROM machines")
        machines = cursor.fetchall()
        
        if not machines:
            print("❌ No machines found in the database. Run init_db.py first.")
            return

        for machine in machines:
            m_id, name, tag = machine
            
            # The exact URL the QR code will open
            url = f"{BASE_URL}/report?machine_id={m_id}"
            
            # Create the QR Code
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(url)
            qr.make(fit=True)
            
            # Generate the image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save it with the Asset Tag as the filename
            safe_tag = tag.replace("/", "_") # Remove slashes for safe filenames
            filepath = os.path.join(OUTPUT_DIR, f"{safe_tag}.png")
            img.save(filepath)
            
        print(f"✅ Success! Generated {len(machines)} QR codes in the '{OUTPUT_DIR}' folder.")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    generate_stickers()