from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os

# Import modules
from ranking import score_flights, score_hotels, score_trains
from prediction import predict_price_trend
from recommendation import optimize_packages
from chat import generate_chat_response

app = FastAPI(title="VoyageIQ AI Decision Engine", version="1.0.0")

# Enable CORS for communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class RankRequest(BaseModel):
    flights: List[Dict[str, Any]]
    hotels: List[Dict[str, Any]]
    trains: List[Dict[str, Any]]

class PricePredictionRequest(BaseModel):
    from_city: str
    to_city: str
    date: str
    price: Optional[float] = None

class BudgetPackageRequest(BaseModel):
    from_city: str
    to_city: str
    date: str
    budget: float
    travelers: Optional[int] = 1

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None

# --- Routes ---
@app.get("/")
def read_root():
    return {
        "service": "VoyageIQ AI microservice",
        "status": "online",
        "version": "1.0.0"
    }

@app.post("/rank")
def rank_options(request: RankRequest):
    try:
        ranked_flights = score_flights(request.flights)
        ranked_hotels = score_hotels(request.hotels)
        ranked_trains = score_trains(request.trains)
        return {
            "flights": ranked_flights,
            "hotels": ranked_hotels,
            "trains": ranked_trains
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ranking error: {str(e)}")

@app.post("/predict-price-trend")
def price_trend(request: PricePredictionRequest):
    try:
        result = predict_price_trend(
            request.from_city,
            request.to_city,
            request.date,
            request.price
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/recommend-package")
def recommend_package(request: BudgetPackageRequest):
    # Retrieve options locally using mock or dynamic fetcher - wait, we let recommendation solver
    # evaluate the packages. Since we don't have mock data directly in python, we can import them 
    # or simulate them in python for consistency, or the backend will query and send them, OR 
    # python will generate mock lists internally if empty lists are supplied.
    # Let's check how to mock in python if needed. We'll generate mock data in python if lists are empty!
    from ranking import score_flights, score_hotels, score_trains
    try:
        # Since this solver needs items, we will simulate flight and hotel options for the route in Python
        # if not supplied, which is very robust.
        # Let's build a quick simulation database
        from datetime import datetime, timedelta
        
        # Simulated Flight search in python
        flights_sim = [
            {"carrier": "IndiGo", "price": 4200, "duration": 130, "stops": 0, "departureTime": "2026-07-10T08:00:00"},
            {"carrier": "Air India", "price": 5500, "duration": 140, "stops": 0, "departureTime": "2026-07-10T11:00:00"},
            {"carrier": "Vistara", "price": 6800, "duration": 125, "stops": 0, "departureTime": "2026-07-10T14:30:00"},
            {"carrier": "SpiceJet", "price": 3800, "duration": 160, "stops": 1, "departureTime": "2026-07-10T17:00:00"}
        ]
        
        hotels_sim = [
            {"name": "Taj Gateway", "price": 8500, "rating": 4.7, "distance": 1.2, "amenities": ["WiFi", "Pool", "Gym", "Breakfast"]},
            {"name": "Comfort Inn", "price": 3200, "rating": 4.1, "distance": 2.5, "amenities": ["WiFi", "AC", "Breakfast"]},
            {"name": "Backpackers Hostel", "price": 1200, "rating": 4.3, "distance": 0.5, "amenities": ["WiFi", "Shared Kitchen"]}
        ]
        
        trains_sim = [
            {"trainNumber": "22436", "name": "Vande Bharat Express", "price": 1600, "duration": 480, "availability": "Available"},
            {"trainNumber": "12626", "name": "Kerala Express", "price": 800, "duration": 960, "availability": "RAC 4"}
        ]
        
        # Rank them first
        ranked_f = score_flights(flights_sim)
        ranked_h = score_hotels(hotels_sim)
        ranked_t = score_trains(trains_sim)
        
        result = optimize_packages(
            ranked_f,
            ranked_h,
            ranked_t,
            request.budget,
            request.travelers
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/chat")
def chat_assistant(request: ChatRequest):
    try:
        reply = generate_chat_response(request.message, request.history)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Set default port to 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
