import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def predict_price_trend(from_city, to_city, date_str, current_price):
    # Calculate days remaining until departure
    try:
        departure_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        departure_date = datetime.now() + timedelta(days=14)
        
    days_to_departure = (departure_date - datetime.now()).days
    days_to_departure = max(1, days_to_departure)
    
    current_price = current_price or 6000
    
    # 1. Create a simulated training dataset using numpy/pandas representing historical price changes
    # X = days until departure (from 60 days down to 0 days)
    # y = price multiplier (starts around 0.95 at 60 days, stays flat, then curves up to 1.30 near 0 days)
    np.random.seed(42)
    x_train = np.arange(1, 61).reshape(-1, 1) # 1 to 60 days until departure
    
    # Sigmoidal-like behavior: price starts stable, surges dramatically in final 10 days
    y_multiplier = 0.95 + (0.05 * (60 - x_train.flatten()) / 60) + (0.35 / (1 + np.exp((x_train.flatten() - 7) / 2)))
    # Add random noise
    y_multiplier += np.random.normal(0, 0.02, len(x_train))
    
    # Fit regression model
    model = LinearRegression()
    model.fit(x_train, y_multiplier)
    
    # Predict trend for the target days remaining
    pred_mult = model.predict(np.array([[days_to_departure]]))[0]
    
    # Predict multipliers for the next 7 days (coming closer to departure, so days remaining counts down)
    trend_prices = []
    trend_labels = []
    
    for i in range(7):
        future_day = datetime.now() + timedelta(days=i)
        future_days_to_dep = max(0, days_to_departure - i)
        
        # Linear Regression predict
        pred_future_mult = model.predict(np.array([[future_days_to_dep]]))[0]
        
        # Calculate price based on ratio of multiplier
        future_price = round(current_price * (pred_future_mult / pred_mult))
        
        trend_prices.append(future_price)
        trend_labels.append(future_day.strftime("%b %d"))
        
    # Determine recommendation
    price_change_ratio = trend_prices[-1] / current_price
    
    if days_to_departure < 10:
        recommendation = "Buy Now"
        confidence = int(88 + min(10, (10 - days_to_departure)))
        explanation = f"With only {days_to_departure} days remaining, seats are filling quickly. Prices are highly likely to surge by {round((price_change_ratio - 1) * 100)}% in the next 7 days."
    elif days_to_departure > 25:
        # Long runway, price might oscillate or drop briefly
        recommendation = "Wait"
        confidence = 70
        explanation = "Booking runway is wide. Prices are predicted to remain stable or fluctuate downwards. We suggest monitoring for another week."
    else:
        # Mid-range
        if price_change_ratio > 1.03:
            recommendation = "Buy Now"
            confidence = 78
            explanation = "Upward price trend detected. Booking now protects against the steady price rise predicted as departure approaches."
        else:
            recommendation = "Wait"
            confidence = 65
            explanation = "Moderate price consolidation expected. Watch for occasional promotional fare drops over the next few days."
            
    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "explanation": explanation,
        "trend": {
            "labels": trend_labels,
            "prices": trend_prices
        }
    }
