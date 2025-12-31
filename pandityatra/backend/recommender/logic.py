# pandityatra_backend/recommender/logic.py (CORRECTED)

from pandits.models import Pandit
from users.models import User
from decimal import Decimal

def recommend_pandits(user_id):
    """
    Calculates a composite recommendation score for all Pandits 
    based on the authenticated user's profile and preferences.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return []

    # --- SIMULATED USER PREFERENCES (TO BE REFINED LATER) ---
    user_prefs = {
        'preferred_language': 'Hindi',
        'preferred_expertise': 'Vedic',
    }

    # Define weights for scoring factors
    WEIGHTS = {
        'language_match': 10,
        'expertise_match': 8,
        'rating_factor': 4,
    }
    
    # 2. Fetch all available Pandits (only active ones)
    all_pandits = Pandit.objects.filter(is_available=True)
    
    recommendation_data = []

    for pandit in all_pandits:
        score = Decimal(0)
        
        # --- 3. SCORING HEURISTICS ---
        
        # 3a. Language Match (Highest Weight)
        if pandit.language == user_prefs['preferred_language']:
            score += WEIGHTS['language_match']
        
        # 3b. Expertise Match
        if pandit.expertise == user_prefs['preferred_expertise']:
            score += WEIGHTS['expertise_match']
            
        # 3c. Rating Factor (Scale Pandit rating 0.00-5.00 to score bonus)
        # FIX: Check if rating is not None and greater than 0.00 before dividing.
        if pandit.rating is not None and pandit.rating > Decimal('0.00'):
            # Assuming max rating is 5.0
            rating_normalized = (pandit.rating / Decimal('5.00')) 
            score += rating_normalized * WEIGHTS['rating_factor']
        
        # Store results
        recommendation_data.append({
            'pandit': pandit,
            'recommendation_score': score
        })

    # 4. Rank Pandits
    recommendation_data.sort(key=lambda x: x['recommendation_score'], reverse=True)
    
    # 5. Extract only the Pandit objects, now ordered by score
    # IMPORTANT: We need to return the score too, so let's adjust this step to pass the score for serialization.
    ranked_and_scored_pandits = []
    for item in recommendation_data:
        # Create a combined object to pass the score easily to the serializer
        pandit_data = {
            'id': item['pandit'].id,
            'full_name': item['pandit'].full_name,
            'expertise': item['pandit'].expertise,
            'language': item['pandit'].language,
            'rating': item['pandit'].rating,
            'bio': item['pandit'].bio,
            'recommendation_score': item['recommendation_score']
        }
        ranked_and_scored_pandits.append(pandit_data)
    
    return ranked_and_scored_pandits