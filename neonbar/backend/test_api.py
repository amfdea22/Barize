import requests
import json

# Login
resp = requests.post('http://localhost:8000/api/v1/auth/login', json={'username': 'admin', 'senha': 'admin123'})
print("Login:", resp.status_code, resp.json())

if resp.status_code == 200:
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test etiquetas endpoint
    resp = requests.get('http://localhost:8000/api/v1/etiquetas/', headers=headers)
    print("Etiquetas:", resp.status_code, resp.json())
    
    # Test produto-lotes endpoint
    resp = requests.get('http://localhost:8000/api/v1/produto-lotes/', headers=headers)
    print("Produto Lotes:", resp.status_code, resp.json())