import pandas as pd
import numpy as np

def score_flights(flights_list):
    if not flights_list:
        return []
    
    df = pd.DataFrame(flights_list)
    
    # Calculate bounds for normalization
    min_price = df['price'].min() if 'price' in df.columns else 1
    min_duration = df['duration'].min() if 'duration' in df.columns else 1
    
    scores = []
    for _, row in df.iterrows():
        # 1. Price Efficiency (40%)
        price = row.get('price', 1)
        price_eff = (min_price / price) * 40 if price > 0 else 40
        
        # 2. Travel Duration (20%)
        duration = row.get('duration', 1)
        duration_eff = (min_duration / duration) * 20 if duration > 0 else 20
        
        # 3. Ratings (15%) - Flights default rating 4.5/5
        rating = row.get('rating', 4.5)
        rating_score = (rating / 5.0) * 15
        
        # 4. Stops Penalty (5%) - Direct flight gets full 5 points, 1 stop gets 2.5 points, 2+ gets 0
        stops = row.get('stops', 0)
        stops_score = max(0.0, 5.0 - (stops * 2.5))
        
        # 5. Convenience (10%) - Departure time between 8 AM and 8 PM is optimal
        dep_time = row.get('departureTime', '')
        convenience = 8.0 # default
        try:
            if dep_time:
                # Extract hour (handling ISO string e.g. "2026-07-10T08:30:00.000Z")
                hour = int(dep_time.split('T')[1].split(':')[0])
                if 8 <= hour <= 20:
                    convenience = 10.0
                elif 0 <= hour <= 5: # overnight red-eye
                    convenience = 5.0
        except Exception:
            pass
        convenience_score = (convenience / 10.0) * 10
        
        # 6. Popularity (10%) - Based on airline brand reputation
        carrier = row.get('carrier', '')
        popularity = 8.0
        if carrier in ['Emirates', 'Singapore Airlines', 'Vistara', 'Qatar Airways']:
            popularity = 10.0
        elif carrier in ['IndiGo', 'Air India']:
            popularity = 8.5
        popularity_score = (popularity / 10.0) * 10
        
        # Calculate final composite score
        total_score = round(price_eff + duration_eff + rating_score + stops_score + convenience_score + popularity_score)
        total_score = max(10, min(100, total_score)) # Keep within 10-100 range
        
        row_dict = row.to_dict()
        row_dict['score'] = total_score
        scores.append(row_dict)
        
    return sorted(scores, key=lambda x: x['score'], reverse=True)

def score_hotels(hotels_list):
    if not hotels_list:
        return []
        
    df = pd.DataFrame(hotels_list)
    min_price = df['price'].min() if 'price' in df.columns else 1
    max_rating = df['rating'].max() if 'rating' in df.columns else 5
    
    scores = []
    for _, row in df.iterrows():
        # 1. Price Efficiency (40%)
        price = row.get('price', 1)
        price_eff = (min_price / price) * 40 if price > 0 else 40
        
        # 2. Ratings (15% -> we weigh higher for hotels, combine rating and distance)
        rating = row.get('rating', 4.0)
        rating_score = (rating / 5.0) * 15
        
        # 3. Distance Convenience (15% - closer to center is better)
        distance = row.get('distance', 2.0)
        # normalize: 0km is best (15 pts), 5km+ is lowest (3 pts)
        dist_score = max(3.0, 15.0 - (distance * 2.5))
        
        # 4. Amenities Score (15%) - based on count of amenities
        amenities = row.get('amenities', [])
        amenities_count = len(amenities) if isinstance(amenities, list) else 2
        amenities_score = min(15.0, (amenities_count / 5.0) * 15)
        
        # 5. Popularity/Brand (15%) - based on ratings and review count
        popularity = min(15.0, (rating / max_rating) * 15) if max_rating > 0 else 10.0

        # Calculate final composite score
        total_score = round(price_eff + rating_score + dist_score + amenities_score + popularity)
        total_score = max(10, min(100, total_score))
        
        row_dict = row.to_dict()
        row_dict['score'] = total_score
        scores.append(row_dict)
        
    return sorted(scores, key=lambda x: x['score'], reverse=True)

def score_trains(trains_list):
    if not trains_list:
        return []
        
    df = pd.DataFrame(trains_list)
    min_price = df['price'].min() if 'price' in df.columns else 1
    min_duration = df['duration'].min() if 'duration' in df.columns else 1
    
    scores = []
    for _, row in df.iterrows():
        # Trains focus heavily on price and schedule availability
        price = row.get('price', 1)
        price_eff = (min_price / price) * 50  # 50% Price efficiency
        
        duration = row.get('duration', 1)
        dur_eff = (min_duration / duration) * 30  # 30% Duration efficiency
        
        # Availability rating (20%)
        avail = row.get('availability', '')
        avail_score = 15.0 # default
        if 'Available' in avail:
            avail_score = 20.0
        elif 'RAC' in avail:
            avail_score = 12.0
        elif 'WL' in avail:
            avail_score = 6.0
            
        total_score = round(price_eff + dur_eff + avail_score)
        total_score = max(10, min(100, total_score))
        
        row_dict = row.to_dict()
        row_dict['score'] = total_score
        scores.append(row_dict)
        
    return sorted(scores, key=lambda x: x['score'], reverse=True)
