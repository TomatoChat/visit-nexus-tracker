import os
from dotenv import load_dotenv
load_dotenv()

import requests
import pandas as pd
from typing import Dict, Optional
from IPython.display import display
import time


googleMapsKey = os.getenv('GOOGLE_MAPS_KEY')


def searchLocation(query: str) -> Optional[Dict]:
    '''
    Search for a location using Google Maps API.
    
    Args:
        query (str): Search query string
        
    Returns:
        Optional[Dict]: Dictionary containing search results or None if not found
    '''
    url = 'https://maps.googleapis.com/maps/api/geocode/json'
    
    params = {
        'address': query,
        'key': googleMapsKey
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'OK':
            return data['results'][0]
        else:
            print(f'Error: {data["status"]}')
            return None
            
    except requests.exceptions.RequestException as e:
        print(f'Error making request: {e}')
        return None
    except Exception as e:
        print(f'Error processing response: {e}')
        return None


def extractAddressDetails(result: Dict) -> Dict:
    '''
    Extract address details from a Google Maps API result.
    
    Args:
        result (Dict): Google Maps API result dictionary
        
    Returns:
        Dict: Dictionary containing address details
    '''
    address_dict = {
        'addressLine1': '',
        'city': '',
        'province': '',
        'postalCode': '',
        'country': '',
        'latitude': None,
        'longitude': None
    }
    
    # Extract address components
    address_components = result['address_components']
    
    # Parse address components
    for component in address_components:
        types = component['types']
        if 'street_number' in types:
            address_dict['addressLine1'] = component['long_name']
        elif 'route' in types:
            address_dict['addressLine1'] += ' ' + component['long_name']
        elif 'locality' in types:
            address_dict['city'] = component['long_name']
        elif 'administrative_area_level_1' in types:
            address_dict['province'] = component['long_name']
        elif 'postal_code' in types:
            address_dict['postalCode'] = component['long_name']
        elif 'country' in types:
            address_dict['country'] = component['long_name']
    
    # Get coordinates
    location = result['geometry']['location']
    address_dict['latitude'] = location['lat']
    address_dict['longitude'] = location['lng']
    
    return address_dict


def getAddressDetails(name: str, city: str, province: str) -> Optional[Dict]:
    '''
    Get address details from Google Maps API given a name, city, and province.
    
    Args:
        name (str): Name of the location
        city (str): City name
        province (str): Province/State name
        
    Returns:
        Optional[Dict]: Dictionary containing address details or None if not found
    '''
    # Construct the search query
    query = f'{name}, {city}, {province}'
    
    # First search for the location
    result = searchLocation(query)
    
    if result:
        # Then extract the address details
        return extractAddressDetails(result)
    
    return None


def processAddresses(df: pd.DataFrame) -> pd.DataFrame:
    '''
    Process a DataFrame containing names, cities, and provinces to get address details.
    Appends the address details as new columns to the input DataFrame.
    
    Args:
        df (pd.DataFrame): DataFrame with columns: name, city, province
        
    Returns:
        pd.DataFrame: Input DataFrame with additional address detail columns
    '''
    # Create a copy of the input DataFrame to avoid modifying the original
    results = df.copy()
    
    # Initialize new columns with empty values
    results['addressLine1'] = ''
    results['city'] = ''
    results['province'] = ''
    results['postalCode'] = ''
    results['country'] = ''
    results['latitude'] = None
    results['longitude'] = None

    for i, (index, row) in enumerate(df.iterrows(), 1):
        print(f'Processing {i}/{len(df)}: {row["name"]}')
        
        result = getAddressDetails(
            name=row['name'],
            city=row['city'],
            province=row['province']
        )
        
        if result:
            # Update the row with the address details
            for key, value in result.items():
                results.at[index, key] = value
        
        # Add a small delay to avoid hitting API rate limits
        time.sleep(0.2)
    
    return results