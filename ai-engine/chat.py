import os
from openai import OpenAI

import requests
import json
from openai import OpenAI

def load_backend_env():
    try:
        env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if "=" in line and not line.strip().startswith("#"):
                        key, val = line.strip().split("=", 1)
                        os.environ[key.strip()] = val.strip()
    except Exception as e:
        print("Could not load backend .env file in python:", e)

def generate_chat_response(message, history=None):
    load_backend_env()
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # 1. Try Gemini API first (Generous Free Tier available)
    if gemini_key:
        try:
            print("🤖 ChatBot: Querying Gemini API...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            
            contents = []
            if history:
                for turn in history:
                    role = "user" if turn.get("sender") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": turn.get("text", "")}]
                    })
            contents.append({
                "role": "user",
                "parts": [{"text": message}]
            })
            
            payload = {
                "contents": contents,
                "systemInstruction": {
                    "parts": [{
                        "text": (
                            "You are VoyageIQ's Smart AI Travel Agent. You provide excellent travel planning "
                            "advice, specific itineraries, budgeting tips, and route recommendations. "
                            "Keep your responses concise, highly structured (use lists and bold text), "
                            "and friendly. Highlight cost-saving options like trains or budget airlines where relevant."
                        )
                    }]
                }
            }
            
            response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=8)
            response.raise_for_status()
            res_data = response.json()
            return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini API error: {e}. Trying OpenAI fallback...")
            
    # 2. Try OpenAI API
    if openai_key:
        try:
            print("🤖 ChatBot: Querying OpenAI API...")
            client = OpenAI(api_key=openai_key)
            messages = [
                {"role": "system", "content": (
                    "You are VoyageIQ's Smart AI Travel Agent. You provide excellent travel planning "
                    "advice, specific itineraries, budgeting tips, and route recommendations. "
                    "Keep your responses concise, highly structured (use lists and bold text), "
                    "and friendly. Highlight cost-saving options like trains or budget airlines where relevant."
                )}
            ]
            
            if history and isinstance(history, list):
                for turn in history:
                    messages.append({"role": turn.get("sender", "user"), "content": turn.get("text", "")})
                    
            messages.append({"role": "user", "content": message})
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error: {e}. Falling back to simulated chat response.")
            
    # Simulated Local Chatbot Responder (NLP Fallback)
    input_text = message.lower().strip()
    
    if any(greet in input_text for greet in ["hello", "hi", "hey", "hola"]):
        return (
            "**Welcome to VoyageIQ AI Chat!** ✈️\n\n"
            "I am your virtual travel concierge. I can help you with:\n"
            "- Finding the best seasons to travel\n"
            "- Budget planning (e.g. 'How to travel under ₹40,000')\n"
            "- Comparing options like Flights vs Trains\n"
            "- Crafting a 3-day itinerary for destinations like Tokyo, Dubai, or Goa\n\n"
            "Where are you dreaming of going next?"
        )
    
    elif "tokyo" in input_text:
        return (
            "### 🗼 Tokyo, Japan — Quick 3-Day Itinerary\n"
            "- **Day 1: Modern Tokyo.** Explore the vibrant Shibuya Crossing, Meiji Shrine, and the shopping districts of Harajuku. End with views from Shibuya Sky.\n"
            "- **Day 2: Historic Tokyo.** Visit Senso-ji Temple in Asakusa, take a cruise down Sumida River, and explore the electronics town Akihabara.\n"
            "- **Day 3: Pop Culture & Gardens.** Stroll through Shinjuku Gyoen National Garden, and check out themed cafes in Shinjuku.\n\n"
            "💰 *Cost Tip:* Flights average ₹40,000+; local daily budget is about ¥10,000 (₹5,500) per person. Use the **Cheapest Month** chart to lock in early flight deals!"
        )
        
    elif "goa" in input_text:
        return (
            "### 🏖️ Goa, India — Relaxed 3-Day Beach Escape\n"
            "- **Day 1: North Goa Beaches.** Relax at Calangute and Baga beaches. Try water sports and watch the sunset at Chapora Fort.\n"
            "- **Day 2: Culture & Heritage.** Visit Old Goa churches (Basilica of Bom Jesus), walk through Fontainhas (Latin Quarter in Panaji), and take a spice plantation tour.\n"
            "- **Day 3: South Goa Tranquility.** Travel to Palolem beach for a quiet dolphin boat tour. Dine at seaside shacks.\n\n"
            "🚂 *Travel Tip:* Save 70% of cost by booking the **Vande Bharat Express** train from Mumbai or Bangalore instead of flying! Check out the comparative value score in our dashboard."
        )

    elif "dubai" in input_text:
        return (
            "### 🏙️ Dubai, UAE — High-Octane 3-Day Itinerary\n"
            "- **Day 1: Icons of Dubai.** Visit the Burj Khalifa observation deck, shop at Dubai Mall, and watch the fountain show. Walk around Dubai Marina at night.\n"
            "- **Day 2: Desert Adventure & Souks.** Explore Gold and Spice Souks in Deira, take an abra boat ride. In the afternoon, do a Red Dunes Desert Safari with BBQ dinner.\n"
            "- **Day 3: Waterparks & Palm.** Relax at Jumeirah Beach, and spend the day at Atlantis Aquaventure Waterpark on the Palm.\n\n"
            "☀️ *Best Time:* November to March (avoid the extreme 42°C summer heat)."
        )
        
    elif "paris" in input_text:
        return (
            "### 🎨 Paris, France — Romantic 3-Day Tour\n"
            "- **Day 1: Core Monuments.** Visit the Eiffel Tower, walk along the Seine, check out the Arc de Triomphe and stroll the Champs-Élysées.\n"
            "- **Day 2: Masterpieces & History.** Spend the morning in the Louvre Museum. Visit Notre-Dame Cathedral area and walk through the artistic Latin Quarter.\n"
            "- **Day 3: Artistic Montmartre.** Climb up to the Sacré-Cœur Basilica in Montmartre, watch street painters, and visit a Parisian café.\n\n"
            "🥐 *Budget Tip:* Book hotels outside the central Arrondissements (zones 10-18) near a metro stop to save up to 40% on lodging."
        )
        
    elif "budget" in input_text or "cheap" in input_text or "cost" in input_text:
        return (
            "### 💡 Smart Saving Advice by VoyageIQ\n"
            "1. **Mid-Week Flight Bookings:** Flight prices are historically cheaper when departing on Tuesdays/Wednesdays compared to Friday/Sunday rushes.\n"
            "2. **The 14-Day Booking Rule:** Our AI price model predicts that booking flights between 14-21 days in advance gives you the optimal price. Last-minute tickets (under 7 days) carry a 20-30% premium.\n"
            "3. **Train Alternative:** For travel under 1,000 km, booking 2AC/CC on trains is often 4-5x cheaper than flights, while offering similar convenience when factoring airport wait times.\n"
            "4. **Location Radius:** Choose hotels 1-2 km away from tourist hotspots. Stays near city centers have a 1.5x price multiplier."
        )
        
    else:
        return (
            "I'm here to help you plan your ideal vacation! Ask me about specific details like:\n"
            "- *'What is a good 3-day itinerary for Tokyo?'*\n"
            "- *'Is Goa safe for solo travelers?'*\n"
            "- *'Tell me some cheap budget travel tips.'*\n"
            "- *'What is the best month to visit Dubai?'*"
        )
