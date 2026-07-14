def optimize_packages(flights, hotels, trains, budget, travelers=1):
    budget = float(budget or 50000)
    travelers = int(travelers or 1)
    
    # Filter valid transportation (flights or trains)
    transport_options = []
    for f in flights:
        transport_options.append({'item': f, 'type': 'flight', 'price': float(f['price']), 'score': float(f.get('score', 50))})
    for t in trains:
        transport_options.append({'item': t, 'type': 'train', 'price': float(t['price']), 'score': float(t.get('score', 40))})
        
    # Accommodation options (assuming 3 nights stay)
    hotel_options = []
    for h in hotels:
        hotel_options.append({'item': h, 'price': float(h['price']) * 3.0, 'score': float(h.get('score', 50))}) # 3 nights cost
        
    if not transport_options or not hotel_options:
        return {"packages": []}
        
    packages = []
    
    # 1. Cheap Backpacker Option: Lowest total cost that is valid
    cheapest_transport = min(transport_options, key=lambda x: x['price'])
    cheapest_hotel = min(hotel_options, key=lambda x: x['price'])
    
    backpack_cost = cheapest_transport['price'] + cheapest_hotel['price']
    backpack_score = round((cheapest_transport['score'] + cheapest_hotel['score']) / 2)
    
    packages.append({
        "name": "Eco Backpacker",
        "description": "Maximum savings package using budget transportation and affordable stays.",
        "transport": cheapest_transport['item'],
        "hotel": cheapest_hotel['item'],
        "nights": 3,
        "totalCost": backpack_cost,
        "score": backpack_score,
        "withinBudget": backpack_cost <= budget
    })
    
    # 2. Smart Explorer: Optimizes for the highest average score within the budget limit
    best_value = None
    best_value_score = -1
    
    for trans in transport_options:
        for hot in hotel_options:
            cost = trans['price'] + hot['price']
            if cost <= budget:
                score = (trans['score'] + hot['score']) / 2
                if score > best_value_score:
                    best_value_score = score
                    best_value = {
                        "name": "Smart Explorer",
                        "description": "Highly recommended! Optimizes for flight schedule convenience and highly rated stays.",
                        "transport": trans['item'],
                        "hotel": hot['item'],
                        "nights": 3,
                        "totalCost": cost,
                        "score": round(score),
                        "withinBudget": True
                    }
                    
    if best_value:
        packages.append(best_value)
    else:
        # Fallback to next cheapest if nothing fits budget
        fallback_trans = sorted(transport_options, key=lambda x: x['price'])[min(1, len(transport_options)-1)]
        fallback_hotel = sorted(hotel_options, key=lambda x: x['price'])[min(1, len(hotel_options)-1)]
        cost = fallback_trans['price'] + fallback_hotel['price']
        packages.append({
            "name": "Smart Explorer",
            "description": "Moderately priced transport & stays combining rating and cost.",
            "transport": fallback_trans['item'],
            "hotel": fallback_hotel['item'],
            "nights": 3,
            "totalCost": cost,
            "score": round((fallback_trans['score'] + fallback_hotel['score']) / 2),
            "withinBudget": cost <= budget
        })
        
    # 3. Premium Escape: Luxury option (highest scores overall)
    # We sort transport and hotel by score descending, check if the combo fits budget
    luxury_trans = max(transport_options, key=lambda x: x['price'])
    luxury_hotel = max(hotel_options, key=lambda x: x['price'])
    
    lux_cost = luxury_trans['price'] + luxury_hotel['price']
    lux_score = round((luxury_trans['score'] + luxury_hotel['score']) / 2)
    
    packages.append({
        "name": "Premium Escape",
        "description": "Luxury class transport with 5-star premium lodging and top tier amenities.",
        "transport": luxury_trans['item'],
        "hotel": luxury_hotel['item'],
        "nights": 3,
        "totalCost": lux_cost,
        "score": lux_score,
        "withinBudget": lux_cost <= budget
    })
    
    return {
        "budget": budget,
        "travelers": travelers,
        "packages": packages
    }
