import random
from app import app
from models import db, User, Machine, WorkOrder
from datetime import datetime, date, timedelta, timezone

def setup_database():
    with app.app_context():
        db.create_all()
        
        if Machine.query.first():
            print("Database already initialized. Delete maintenance.db if you want to reset.")
            return
        
        raw_machines = [
            {"name": "OFFSET PRINTING -7 COLOUR + L", "tag": "PI/MC/PR/01"},
            {"name": "OFFSET PRINTING-6 COLOUR + L", "tag": "PI/MC/PR/02"},
            {"name": "OFFSET PRINTING -6 COLOUR + L", "tag": "PI/MC/PR/03"},
            {"name": "OFFSET PRINTING -2 COLOUR + L", "tag": "PI/MC/PR/04"},
            {"name": "OFFSET PRINTING -2 COLOUR + L", "tag": "PI/MC/PR/05"},
            {"name": "AUTO PAPER CUTTING", "tag": "PI/MC/APC/01"},
            {"name": "AUTO PAPER CUTTING", "tag": "PI/MC/APC/02"},
            {"name": "AUTO DIE (MASTER CARTON)", "tag": "PI/MC/AD/01"},
            {"name": "AUTO DIE (MASTER CARTON)", "tag": "PIMC//AD/02"},
            {"name": "MANUAL DIE PUNCHING", "tag": "PI/MC/MDP/01"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/02"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/03"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/04"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/05"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/06"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/07"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/08"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/09"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP/10"},
            {"name": "MANUALDIE PUNCHING", "tag": "PI/MC/MDP11/"},
            {"name": "AUTO LAMINATION", "tag": "PIMC//AL/01"},
            {"name": "AUTO LAMINATION", "tag": "PI/MC/AL/02"},
            {"name": "MANUAL LAMINATION", "tag": "PI/MC/ML/01"},
            {"name": "WINDOW LAMINATION", "tag": "PIMC//WL/01"},
            {"name": "WINDOW LAMINATION", "tag": "PI/MC/WL/02"},
            {"name": "LAMINATION ROLL CUTTER", "tag": "PI/MC/RLC/01"},
            {"name": "AUTOMATIC FOLDER GLUER", "tag": "PI/MC/AFG/01"},
            {"name": "ADVANCE FOLDER GLUER", "tag": "PI/MC/AFG/01A"},
            {"name": "AUTOMATIC FLUTE LAMINATION (FMZ)", "tag": "PI/MC/AFL/01"},
            {"name": "AUTOMATIC FLUTE LAMINATION (FMZ)", "tag": "PI/MC/AFL/02"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/01"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/02"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/03"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/04"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/05"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/06"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/07"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/08"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/09"},
            {"name": "MANUAL FLUTE PASTING", "tag": "PI/MC/MFP/10"},
            {"name": "CORRUGATION + REEL STAND", "tag": "PI/MC/CRS/01"},
            {"name": "CORRUGATION + REEL STAND", "tag": "PI/MC/CRS/02"},
            {"name": "CORRUGATION + REEL STAND", "tag": "PIMC//CRS/03"},
            {"name": "CORRUGATION + REEL STAND", "tag": "PI/MC/CRS/04"},
            {"name": "CORRUGATION + REEL STAND", "tag": "PI/MC/CRS/05"},
            {"name": "THERMO PACK BOILER", "tag": "PI/MC/TPB/01"},
            {"name": "MANUAL CUTTER", "tag": "PI/MC/MC/01"},
            {"name": "AUTO STITCHING", "tag": "PI/MC/AS/01"},
            {"name": "AUTO STITCHING", "tag": "PI/MC/AS/02"},
            {"name": "MANUAL STITCHING", "tag": "PIMC//MS/01"},
            {"name": "MANUAL STITCHING", "tag": "PIMC//MS/02"},
            {"name": "MANUAL STITCHING", "tag": "PIMC//MS/03"},
            {"name": "MANUAL STITCHING", "tag": "PIMC//MS/04"},
            {"name": "MANUAL STITCHING", "tag": "PI/MC/MS/05"},
            {"name": "WINDOW PATCHING", "tag": "PI/MC/WP/01"},
            {"name": "WINDOW PATCHING", "tag": "PI/MC/WP/02"},
            {"name": "SQUARE BOTTOM PAPER BAG MACHINE", "tag": "PI/MC/PB/01"},
            {"name": "SQUARE BOTTOM PAPER BAG MACHINE", "tag": "PI/MC/PB/02"},
            {"name": "FLAT HANDLE ONLINE MACHINE", "tag": "PI/MC/PB/03"},
            {"name": "SQUARE BOTTOM PAPER BAG MACHINE", "tag": "PI/MC/PB/04"},
            {"name": "PAPER BAG MAKING MACHINE", "tag": "PI/MC/PB/05"},
            {"name": "C. I. FLEXO PRINTING MACHINE", "tag": "PI/MC/FPR/01"},
            {"name": "TWIN HEAD PAPER ROPE TWISTING", "tag": "PI/MC/PT/01"},
            {"name": "TWIN HEAD PAPER ROPE TWISTING", "tag": "PI/MC/PT/02"},
            {"name": "TWIN HEAD PAPER ROPE TWISTING", "tag": "PI/MC/PT/03"},
            {"name": "TWIN HEAD PAPER ROPE TWISTING", "tag": "PI/MC/PT/04"},
            {"name": "TWIN HEAD PAPER ROPE TWISTING", "tag": "PI/MC/PT/05"},
            {"name": "DOUBLE HEAD TWIST ROPE MAKING", "tag": "PI/MC/PT/06"},
            {"name": "DOUBLE HEAD TWIST ROPE MAKING", "tag": "PI/MC/PT/07"},
            {"name": "DOUBLE HEAD TWIST ROPE MAKING", "tag": "PI/MC/PT/08"},
            {"name": "ROPE WINDING MACHINE", "tag": "PI/MC/RWM/01"},
            {"name": "ROPE WINDING", "tag": "PI/MC/RW/01"}
        ]

        today = date.today()
        inserted_machines = []

        for m in raw_machines:
            random_days_ago = random.randint(0, 30)
            last_pm_date = today - timedelta(days=random_days_ago)
            next_pm_date = last_pm_date + timedelta(days=30)

            machine_record = Machine(
                name=m['name'],
                asset_tag=m['tag'],
                location="Dadri Plant Main Floor", 
                last_maintenance=last_pm_date,
                next_maintenance=next_pm_date,
                status='operational'
            )
            db.session.add(machine_record)
            inserted_machines.append(machine_record)
            
        db.session.commit()

        print("Generating 150 historical analytics records...")
        now = datetime.now(timezone.utc)
        
        operator_names = ["Suresh Yadav", "Vikash", "Ramesh", ""]
        tech_names = ["Amit Singh", "Rahul", "Deepak", ""]

        for _ in range(150):
            random_machine = random.choice(inserted_machines)
            days_back = random.randint(1, 730)
            event_start = now - timedelta(days=days_back)
            event_end = event_start + timedelta(hours=random.randint(1, 8))
            is_breakdown = random.choice([True, False])
            
            history_record = WorkOrder(
                machine_id=random_machine.id,
                schedule_type='breakdown_report' if is_breakdown else 'preventive_maintenance',
                task_category=random.choice(['mechanical', 'electrical', 'other']),
                description="System generated historical record." if is_breakdown else "Monthly scheduled maintenance.",
                status='completed',
                supervisor_name="Rajesh Kumar",
                technician_name=random.choice(tech_names),
                operator_name=random.choice(operator_names),
                created_at=event_start,
                completed_at=event_end
            )
            db.session.add(history_record)

        db.session.commit()
        print(f"✅ Database initialized with {len(raw_machines)} machines and 150 records.")

if __name__ == "__main__":
    setup_database()