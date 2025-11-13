import requests

# Use the key that just worked (the one from the Eye icon)
API_KEY = "25SNiraW07TSTIzw70py"

# Puducherry
LAT = "11.9338"
LON = "79.8298"

def get_carbon_intensity_electricity_maps(api_key=API_KEY, latitude=LAT, longitude=LON):
    """
    Fetches from Electricity Maps. 
    Falls back to static average if the live grid data is missing (404).
    """
    url = "https://api.electricitymaps.com/v3/carbon-intensity/latest"
    headers = {"auth-token": api_key}
    params = {"lat": latitude, "lon": longitude}
    
    print(f"   [ElectricityMaps] Requesting data for ({latitude}, {longitude})...")

    try:
        response = requests.get(url, headers=headers, params=params, timeout=5)
        
        # CASE 1: SUCCESS
        if response.status_code == 200:
            data = response.json()
            val = data.get('carbonIntensity')
            zone = data.get('zone')
            print(f"   ✅ Live Data Found ({zone}): {val} gCO2/kWh")
            return val
            
        # CASE 2: MISSING DATA (Your current error)
        elif response.status_code == 404:
            print(f"   ⚠️ API connected, but Zone 'IN-SO' has no live data right now.")
            print(f"   🔄 Switching to Static India Average...")
            return 632.0  # 2023 Average for India
            
        # CASE 3: BAD KEY
        elif response.status_code == 403 or response.status_code == 401:
            print("   ❌ Error: API Key Refused.")
            return 632.0 # Fallback
            
        else:
            print(f"   ❌ API Error {response.status_code}: {response.text}")
            return 632.0 # Fallback
            
    except Exception as e:
        print(f"   ❌ Connection Failed: {e}")
        return 632.0 # Fallback

# Test it
if __name__ == "__main__":
    val = get_carbon_intensity_electricity_maps()
    print(f"Final Result to use in app: {val}")