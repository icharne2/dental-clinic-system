from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import jwt
import bcrypt
from pydantic import BaseModel
from typing import Optional

# Ładowanie zmiennych środowiskowych
load_dotenv()
app = FastAPI()

# Konfiguracja zabezpieczeń
SECRET_KEY = "super-tajny-klucz-projektowy"

# Konfiguracja CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Połączenie z bazą danych
def get_db_connection():
    try:
        return psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            cursor_factory=RealDictCursor
        )
    except Exception as e:
        print(f"BŁĄD POŁĄCZENIA Z BAZĄ: {e}")
        return None

# --- FUNKCJE POMOCNICZE ---

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.strip().encode('utf-8'))
    except Exception:
        return False

def get_current_user_id(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak tokena")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")

def get_current_admin(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak tokena")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != 'admin':
            raise HTTPException(status_code=403, detail="Brak uprawnień admina")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- AUTH ---

@app.post("/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        hashed_pwd = get_password_hash(user.password)
        cur.execute("""
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (%s, %s, %s, %s, %s);
        """, (user.first_name, user.last_name, user.email.strip(), hashed_pwd, 'patient'))
        conn.commit()
        return {"message": "Konto utworzone!"}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Użytkownik już istnieje.")
    finally:
        cur.close(); conn.close()

@app.post("/login")
def login(login_data: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor()
    email_clean = login_data.email.strip()
    cur.execute("SELECT id, first_name, password_hash, role FROM users WHERE email = %s;", (email_clean,))
    user = cur.fetchone()
    if user and verify_password(login_data.password, user['password_hash']):
        token = jwt.encode({"user_id": user['id'], "role": user['role'].strip()}, SECRET_KEY, algorithm="HS256")
        return {"token": token, "role": user['role'].strip(), "name": user['first_name']}
    raise HTTPException(status_code=401, detail="Błędny email lub hasło")

# --- KLIENT / PACJENT ---

@app.get("/dentists")
def get_dentists():
    conn = get_db_connection()
    cur = conn.cursor()
    # Pobieramy wszystkie pola opisane w sprawozdaniu [cite: 14-19]
    cur.execute("SELECT id, first_name, last_name, specialization, email, phone_number FROM dentists;")
    res = cur.fetchall()
    cur.close(); conn.close()
    return res

@app.get("/slots")
def get_slots():
    conn = get_db_connection()
    cur = conn.cursor()
    # KLUCZOWA POPRAWKA: Dodano s.dentist_id do zapytania, aby filtrowanie na froncie działało
    query = """
        SELECT s.id, s.slot_date, s.start_time, s.dentist_id, d.last_name as dentist_name 
        FROM available_slots s
        JOIN dentists d ON s.dentist_id = d.id
        WHERE s.is_available = TRUE;
    """
    cur.execute(query)
    slots = cur.fetchall()
    for s in slots:
        s['slot_date'] = str(s['slot_date'])
        s['start_time'] = str(s['start_time'])
    cur.close(); conn.close()
    return slots

@app.post("/book/{slot_id}")
def book_appointment(slot_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT dentist_id FROM available_slots WHERE id = %s AND is_available = TRUE;", (slot_id,))
        slot = cur.fetchone()
        if not slot: return {"error": "Termin zajęty"}
        cur.execute("UPDATE available_slots SET is_available = FALSE WHERE id = %s;", (slot_id,))
        cur.execute("INSERT INTO appointments (user_id, dentist_id, slot_id, status) VALUES (%s, %s, %s, 'scheduled');",
                    (user_id, slot['dentist_id'], slot_id))
        conn.commit()
        return {"message": "Zarezerwowano!"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        cur.close(); conn.close()

@app.get("/appointments")
def get_appointments(user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT a.id, d.last_name as dentist_name, s.slot_date, s.start_time, a.status, a.slot_id
        FROM appointments a
        JOIN dentists d ON a.dentist_id = d.id
        JOIN available_slots s ON a.slot_id = s.id
        WHERE a.user_id = %s;
    """
    cur.execute(query, (user_id,))
    apps = cur.fetchall()
    for a in apps:
        a['slot_date'] = str(a['slot_date'])
        a['start_time'] = str(a['start_time'])
    cur.close(); conn.close()
    return apps

@app.delete("/cancel/{appointment_id}/{slot_id}")
def cancel_appointment(appointment_id: int, slot_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM appointments WHERE id = %s AND user_id = %s;", (appointment_id, user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="Nie możesz anulować cudzej wizyty")

        cur.execute("DELETE FROM appointments WHERE id = %s;", (appointment_id,))
        cur.execute("UPDATE available_slots SET is_available = TRUE WHERE id = %s;", (slot_id,))
        conn.commit()
        return {"message": "Wizyta anulowana."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close(); conn.close()

# --- ADMIN ---

@app.get("/admin/appointments")
def admin_get_all_appointments(admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT a.id, u.last_name as patient_name, d.last_name as dentist_name, 
               s.slot_date, s.start_time, a.status
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN dentists d ON a.dentist_id = d.id
        JOIN available_slots s ON a.slot_id = s.id;
    """
    cur.execute(query)
    res = cur.fetchall()
    for r in res:
        r['slot_date'] = str(r['slot_date'])
        r['start_time'] = str(r['start_time'])
    cur.close(); conn.close()
    return res

@app.post("/admin/dentists")
def admin_add_dentist(first_name: str, last_name: str, specialization: str, email: str, phone_number: str, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO dentists (first_name, last_name, specialization, email, phone_number) 
            VALUES (%s, %s, %s, %s, %s);
        """, (first_name, last_name, specialization, email, phone_number))
        conn.commit()
        return {"message": f"Dodano lekarza: {last_name}"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close(); conn.close()

@app.post("/admin/slots")
def admin_add_slot(dentist_id: int, slot_date: str, start_time: str, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # POPRAWKA: Automatyczne obliczanie end_time (+30 min), aby uniknąć błędu NOT NULL w bazie
        cur.execute("""
            INSERT INTO available_slots (dentist_id, slot_date, start_time, end_time, is_available)
            VALUES (%s, %s, %s, (%s::time + interval '30 minutes'), TRUE);
        """, (dentist_id, slot_date, start_time, start_time))
        conn.commit()
        return {"message": "Dodano wolny termin!"}
    except Exception as e:
        conn.rollback()
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=400, detail="Błąd przy dodawaniu terminu.")
    finally:
        cur.close(); conn.close()