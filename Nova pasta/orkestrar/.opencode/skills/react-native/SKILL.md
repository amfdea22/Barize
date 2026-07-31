# react-native

> **Categoria**: frontend
> **Tags**: react-native, mobile, ios, android, expo, navigation, hermes

React Native: desenvolvimento cross-platform iOS/Android, navega��o, gerenciamento de estado, m�dulos nativos, performance com Hermes, testing e deploy em app stores.

## Quando Usar

Use ao desenvolver apps mobile cross-platform com React Native, configurar navega��o, otimizar performance, integrar m�dulos nativos ou preparar deploy para stores.

## Project Setup � Expo vs Bare Workflow

**Expo (Managed)** � recomendado para novos projetos (95% dos casos):

```bash
npx create-expo-app@latest MyApp --template blank-typescript
```

? Pr�s: OTA updates, Expo SDK, build service (EAS), desenvolvimento r�pido
? Contras: Limitado para m�dulos nativos muito customizados

**Bare Workflow (RN CLI)** � para projetos que precisam de controle total:

```bash
npx react-native init MyApp --template react-native-template-typescript
```

? Pr�s: Acesso total ao c�digo nativo, qualquer m�dulo
? Contras: Build manual, mais complexidade, sem OTA

**Decis�o**:
| Necessidade | Expo | Bare |
|-------------|------|------|
| Prot�tipo r�pido | ? | ? |
| M�dulo nativo customizado | ? | ? |
| OTA Updates | ? | ? |
| Push notifications | ? (EAS) | ? (FCM/APNs) |
| Background tasks | Limitado | Total |

## Navigation

**React Navigation** � o padr�o da comunidade:

```bash
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

type RootStackParamList = {
  Home: undefined
  Profile: { userId: string }
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

**Padr�es de navega��o**:

- **Stack**: telas empilhadas (Home ? Profile ? EditProfile)
- **Tab**: abas inferiores (Home, Search, Profile)
- **Drawer**: menu lateral (menos comum em apps modernos)
- **Deep linking**: `linking={{ prefixes: ['myapp://'], config: { screens } }}`

## State Management

| Complexidade    | Solu��o                        | Uso                       |
| --------------- | ------------------------------ | ------------------------- |
| Local           | `useState` / `useReducer`      | Toggle, formul�rio        |
| �rvore rasa     | `React.Context` + `useReducer` | Tema, autentica��o        |
| �rvore profunda | Zustand, Jotai                 | Dados de usu�rio, cache   |
| Server state    | TanStack Query (React Query)   | API calls, cache, refetch |
| Formul�rios     | React Hook Form + Zod          | Valida��o de inputs       |
| Persistente     | AsyncStorage + Zustand persist | Offline-first             |

```typescript
// Zustand � estado global simples e perform�tico
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token) => set({ token }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

## Native Modules

Quando usar c�digo nativo:

- Acesso a hardware espec�fico (Bluetooth, NFC)
- Performance cr�tica (processamento de v�deo, �udio)
- Bibliotecas nativas sem wrapper React Native

**No Expo (EAS Build)**:

```bash
# Usar config plugin
npx expo install expo-camera
```

**No Bare Workflow**:

```typescript
// iOS: AppDelegate.mm
// Android: MainApplication.java
// Bridging via Turbo Modules (React Native 0.75+)
```

**Turbo Module (Fabric)** � arquitetura nova (RN 0.75+):

```typescript
// NativeModule.ts
import { TurboModule, TurboModuleRegistry } from 'react-native';
interface Spec extends TurboModule {
  readonly reverseString: (input: string) => string;
}
export default TurboModuleRegistry.getEnforcing<Spec>('NativeCalculator');
```

? Preferir Expo SDK modules sobre m�dulos nativos customizados sempre que poss�vel.

## Performance

**Hermes Engine** (recomendado) � engine JS otimizada para mobile:

```json
// app.json (Expo)
{ "expo": { "jsEngine": "hermes" } }
```

**Otimiza��es de renderiza��o**:

- `FlatList` sobre `ScrollView` (virtualiza��o nativa)
- `React.memo()` em componentes de lista
- `useMemo()` e `useCallback()` para evitar re-renders
- Imagens: `react-native-fast-image` (cache + placeholder)
- Lottie para anima��es em vez de JS-driven

```typescript
// FlatList otimizada
<FlatList
  data={users}
  keyExtractor={(item) => item.id}
  renderItem={UserCard}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

**M�tricas**:

- `react-native-performance` para monitorar FPS e tempo de tela
- Evitar `console.log` em produ��o (bloqueia execu��o no Hermes)
- Perfilhar com React DevTools + Flipper

## Testing & Deployment

**Testes**:

```typescript
// React Native Testing Library
import { render, fireEvent } from '@testing-library/react-native'

it('should login when credentials are valid', async () => {
  const { getByTestId, getByText } = render(<LoginScreen />)
  fireEvent.changeText(getByTestId('email-input'), 'user@test.com')
  fireEvent.changeText(getByTestId('password-input'), 'validPass')
  fireEvent.press(getByText('Login'))
  await waitFor(() => {
    expect(getByText('Welcome!')).toBeTruthy()
  })
})
```

**E2E**: Detox ou Maestro (recomendado Maestro para simplicidade).

**Deploy**:

| Store       | Expo (EAS)                                    | Bare                                 |
| ----------- | --------------------------------------------- | ------------------------------------ |
| **iOS**     | `eas build --platform ios` + `eas submit`     | xcodebuild + Transporter             |
| **Android** | `eas build --platform android` + `eas submit` | gradlew bundleRelease + Play Console |

**CI/CD** com EAS:

```yaml
# eas-ci.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --non-interactive
```

**OTA Updates** (Expo only):

```bash
eas update --branch production --message "Fix login bug"
```
