# DSG Smart Reptile IoT System 🦎🌡️

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![Railway](https://img.shields.io/badge/Deployment-Railway-purple.svg)
![IoT](https://img.shields.io/badge/IoT-Smart%20Terrarium-orange.svg)

## 📌 Overview
**DSG Smart Reptile IoT** adalah sistem pemantauan dan pengendalian mikroklimat cerdas untuk kandang reptil (terrarium). Sistem ini dirancang untuk menjaga stabilitas suhu dan kelembaban secara otomatis guna memastikan kesehatan hewan peliharaan eksotis.

Backend sistem ini dibangun menggunakan **Flask** yang berfungsi sebagai REST API untuk menerima data dari perangkat IoT (ESP32/NodeMCU) dan melayani dashboard frontend. Seluruh sistem backend telah di-deploy menggunakan layanan cloud **Railway** untuk aksesibilitas real-time dari mana saja.

## 🚀 Key Features
* **Real-time Monitoring**: Pemantauan suhu dan kelembaban akurat (DHT22/BME280).
* **Predictive Control**: Algoritma cerdas untuk menjaga stabilitas iklim mikro (Microclimate Stability).
* **Remote Automation**: Kontrol otomatis untuk *misting system* (pengkabutan) dan lampu pemanas.
* **RESTful API**: Endpoint JSON yang ringan untuk komunikasi data antara hardware dan web/mobile app.
* **Cloud Deployment**: Hosting stabil dan scalable menggunakan Railway.

## 🛠️ Tech Stack
* **Language**: Python 3.x
* **Framework**: Flask (Backend API)
* **Database**: PostgreSQL / SQLite (via Railway integration)
* **Deployment**: Railway App
* **Hardware (Client)**: ESP32 / ESP8266, DHT Sensors, Relay Modules

## 🔌 API Endpoints
Berikut adalah daftar endpoint utama yang tersedia di API ini:

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Mendapatkan data suhu dan kelembaban terkini |
| `POST` | `/api/sensor` | Mengirim data sensor dari perangkat IoT (ESP32) |
| `POST` | `/api/control/light` | Mengontrol status lampu (ON/OFF) |
| `POST` | `/api/control/pump` | Mengontrol pompa air/mist (ON/OFF) |
| `GET` | `/api/history` | Mengambil log data historis untuk grafik |

## ⚙️ Installation & Setup (Local)

Jika ingin menjalankan server ini secara lokal untuk pengembangan:

1.  **Clone repository ini:**
    ```bash
    git clone [https://github.com/username/dsg-smart-reptile.git](https://github.com/username/dsg-smart-reptile.git)
    cd dsg-smart-reptile
    ```

2.  **Buat Virtual Environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Untuk Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Jalankan Server Flask:**
    ```bash
    flask run
    ```

## ☁️ Deployment to Railway

Proyek ini sudah dikonfigurasi untuk *continuous deployment* di Railway.
1.  Pastikan file `Procfile` sudah ada dengan isi: `web: gunicorn app:app`.
2.  Push perubahan ke branch `main`.
3.  Railway akan otomatis melakukan build dan deploy ulang.

## 👥 Authors
* **Gerrio Irfan Pratama** - *Lead Developer & System Architect*

---
*Dibuat untuk keperluan Tugas Akhir / Riset Mikroklimat IoT.*
