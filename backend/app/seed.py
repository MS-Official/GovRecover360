import os
import sys
from uuid import uuid4
from datetime import datetime, timedelta
from random import choice, randint, uniform

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import engine, Base, SessionLocal
from app.models.models import (
    Role, Permission, RolePermission, User, DisasterEvent, DisasterZone,
    Household, DamageAssessment, ReliefApplication, BeneficiaryVerification,
    ReliefProgram, ReliefPackage, PaymentRequest, InventoryItem, Warehouse,
    DispatchOrder, NGOPartnerAssignment, AuditLog, Notification, GISLocation,
    ROLES,
)


PERMISSION_MAP = {
    "ROLE_ADMIN": [
        "citizen:read", "citizen:create", "citizen:update",
        "beneficiary:read", "beneficiary:verify",
        "relief:read", "relief:approve",
        "payment:read", "payment:approve",
        "inventory:read", "inventory:dispatch",
        "geo:read", "geo:manage",
        "audit:read", "admin:manage", "report:read", "ai:generate",
    ],
    "ROLE_DISASTER_MANAGER": [
        "citizen:read", "beneficiary:read", "relief:read", "relief:approve",
        "report:read", "geo:read", "audit:read",
    ],
    "ROLE_FIELD_OFFICER": [
        "citizen:read", "citizen:create", "citizen:update", "beneficiary:read", "geo:read",
    ],
    "ROLE_VERIFIER": [
        "citizen:read", "beneficiary:read", "beneficiary:verify", "report:read",
    ],
    "ROLE_PROGRAM_MANAGER": [
        "citizen:read", "beneficiary:read", "relief:read", "relief:approve",
        "report:read", "geo:read", "inventory:read",
    ],
    "ROLE_FINANCE_OFFICER": [
        "payment:read", "payment:approve", "citizen:read", "beneficiary:read", "report:read",
    ],
    "ROLE_WAREHOUSE_OFFICER": [
        "inventory:read", "inventory:dispatch", "report:read",
    ],
    "ROLE_GIS_OFFICER": [
        "geo:read", "geo:manage",
    ],
    "ROLE_NGO_PARTNER": [
        "citizen:read", "beneficiary:read", "relief:read", "geo:read",
    ],
    "ROLE_AUDITOR": [
        "audit:read", "report:read", "citizen:read", "beneficiary:read",
        "relief:read", "payment:read", "inventory:read", "geo:read",
    ],
    "ROLE_CITIZEN": [
        "citizen:read", "citizen:create",
    ],
}

ALL_PERMISSION_CODENAMES = [
    "citizen:read", "citizen:create", "citizen:update",
    "beneficiary:read", "beneficiary:verify",
    "relief:read", "relief:approve",
    "payment:read", "payment:approve",
    "inventory:read", "inventory:dispatch",
    "geo:read", "geo:manage",
    "audit:read", "admin:manage", "report:read", "ai:generate",
]

DISTRICTS = [
    "Colombo", "Galle", "Matara", "Hambantota", "Trincomalee",
    "Batticaloa", "Ampara", "Jaffna", "Kandy", "Kurunegala",
    "Anuradhapura", "Polonnaruwa", "Ratnapura", "Kegalle", "Badulla",
]

DS_DIVISIONS = [
    "Divisional Secretariat A", "Divisional Secretariat B",
    "Divisional Secretariat C", "Divisional Secretariat D",
    "Divisional Secretariat E",
]

GN_DIVISIONS = [
    "Grama Niladhari 01", "Grama Niladhari 02", "Grama Niladhari 03",
    "Grama Niladhari 04", "Grama Niladhari 05",
]


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # === ROLES ===
        print("Seeding roles...")
        role_objs = {}
        for role_name in ROLES:
            existing = db.query(Role).filter(Role.name == role_name).first()
            if existing:
                role_objs[role_name] = existing
            else:
                role_obj = Role(
                    id=str(uuid4()),
                    name=role_name,
                    description=f"{role_name.replace('ROLE_', '').replace('_', ' ').title()} Role",
                )
                db.add(role_obj)
                db.flush()
                role_objs[role_name] = role_obj

        # === PERMISSIONS ===
        print("Seeding permissions...")
        permission_objs = {}
        for codename in ALL_PERMISSION_CODENAMES:
            existing = db.query(Permission).filter(Permission.codename == codename).first()
            if existing:
                permission_objs[codename] = existing
            else:
                perm = Permission(
                    id=str(uuid4()),
                    codename=codename,
                    name=codename.replace(":", " - ").title(),
                    description=f"Permission to {codename.replace(':', ' ')}",
                )
                db.add(perm)
                db.flush()
                permission_objs[codename] = perm

        # === ROLE-PERMISSION MAPPING ===
        print("Seeding role-permission mappings...")
        for role_name, perm_codenames in PERMISSION_MAP.items():
            role_obj = role_objs.get(role_name)
            if not role_obj:
                continue
            for codename in perm_codenames:
                perm_obj = permission_objs.get(codename)
                if not perm_obj:
                    continue
                existing = db.query(RolePermission).filter(
                    RolePermission.role_id == role_obj.id,
                    RolePermission.permission_id == perm_obj.id,
                ).first()
                if not existing:
                    rp = RolePermission(role_id=role_obj.id, permission_id=perm_obj.id)
                    db.add(rp)

        db.flush()

        # === DEMO USERS ===
        print("Seeding users...")
        demo_password = "Demo@12345"
        demo_users = [
            {
                "email": "admin@govrecover.local",
                "password": demo_password,
                "full_name": "System Administrator",
                "role": "ROLE_ADMIN",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Administration",
            },
            {
                "email": "disaster-manager@govrecover.local",
                "password": demo_password,
                "full_name": "Disaster Manager",
                "role": "ROLE_DISASTER_MANAGER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Disaster Management",
            },
            {
                "email": "field@govrecover.local",
                "password": demo_password,
                "full_name": "Field Officer Kamal",
                "role": "ROLE_FIELD_OFFICER",
                "district": "Galle",
                "organization": "NDMC",
                "department": "Field Operations",
                "assigned_region": "Southern Province",
            },
            {
                "email": "field2@govrecover.local",
                "password": demo_password,
                "full_name": "Field Officer Nimal",
                "role": "ROLE_FIELD_OFFICER",
                "district": "Matara",
                "organization": "NDMC",
                "department": "Field Operations",
                "assigned_region": "Southern Province",
            },
            {
                "email": "verifier@govrecover.local",
                "password": demo_password,
                "full_name": "Verifier Priya",
                "role": "ROLE_VERIFIER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Verification",
            },
            {
                "email": "manager@govrecover.local",
                "password": demo_password,
                "full_name": "Program Manager Sampath",
                "role": "ROLE_PROGRAM_MANAGER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Program Management",
            },
            {
                "email": "finance@govrecover.local",
                "password": demo_password,
                "full_name": "Finance Officer Dinesh",
                "role": "ROLE_FINANCE_OFFICER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Finance",
            },
            {
                "email": "warehouse@govrecover.local",
                "password": demo_password,
                "full_name": "Warehouse Officer Sunil",
                "role": "ROLE_WAREHOUSE_OFFICER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "Logistics",
            },
            {
                "email": "gis@govrecover.local",
                "password": demo_password,
                "full_name": "GIS Officer Chathura",
                "role": "ROLE_GIS_OFFICER",
                "district": "Colombo",
                "organization": "NDMC",
                "department": "GIS",
            },
            {
                "email": "ngo@govrecover.local",
                "password": demo_password,
                "full_name": "NGO Partner - Red Cross",
                "role": "ROLE_NGO_PARTNER",
                "district": "Colombo",
                "organization": "Red Cross",
            },
            {
                "email": "auditor@govrecover.local",
                "password": demo_password,
                "full_name": "Auditor Kusum",
                "role": "ROLE_AUDITOR",
                "district": "Colombo",
                "organization": "Audit Department",
                "department": "Internal Audit",
            },
            {
                "email": "citizen@govrecover.local",
                "password": demo_password,
                "full_name": "Wijesinghe Family",
                "role": "ROLE_CITIZEN",
                "district": "Galle",
            },
            {
                "email": "citizen2@govrecover.local",
                "password": demo_password,
                "full_name": "Fernando Family",
                "role": "ROLE_CITIZEN",
                "district": "Matara",
            },
        ]

        user_ids = {}
        for u_data in demo_users:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            role_obj = role_objs.get(u_data["role"])
            if existing:
                existing.password_hash = hash_password(u_data["password"])
                existing.full_name = u_data["full_name"]
                existing.role = u_data["role"]
                existing.role_id = role_obj.id if role_obj else None
                existing.district = u_data.get("district")
                existing.organization = u_data.get("organization")
                existing.department = u_data.get("department")
                existing.assigned_region = u_data.get("assigned_region")
                existing.is_active = True
                user_ids[existing.email] = existing.id
                continue
            user = User(
                id=str(uuid4()),
                email=u_data["email"],
                password_hash=hash_password(u_data["password"]),
                full_name=u_data["full_name"],
                role=u_data["role"],
                role_id=role_obj.id if role_obj else None,
                district=u_data.get("district"),
                organization=u_data.get("organization"),
                department=u_data.get("department"),
                assigned_region=u_data.get("assigned_region"),
                is_active=True,
            )
            db.add(user)
            db.flush()
            user_ids[user.email] = user.id

        # === DISASTER EVENT ===
        print("Seeding disaster event...")
        disaster = db.query(DisasterEvent).first()
        if not disaster:
            disaster = DisasterEvent(
                id=str(uuid4()),
                name="Southwest Monsoon Floods 2024",
                description="Severe flooding affecting Southern and Eastern provinces "
                           "due to heavy monsoon rains. Multiple districts affected with "
                           "widespread damage to homes and infrastructure.",
                disaster_type="FLOOD",
                severity="SEVERE",
                status="ACTIVE",
                start_date=datetime(2024, 5, 15),
                end_date=datetime(2024, 6, 30),
                affected_districts=["Galle", "Matara", "Hambantota", "Trincomalee", "Batticaloa"],
                created_by_user_id=user_ids.get("admin@govrecover.local"),
            )
            db.add(disaster)
            db.flush()

        disaster_id = disaster.id

        # === DISASTER ZONES ===
        print("Seeding disaster zones...")
        if db.query(DisasterZone).count() == 0:
            zones = [
                DisasterZone(id=str(uuid4()), disaster_event_id=disaster_id, name="Galle Flood Zone A",
                             zone_type="FLOOD_ZONE", geometry='{"type":"Polygon","coordinates":[[[80.2,6.0],[80.3,6.0],[80.3,6.1],[80.2,6.1],[80.2,6.0]]]}',
                             risk_level="HIGH", area_km2=45.5, estimated_population=12000),
                DisasterZone(id=str(uuid4()), disaster_event_id=disaster_id, name="Matara Flood Zone B",
                             zone_type="FLOOD_ZONE", geometry='{"type":"Polygon","coordinates":[[[80.5,5.9],[80.6,5.9],[80.6,6.0],[80.5,6.0],[80.5,5.9]]]}',
                             risk_level="HIGH", area_km2=38.2, estimated_population=9500),
                DisasterZone(id=str(uuid4()), disaster_event_id=disaster_id, name="Main Shelter - Galle",
                             zone_type="SHELTER", geometry='{"type":"Point","coordinates":[80.25,6.05]}',
                             risk_level="MEDIUM", area_km2=2.0, estimated_population=2500),
                DisasterZone(id=str(uuid4()), disaster_event_id=disaster_id, name="Distribution Point A",
                             zone_type="DISTRIBUTION_POINT", geometry='{"type":"Point","coordinates":[80.28,6.03]}',
                             risk_level="LOW", area_km2=0.5, estimated_population=5000),
            ]
            for z in zones:
                db.add(z)
            db.flush()

        # === WAREHOUSES ===
        print("Seeding warehouses...")
        warehouse_ids = {}
        if db.query(Warehouse).count() == 0:
            warehouse_data = [
                ("Central Warehouse - Colombo", "Colombo Port Area", "Colombo", 50000, 35000,
                 "Sunil Perera", "011-2345678"),
                ("Southern Regional Warehouse", "Galle City", "Galle", 25000, 18000,
                 "Mahinda Silva", "091-2345678"),
                ("Eastern Regional Warehouse", "Trincomalee", "Trincomalee", 20000, 12000,
                 "Sivakumar Krishnan", "026-2345678"),
                ("Emergency Response Hub - Matara", "Matara City", "Matara", 15000, 8000,
                 "Priyantha Jayasuriya", "041-2345678"),
            ]
            for name, loc, dist, cap, occ, contact, phone in warehouse_data:
                w = Warehouse(
                    id=str(uuid4()), name=name, location=loc, district=dist,
                    capacity=cap, current_occupancy=occ,
                    contact_person=contact, contact_phone=phone,
                )
                db.add(w)
                db.flush()
                warehouse_ids[name] = w.id

        # === INVENTORY ITEMS ===
        print("Seeding inventory items...")
        if db.query(InventoryItem).count() == 0:
            items = [
                ("Rice (25kg bag)", "RICE-001", "Food", "Bags", 5000, 500, "Central Warehouse - Colombo"),
                ("Dhal (1kg pack)", "DHAL-001", "Food", "Packs", 10000, 1000, "Central Warehouse - Colombo"),
                ("Cooking Oil (1L)", "OIL-001", "Food", "Bottles", 3000, 500, "Central Warehouse - Colombo"),
                ("Drinking Water (1.5L)", "WATER-001", "Water", "Bottles", 20000, 2000, "Southern Regional Warehouse"),
                ("Tent (Family Size)", "TENT-001", "Shelter", "Units", 500, 100, "Southern Regional Warehouse"),
                ("Blanket", "BLANKET-001", "Relief", "Units", 3000, 500, "Southern Regional Warehouse"),
                ("First Aid Kit", "MED-001", "Medical", "Kits", 1000, 200, "Central Warehouse - Colombo"),
                ("Mosquito Net", "NET-001", "Relief", "Units", 5000, 500, "Eastern Regional Warehouse"),
                ("Tarpaulin Sheet", "TARP-001", "Shelter", "Sheets", 2000, 300, "Eastern Regional Warehouse"),
                ("Dry Ration Pack", "DRP-001", "Food", "Packs", 3000, 500, "Emergency Response Hub - Matara"),
                ("Soap (Pack of 3)", "SOAP-001", "Hygiene", "Packs", 8000, 1000, "Central Warehouse - Colombo"),
                ("Sanitary Pads (Pack)", "SAN-001", "Hygiene", "Packs", 5000, 500, "Southern Regional Warehouse"),
            ]
            for name, sku, cat, unit, qty, reorder, wh_name in items:
                wh_id = warehouse_ids.get(wh_name)
                item = InventoryItem(
                    id=str(uuid4()), name=name, sku=sku, category=cat,
                    unit=unit, quantity_available=qty, reorder_level=reorder,
                    warehouse_id=wh_id,
                )
                db.add(item)
            db.flush()

        # === GIS LOCATIONS (SHELTERS) ===
        print("Seeding GIS locations...")
        if db.query(GISLocation).count() == 0:
            shelters = [
                ("Galle City Hall Shelter", "SHELTER", 6.0367, 80.2170, "Galle",
                 {"capacity": 500, "contact": "Galle Municipal Council", "facilities": ["washrooms", "kitchen", "medical_room"]}),
                ("Riverside School Shelter", "SHELTER", 6.0450, 80.2100, "Galle",
                 {"capacity": 300, "contact": "Education Department", "facilities": ["washrooms", "classrooms"]}),
                ("Matara Central College Shelter", "SHELTER", 5.9485, 80.5428, "Matara",
                 {"capacity": 400, "contact": "Matara Education Office", "facilities": ["washrooms", "kitchen"]}),
                ("Hambantota Community Center", "SHELTER", 6.1240, 81.1200, "Hambantota",
                 {"capacity": 250, "contact": "Hambantota Pradeshiya Sabha", "facilities": ["washrooms", "hall"]}),
                ("Trincomalee Town Hall", "SHELTER", 8.5711, 81.2335, "Trincomalee",
                 {"capacity": 350, "contact": "Trincomalee Urban Council", "facilities": ["washrooms", "kitchen", "medical_room"]}),
                ("Batticaloa Public Library", "SHELTER", 7.7170, 81.7000, "Batticaloa",
                 {"capacity": 200, "contact": "Batticaloa Municipal Council", "facilities": ["washrooms"]}),
            ]
            for name, ltype, lat, lon, dist, props in shelters:
                loc = GISLocation(
                    id=str(uuid4()), name=name, location_type=ltype,
                    latitude=lat, longitude=lon, district=dist,
                    disaster_event_id=disaster_id, properties_json=props,
                )
                db.add(loc)
            db.flush()

        # === 30 HOUSEHOLDS ===
        print("Seeding 30 households...")
        if db.query(Household).count() == 0:
            first_names = ["Nimal", "Sunil", "Priya", "Kamala", "Saman", "Dilani", "Anura", "Champa",
                          "Ranjan", "Kumari", "Upali", "Sujeewa", "Ajith", "Damayanthi", "Rohan",
                          "Mala", "Asanka", "Deepani", "Sujeewa", "Indika", "Lal", "Nishantha",
                          "Chandana", "Jayantha", "Bandula", "Kusum", "Prasanna", "Sampath", "Gamini", "Hemantha"]
            last_names = ["Perera", "Silva", "Fernando", "Jayawardena", "Wickramasinghe",
                         "Bandara", "Kumara", "Rajapaksa", "Herath", "Dissanayake",
                         "Senanayake", "Weerasinghe", "Gunawardena", "Rathnayake", "Samarasinghe"]

            field_officer_id = user_ids.get("field@govrecover.local")
            field_officer2_id = user_ids.get("field2@govrecover.local")

            for i in range(30):
                fname = first_names[i]
                lname = choice(last_names)
                district = choice(["Galle", "Matara", "Hambantota", "Trincomalee", "Batticaloa"])
                damage_level = choice(["MINOR", "MODERATE", "SEVERE", "TOTAL"])
                family_size = randint(1, 8)
                reg_user = choice([field_officer_id, field_officer2_id])
                if i < 5:
                    reg_user = user_ids.get("citizen@govrecover.local")

                h = Household(
                    id=str(uuid4()),
                    head_full_name=f"{fname} {lname}",
                    head_nic=f"{randint(800000000, 999999999)}V",
                    head_phone=f"0{choice(['71','72','77','91','41'])}-{randint(1000000,9999999)}",
                    district=district,
                    ds_division=choice(DS_DIVISIONS),
                    gn_division=choice(GN_DIVISIONS),
                    address=f"{randint(1,500)}/{randint(1,100)}, {district}",
                    family_size=family_size,
                    damage_level=damage_level,
                    damage_description=f"Household affected by floods. Damage level: {damage_level}. "
                                       f"Family of {family_size} requires assistance.",
                    latitude=6.0 + uniform(-0.5, 0.5),
                    longitude=80.2 + uniform(-0.3, 0.3),
                    status="REGISTERED" if i < 10 else "ASSESSED",
                    registered_by_user_id=reg_user,
                    disaster_event_id=disaster_id,
                )
                db.add(h)
            db.flush()

        # === DAMAGE ASSESSMENTS ===
        print("Seeding damage assessments...")
        if db.query(DamageAssessment).count() == 0:
            households = db.query(Household).all()
            field_officer_id = user_ids.get("field@govrecover.local")
            for i, h in enumerate(households[10:], 10):
                dl = h.damage_level or choice(["MINOR", "MODERATE", "SEVERE", "TOTAL"])
                score_map = {"MINOR": (10, 30), "MODERATE": (31, 60), "SEVERE": (61, 85), "TOTAL": (86, 100)}
                sd_range = score_map.get(dl, (10, 50))
                da = DamageAssessment(
                    id=str(uuid4()),
                    household_id=h.id,
                    field_officer_id=field_officer_id,
                    damage_level=dl,
                    structural_damage_score=randint(sd_range[0], sd_range[1]),
                    content_loss_score=randint(sd_range[0], sd_range[1]),
                    casualties=randint(0, 2),
                    injuries=randint(0, 5),
                    notes=f"Assessment completed. Damage level: {dl}. "
                           f"Structural damage: {sd_range[0]}% - {sd_range[1]}%.",
                )
                db.add(da)
            db.flush()

        # === RELIEF APPLICATIONS ===
        print("Seeding relief applications...")
        if db.query(ReliefApplication).count() == 0:
            households = db.query(Household).all()
            items_options = [
                ["Food Pack", "Water Bottle", "Tent"],
                ["Food Pack", "Blanket", "First Aid Kit"],
                ["Water Bottle", "Tarpaulin Sheet", "Mosquito Net"],
                ["Dry Ration Pack", "Cooking Oil", "Soap"],
                ["Tent", "Blanket", "Drinking Water", "First Aid Kit"],
                ["Food Pack", "Water Bottle"],
            ]
            status_cycle = ["DRAFT", "SUBMITTED", "UNDER_VERIFICATION", "VERIFIED",
                           "APPROVED_FOR_RELIEF", "PAYMENT_PENDING", "PAYMENT_APPROVED",
                           "DISPATCHED", "COMPLETED"]
            for i, h in enumerate(households):
                if i >= 20:
                    break
                status = status_cycle[min(i, len(status_cycle) - 1)]
                app = ReliefApplication(
                    id=str(uuid4()),
                    household_id=h.id,
                    disaster_event_id=disaster_id,
                    applicant_user_id=h.registered_by_user_id,
                    required_items=choice(items_options),
                    status=status,
                    submitted_at=datetime.utcnow() - timedelta(days=randint(1, 20)),
                    created_at=datetime.utcnow() - timedelta(days=randint(1, 25)),
                )
                if status in ("VERIFIED", "APPROVED_FOR_RELIEF", "PAYMENT_PENDING",
                              "PAYMENT_APPROVED", "DISPATCHED", "COMPLETED"):
                    app.verified_by_user_id = user_ids.get("verifier@govrecover.local")
                    app.verified_at = datetime.utcnow() - timedelta(days=randint(1, 10))
                if status in ("APPROVED_FOR_RELIEF", "PAYMENT_PENDING", "PAYMENT_APPROVED",
                              "DISPATCHED", "COMPLETED"):
                    app.approved_by_user_id = user_ids.get("manager@govrecover.local")
                    app.approved_at = datetime.utcnow() - timedelta(days=randint(1, 7))
                db.add(app)
            db.flush()

        # === BENEFICIARY VERIFICATIONS ===
        print("Seeding verifications...")
        if db.query(BeneficiaryVerification).count() == 0:
            verified_apps = db.query(ReliefApplication).filter(
                ReliefApplication.status.in_(["VERIFIED", "APPROVED_FOR_RELIEF", "PAYMENT_PENDING",
                                            "PAYMENT_APPROVED", "DISPATCHED", "COMPLETED"])
            ).all()
            verifier_id = user_ids.get("verifier@govrecover.local")
            for app in verified_apps:
                bv = BeneficiaryVerification(
                    id=str(uuid4()),
                    relief_application_id=app.id,
                    verifier_id=verifier_id,
                    verification_status="PASSED",
                    verification_notes="Identity verified. Documentation complete. Eligible for relief.",
                    verified_at=app.verified_at,
                )
                db.add(bv)
            db.flush()

        # === RELIEF PROGRAMS ===
        print("Seeding relief programs...")
        if db.query(ReliefProgram).count() == 0:
            programs = [
                ("Emergency Food Distribution", "Distribution of dry ration packs and water to affected families",
                 5000000.0, "LKR", "ACTIVE"),
                ("Shelter Restoration Program", "Providing tarpaulin sheets, tents, and shelter materials",
                 8000000.0, "LKR", "ACTIVE"),
                ("Medical Assistance Program", "First aid kits and medical supplies for affected communities",
                 3000000.0, "LKR", "ACTIVE"),
            ]
            for name, desc, budget, currency, status in programs:
                rp = ReliefProgram(
                    id=str(uuid4()), name=name, description=desc,
                    disaster_event_id=disaster_id, budget=budget, currency=currency,
                    start_date=datetime(2024, 6, 1), end_date=datetime(2024, 9, 30),
                    status=status, created_by_user_id=user_ids.get("manager@govrecover.local"),
                )
                db.add(rp)
            db.flush()

        # === RELIEF PACKAGES ===
        print("Seeding relief packages...")
        if db.query(ReliefPackage).count() == 0:
            programs = db.query(ReliefProgram).all()
            for prog in programs:
                if "Food" in prog.name:
                    rp = ReliefPackage(
                        id=str(uuid4()), relief_program_id=prog.id,
                        name="Essential Food Pack",
                        items_json={
                            "Rice (5kg)": 1, "Dhal (1kg)": 2, "Cooking Oil (1L)": 1,
                            "Sugar (500g)": 1, "Tea (100g)": 1, "Salt (500g)": 1,
                        },
                        total_value=4500.0,
                    )
                    db.add(rp)
                elif "Shelter" in prog.name:
                    rp = ReliefPackage(
                        id=str(uuid4()), relief_program_id=prog.id,
                        name="Shelter Kit",
                        items_json={
                            "Tarpaulin Sheet (4x5m)": 2, "Tent (Family)": 1,
                            "Blanket": 4, "Mosquito Net": 4, "Rope (50m)": 1,
                        },
                        total_value=12500.0,
                    )
                    db.add(rp)
                elif "Medical" in prog.name:
                    rp = ReliefPackage(
                        id=str(uuid4()), relief_program_id=prog.id,
                        name="Family Medical Kit",
                        items_json={
                            "First Aid Kit": 1, "Pain Reliever": 2, "Antiseptic": 1,
                            "Bandages (Pack)": 2, "Oral Rehydration Salts (Pack)": 5,
                        },
                        total_value=3500.0,
                    )
                    db.add(rp)
            db.flush()

        # === PAYMENT REQUESTS ===
        print("Seeding payment requests...")
        if db.query(PaymentRequest).count() == 0:
            approved_apps = db.query(ReliefApplication).filter(
                ReliefApplication.status.in_(["APPROVED_FOR_RELIEF", "PAYMENT_PENDING",
                                            "PAYMENT_APPROVED", "DISPATCHED", "COMPLETED"])
            ).all()
            for app in approved_apps:
                pr = PaymentRequest(
                    id=str(uuid4()),
                    relief_application_id=app.id,
                    household_id=app.household_id,
                    amount=round(uniform(10000, 50000), 2),
                    currency="LKR",
                    payment_type=choice(["CASH", "VOUCHER", "BANK_TRANSFER"]),
                    status=choice(["PENDING", "PAYMENT_APPROVED"]),
                    created_at=datetime.utcnow() - timedelta(days=randint(1, 10)),
                )
                if pr.status == "PAYMENT_APPROVED":
                    pr.approved_by_user_id = user_ids.get("finance@govrecover.local")
                    pr.approved_at = datetime.utcnow() - timedelta(days=randint(1, 5))
                db.add(pr)
            db.flush()

        # === DISPATCH ORDERS ===
        print("Seeding dispatch orders...")
        if db.query(DispatchOrder).count() == 0:
            warehouse_list = db.query(Warehouse).all()
            approved_apps = db.query(ReliefApplication).filter(
                ReliefApplication.status.in_(["DISPATCHED", "COMPLETED"])
            ).all()
            for app in approved_apps:
                wh = choice(warehouse_list)
                do = DispatchOrder(
                    id=str(uuid4()),
                    relief_application_id=app.id,
                    warehouse_id=wh.id,
                    assigned_ngo_id=user_ids.get("ngo@govrecover.local"),
                    items_json={
                        "Food Pack": 2, "Water Bottle (1.5L)": 6, "Blanket": 2,
                    },
                    status=choice(["DELIVERED", "IN_TRANSIT"]),
                    dispatched_by_user_id=user_ids.get("warehouse@govrecover.local"),
                    dispatched_at=datetime.utcnow() - timedelta(days=randint(5, 15)),
                    notes="Priority delivery to affected family",
                )
                if do.status == "DELIVERED":
                    do.delivered_at = datetime.utcnow() - timedelta(days=randint(1, 5))
                db.add(do)
            db.flush()

        # === NGO PARTNER ASSIGNMENTS ===
        print("Seeding NGO assignments...")
        if db.query(NGOPartnerAssignment).count() == 0:
            dispatch_orders = db.query(DispatchOrder).all()
            ngo_user_id = user_ids.get("ngo@govrecover.local")
            admin_id = user_ids.get("admin@govrecover.local")
            for do in dispatch_orders:
                ngo = NGOPartnerAssignment(
                    id=str(uuid4()),
                    ngo_user_id=ngo_user_id,
                    relief_application_id=do.relief_application_id,
                    task_description=f"Deliver relief items to household associated with dispatch order {do.id}",
                    status=choice(["ASSIGNED", "IN_PROGRESS", "COMPLETED"]),
                    assigned_by_user_id=admin_id,
                    assigned_at=datetime.utcnow() - timedelta(days=randint(5, 15)),
                )
                if ngo.status == "COMPLETED":
                    ngo.completed_at = datetime.utcnow() - timedelta(days=randint(1, 5))
                db.add(ngo)
            db.flush()

        # === AUDIT LOGS ===
        print("Seeding audit logs...")
        if db.query(AuditLog).count() == 0:
            actions = ["CREATE", "UPDATE", "READ", "LOGIN"]
            resources = ["household", "disaster_event", "relief_application", "user", "payment"]
            for i in range(30):
                log = AuditLog(
                    id=str(uuid4()),
                    user_id=choice(list(user_ids.values())),
                    user_email=choice(list(user_ids.keys())),
                    user_role=choice(ROLES),
                    action=choice(actions),
                    resource_type=choice(resources),
                    resource_id=str(uuid4()),
                    details={"simulated": True, "description": f"Audit log entry {i+1}"},
                    ip_address=f"192.168.1.{randint(1, 255)}",
                    created_at=datetime.utcnow() - timedelta(days=randint(0, 30)),
                )
                db.add(log)
            db.flush()

        # === NOTIFICATIONS ===
        print("Seeding notifications...")
        if db.query(Notification).count() == 0:
            notification_templates = [
                ("Relief Application Submitted", "Your relief application has been submitted successfully."),
                ("Application Verified", "Your relief application has been verified by the verification officer."),
                ("Relief Approved", "Your application has been approved for relief distribution."),
                ("Payment Processed", "Your relief payment has been processed."),
                ("Dispatch Initiated", "Your relief package has been dispatched."),
                ("New Disaster Alert", "A new disaster event has been reported in your area."),
                ("Assessment Scheduled", "A field officer has been scheduled to assess your property damage."),
            ]
            for user_id in list(user_ids.values())[:5]:
                for _ in range(3):
                    title, msg = choice(notification_templates)
                    notif = Notification(
                        id=str(uuid4()),
                        user_id=user_id,
                        title=title,
                        message=msg,
                        type=choice(["INFO", "ALERT", "UPDATE"]),
                        is_read=choice([True, False]),
                        created_at=datetime.utcnow() - timedelta(days=randint(0, 15)),
                    )
                    db.add(notif)
            db.flush()

        db.commit()
        print("Seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
