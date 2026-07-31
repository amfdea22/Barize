import requests
import json

# Login
resp = requests.post('http://localhost:8000/api/v1/auth/login', json={'username': 'admin', 'senha': 'admin123'})
print("Login:", resp.status_code)
if resp.status_code == 200:
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test fichas-tecnicas endpoint
    resp = requests.get('http://localhost:8000/api/v1/fichas-tecnicas/', headers=headers)
    print("Fichas Técnicas:", resp.status_code)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Total: {len(data)} fichas")
        for f in data[:2]:
            print(f"  - {f['nome']} ({f['categoria']}) - Tags: {f['tags']} - Alérgenos: {f['alergenos']}")
    else:
        print(resp.text)
    
    # Test categorias
    resp = requests.get('http://localhost:8000/api/v1/fichas-tecnicas/categorias/lista', headers=headers)
    print("Categorias:", resp.status_code, resp.json())
    
    # Test tags
    resp = requests.get('http://localhost:8000/api/v1/fichas-tecnicas/tags/lista', headers=headers)
    print("Tags:", resp.status_code, resp.json())
    
    # Test alergenos
    resp = requests.get('http://localhost:8000/api/v1/fichas-tecnicas/alergenos/lista', headers=headers)
    print("Alergenos:", resp.status_code, resp.json())