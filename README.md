# Court-Data Fetcher & Mini-Dashboard

A small web app built with **FastAPI** that allows users to input case details (Case Type, Case Number, and Filing Year) for an Indian court and fetch:

- Parties’ names
- Filing and next-hearing dates
- Latest order/judgment PDF links
- Auto-generated legal follow-up questions using OpenAI GPT

---

## 🚀 Features

- **FastAPI Backend** with REST endpoints
- **Case Metadata Fetching** from Indian court portals
- **GPT-Powered Legal Advice** and quick question generation
- **CORS Enabled** for integration with any frontend (HTML/JS)
- **SQLite Logging** for queries and responses (Optional)
- **Error Handling** for invalid case numbers or site downtime

---

## 🛠 Tech Stack

- **Backend:** Python, FastAPI
- **AI:** OpenAI GPT (via REST API)
- **Scraping:** `requests`, `re` (extendable to Selenium/Playwright for CAPTCHA)
- **Database:** SQLite (or PostgreSQL optional)
- **Frontend (Optional):** Simple HTML/JS or React/Vue frontend

---

## 📂 Project Structure

