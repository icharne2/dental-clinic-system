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
from datetime import datetime

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


# --- MODELE PYDANTIC ---

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class DentistCreate(BaseModel):
    first_name: str
    last_name: str
    specialization: str
    email: Optional[str] = "nie podano"
    phone_number: Optional[str] = "nie podano"


class SlotCreate(BaseModel):
    dentist_id: int
    slot_date: str
    start_time: str
    # service_id jest teraz opcjonalny - domyślnie "Konsultacja"
    service_id: Optional[str] = "Konsultacja"


class ServiceCreate(BaseModel):
    dentist_id: int
    name: str
    price: int


# --- FUNKCJE POMOCNICZE ---

def verify_password(plain, hashed):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.strip().encode('utf-8'))


def get_current_user_id(authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except:
        raise HTTPException(status_code=401)


def get_current_admin(authorization: Optional[str] = Header(None)):
    if not authorization: raise HTTPException(status_code=401)
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != 'admin': raise HTTPException(status_code=403)
        return payload
    except:
        raise HTTPException(status_code=401)


# --- PACJENT (APP/PAGE) ---

@app.get("/dentists")
def get_dentists():
    conn = get_db_connection()
    cur = conn.cursor()
    # Pobieranie lekarzy wraz z ich stałymi usługami z cennika (json_agg)
    query = """
        SELECT d.id, d.first_name, d.last_name, d.specialization, d.email, d.phone_number,
        COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'price', s.price))
                  FROM services s JOIN dentist_services ds ON s.id = ds.service_id 
                  WHERE ds.dentist_id = d.id), '[]') as services
        FROM dentists d;
    """
    cur.execute(query)
    res = cur.fetchall()
    cur.close();
    conn.close()
    return res


@app.get("/slots")
def get_slots():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Usuwamy stare terminy (z tabeli slotów)
        cur.execute("DELETE FROM available_slots WHERE slot_date < CURRENT_DATE;")
        conn.commit()

        cur.execute("""
            SELECT s.id, s.slot_date, s.start_time, s.dentist_id, d.last_name as dentist_name, 
                   COALESCE(s.service_name, 'Konsultacja') as type
            FROM available_slots s JOIN dentists d ON s.dentist_id = d.id
            WHERE s.is_available = TRUE
            ORDER BY s.slot_date ASC, s.start_time ASC;
        """)
        res = cur.fetchall()
        for r in res:
            r['slot_date'], r['start_time'] = str(r['slot_date']), str(r['start_time'])
        return res
    finally:
        cur.close(); conn.close()


@app.post("/book/{slot_id}")
def book_appointment(slot_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT dentist_id, service_name FROM available_slots WHERE id = %s AND is_available = TRUE;",
                    (slot_id,))
        slot = cur.fetchone()
        if not slot: return {"error": "Zajęte"}

        cur.execute("UPDATE available_slots SET is_available = FALSE WHERE id = %s;", (slot_id,))
        cur.execute("""
            INSERT INTO appointments (user_id, dentist_id, slot_id, status, custom_service) 
            VALUES (%s, %s, %s, 'booked', %s);
        """, (user_id, slot['dentist_id'], slot_id, slot.get('service_name', 'Konsultacja')))

        conn.commit()
        return {"message": "OK"}
    finally:
        cur.close(); conn.close()


@app.get("/appointments")
def get_appointments(user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # KLUCZOWY MOMENT: Czyścimy też stare ZAREZERWOWANE wizyty
        # Usuwamy wizyty, których termin (w powiązanej tabeli slotów) już minął
        cur.execute("""
            DELETE FROM appointments 
            WHERE slot_id IN (SELECT id FROM available_slots WHERE slot_date < CURRENT_DATE);
        """)
        conn.commit()

        cur.execute("""
            SELECT a.id, a.slot_id, d.last_name as dentist_name, s.slot_date, s.start_time, a.status
            FROM appointments a
            JOIN dentists d ON a.dentist_id = d.id
            JOIN available_slots s ON a.slot_id = s.id
            WHERE a.user_id = %s
            ORDER BY s.slot_date ASC;
        """, (user_id,))
        res = cur.fetchall()
        for r in res:
            r['slot_date'], r['start_time'] = str(r['slot_date']), str(r['start_time'])
        return res
    finally:
        cur.close(); conn.close()

@app.delete("/cancel/{appointment_id}/{slot_id}")
def cancel_appointment(appointment_id: int, slot_id: int, user_id: int = Depends(get_current_user_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM appointments WHERE id = %s AND user_id = %s;", (appointment_id, user_id))
        cur.execute("UPDATE available_slots SET is_available = TRUE WHERE id = %s;", (slot_id,))
        conn.commit()
        return {"message": "OK"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close(); conn.close()


# --- ADMIN (ADMIN/PAGE) ---

@app.post("/admin/dentists")
def admin_add_dentist(dentist: DentistCreate, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO dentists (first_name, last_name, specialization, email, phone_number) 
            VALUES (%s, %s, %s, %s, %s)
        """, (dentist.first_name, dentist.last_name, dentist.specialization, dentist.email, dentist.phone_number))
        conn.commit()
        return {"message": "OK"}
    finally:
        cur.close(); conn.close()


@app.post("/admin/slots")
def admin_add_slot(slot: SlotCreate, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # --- WALIDACJA DATY ---
        # Łączymy datę i czas w jeden obiekt, żeby porównać z "teraz"
        try:
            slot_dt = datetime.strptime(f"{slot.slot_date} {slot.start_time}", "%Y-%m-%d %H:%M")
            if slot_dt < datetime.now():
                raise HTTPException(status_code=400, detail="Nie można dodać terminu w przeszłości.")
        except ValueError:
            raise HTTPException(status_code=400, detail="Nieprawidłowy format daty lub godziny.")
        # ---------------------------

        cur.execute("""
            INSERT INTO available_slots (dentist_id, slot_date, start_time, end_time, is_available, service_name) 
            VALUES (%s, %s, %s, (%s::time + interval '30 minutes'), TRUE, %s)
        """, (slot.dentist_id, slot.slot_date, slot.start_time, slot.start_time, slot.service_id))
        conn.commit()
        return {"message": "OK"}
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally: cur.close(); conn.close()


@app.post("/admin/services")
def admin_add_service(service: ServiceCreate, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO services (name, price) VALUES (%s, %s) RETURNING id;", (service.name, service.price))
        new_id = cur.fetchone()['id']
        cur.execute("INSERT INTO dentist_services (dentist_id, service_id) VALUES (%s, %s);",
                    (service.dentist_id, new_id))
        conn.commit()
        return {"message": "OK"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close(); conn.close()


@app.delete("/admin/services/{service_id}")
def admin_delete_service(service_id: int, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM dentist_services WHERE service_id = %s;", (service_id,))
        cur.execute("DELETE FROM services WHERE id = %s;", (service_id,))
        conn.commit()
        return {"message": "OK"}
    finally:
        cur.close(); conn.close()


@app.get("/admin/appointments")
def admin_get_all(admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Admin też sprząta przy okazji zaglądania do wizyt
        cur.execute("""
            DELETE FROM appointments 
            WHERE slot_id IN (SELECT id FROM available_slots WHERE slot_date < CURRENT_DATE);
        """)
        conn.commit()

        cur.execute("""
            SELECT a.id, a.slot_id, (u.first_name || ' ' || u.last_name) as patient_name, d.last_name as dentist_name, 
                   s.slot_date, s.start_time, a.status, COALESCE(a.custom_service, s.service_name, 'Konsultacja') as service_name
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            JOIN dentists d ON a.dentist_id = d.id
            JOIN available_slots s ON a.slot_id = s.id
            ORDER BY s.slot_date ASC;
        """)
        res = cur.fetchall()
        for r in res:
            r['slot_date'], r['start_time'] = str(r['slot_date']), str(r['start_time'])
        return res
    finally:
        cur.close(); conn.close()


@app.delete("/admin/cancel/{appointment_id}/{slot_id}")
def admin_cancel(appointment_id: int, slot_id: int, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM appointments WHERE id = %s;", (appointment_id,))
        cur.execute("UPDATE available_slots SET is_available = TRUE WHERE id = %s;", (slot_id,))
        conn.commit()
        return {"message": "OK"}
    finally:
        cur.close(); conn.close()


@app.delete("/admin/dentists/{dentist_id}")
def admin_delete_dentist(dentist_id: int, admin=Depends(get_current_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Usuwamy wizyty powiązane z tym lekarzem
        cur.execute("DELETE FROM appointments WHERE dentist_id = %s;", (dentist_id,))

        # 2. Usuwamy wszystkie sloty (terminy) tego lekarza
        cur.execute("DELETE FROM available_slots WHERE dentist_id = %s;", (dentist_id,))

        # 3. Usuwamy powiązania lekarza z usługami (cennik)
        cur.execute("DELETE FROM dentist_services WHERE dentist_id = %s;", (dentist_id,))

        # 4. Na samym końcu usuwamy samego lekarza
        cur.execute("DELETE FROM dentists WHERE id = %s;", (dentist_id,))

        conn.commit()
        return {"message": "Lekarz oraz wszystkie powiązane dane zostały usunięte."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Błąd podczas usuwania: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(login_data: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, first_name, password_hash, role FROM users WHERE email = %s;", (login_data.email.strip(),))
    user = cur.fetchone()
    if user and verify_password(login_data.password, user['password_hash']):
        token = jwt.encode({"user_id": user['id'], "role": user['role'].strip()}, SECRET_KEY, algorithm="HS256")
        return {"token": token, "role": user['role'].strip(), "name": user['first_name']}
    raise HTTPException(status_code=401)


@app.post("/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Sprawdzamy, czy użytkownik o takim mailu już istnieje
        cur.execute("SELECT id FROM users WHERE email = %s;", (user.email.strip(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Użytkownik o tym adresie e-mail już istnieje.")

        # 2. Haszujemy hasło przed zapisem
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')

        # 3. Dodajemy użytkownika do bazy (domyślnie jako 'patient')
        cur.execute("""
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (%s, %s, %s, %s, 'patient')
        """, (user.first_name, user.last_name, user.email.strip(), hashed_password))

        conn.commit()
        return {"message": "Konto utworzone pomyślnie!"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()