import sys
import os
from dotenv import load_dotenv
load_dotenv()
os.chdir(os.getenv('PROJECT_DIRECTORY'))
sys.path.append(os.getenv('PROJECT_DIRECTORY'))

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import time
import json

def get_coordinates(address_list):
    """
    Convert a list of addresses to latitude and longitude coordinates.
    
    Args:
        address_list (list): List of address strings in the format "street, city, province, postal_code"
    
    Returns:
        list: List of dictionaries containing the original address and its coordinates
    """
    geolocator = Nominatim(user_agent="my_geocoder")
    results = []
    
    for address in address_list:
        try:
            # Add a small delay to respect the API rate limits
            time.sleep(1)
            
            # Get location
            location = geolocator.geocode(address)
            
            if location:
                result = {
                    'address': address,
                    'latitude': location.latitude,
                    'longitude': location.longitude
                }
            else:
                result = {
                    'address': address,
                    'latitude': None,
                    'longitude': None,
                    'error': 'Address not found'
                }
                
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            result = {
                'address': address,
                'latitude': None,
                'longitude': None,
                'error': str(e)
            }
            
        results.append(result)
    
    return results

# Example usage
if __name__ == "__main__":
    # Sample address list
    addresses = [
        "Via dell'Industria, 18, ARZIGNANO, VI, 36071",
        "VIA MICHELINO 59, BOLOGNA, BO, 40127",
        "Via Bruno Buozzi 30, BOLZANO, BZ, 39100",
        "Via A. Grandi, 26, CANTU', CO, 22063",
        "Via Fornace, 15, CASTEL GUELFO, BO, 40023",
        "via della stazione, 100, CASTEL IVANO, TN, 38059",
        "via Villanova 29/7, CASTENASO, BO, 40055",
        "VIA DEI GELSI 4, CESSALTO, TV, 31040",
        "Via A.Volta, 16, COLOGNO MONZESE, MI, 20093",
        "Via Peschiere, 38, CONSCIO, TV, 31032",
        "Via Enrico Mattei, 50, DUEVILLE, VI, 36031",
        "Via G. Di Vittorio 43/3, LAVIS, TN, 38015",
        "Via Montello 22, MAROSTICA, VI, 36063",
        "Viale Famagosta, 75, MILANO, MI, 20142",
        "VIA ENRICO DEGLI SCROVEGNI 1, PADOVA, PD, 35131",
        "Via Olanda n. 2, PADOVA, PD, 35127",
        "Via dell'Industria 4/6, Piedimulera, VB, 28885",
        "Via Sanguinazzi Fratelli 1, PIOVE DI SACCO, PD, 35028",
        "Via dei Boschi 1, PRADAMANO, UD, 33040",
        "Via Vincenzo Tineo, 97, ROMA, RM, 00172",
        "STRADA 8 PALAZZO N SNC, ROZZANO, MI, 20089",
        "Strada 8 Palazzo N, ROZZANO, MI, 20089",
        "Via Unità d'Italia 2, SAN DONÀ DI PIAVE, VE, 30027",
        "Via Innsbruck, 2, TRENTO, TN, 38121",
        "Via Antonio Pranzelores n. 26, TRENTO, TN, 38121",
        "VIA KONRAD LECHNER 5/A, VARNA, BZ, 39040"
    ]
    
    # Get coordinates
    coordinates = get_coordinates(addresses)
    
    # Print results
    for result in coordinates:
        print(f"\nAddress: {result['address']}")
        if result['latitude'] and result['longitude']:
            print(f"Latitude: {result['latitude']}")
            print(f"Longitude: {result['longitude']}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    
    # Save results to JSON file
    with open('coordinates.json', 'w', encoding='utf-8') as f:
        json.dump(coordinates, f, ensure_ascii=False, indent=2)
    
    print("\nResults have been saved to coordinates.json") 