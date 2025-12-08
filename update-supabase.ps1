# ============================================
# SCRIPT: Actualizar Sales Coach AI con Supabase
# ============================================
# Ejecutar en: C:\Users\Madda\sales-coach-ai
# Comando: .\update-supabase.ps1

Write-Host "🚀 Actualizando Sales Coach AI con Supabase..." -ForegroundColor Green

# 1. Instalar dependencias
Write-Host "`n📦 Instalando @supabase/supabase-js..." -ForegroundColor Cyan
npm install @supabase/supabase-js

# 2. Crear archivo supabase-client.js
Write-Host "`n📄 Creando js/supabase-client.js..." -ForegroundColor Cyan

$supabaseClient = @'
// js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = window.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
'@

Set-Content -Path "js/supabase-client.js" -Value $supabaseClient

# 3. Crear login.html
Write-Host "`n📄 Creando login.html..." -ForegroundColor Cyan

$loginHtml = @'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Sales Coach AI</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="login-container">
        <div class="login-box">
            <h1>🤖 Sales Coach AI</h1>
            <p>Ingresá para continuar</p>
            
            <div id="login-form">
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button id="login-btn">Ingresar</button>
                <p class="switch-mode">
                    ¿No tenés cuenta? <a href="#" id="show-signup">Crear cuenta</a>
                </p>
            </div>
            
            <div id="signup-form" style="display:none;">
                <input type="email" id="signup-email" placeholder="Email" required>
                <input type="password" id="signup-password" placeholder="Password (mín 6 caracteres)" required>
                <button id="signup-btn">Crear cuenta</button>
                <p class="switch-mode">
                    ¿Ya tenés cuenta? <a href="#" id="show-login">Ingresar</a>
                </p>
            </div>
            
            <div id="error-msg" class="error" style="display:none;"></div>
        </div>
    </div>
    
    <script type="module">
        import { supabase, signIn, signUp } from './js/supabase-client.js';
        
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const errorMsg = document.getElementById('error-msg');
        
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            errorMsg.style.display = 'none';
        });
        
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            errorMsg.style.display = 'none';
        });
        
        document.getElementById('login-btn').addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showError('Por favor completá email y password');
                return;
            }
            
            const { data, error } = await signIn(email, password);
            
            if (error) {
                showError(error.message);
            } else {
                window.location.href = '/';
            }
        });
        
        document.getElementById('signup-btn').addEventListener('click', async () => {
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            if (!email || !password) {
                showError('Por favor completá email y password');
                return;
            }
            
            if (password.length < 6) {
                showError('Password debe tener al menos 6 caracteres');
                return;
            }
            
            const { data, error } = await signUp(email, password);
            
            if (error) {
                showError(error.message);
            } else {
                showError('Cuenta creada! Chequeá tu email para confirmar.', false);
                setTimeout(() => {
                    signupForm.style.display = 'none';
                    loginForm.style.display = 'block';
                }, 2000);
            }
        });
        
        function showError(msg, isError = true) {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
            errorMsg.className = isError ? 'error' : 'success';
        }
        
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                window.location.href = '/';
            }
        });
    </script>
</body>
</html>
'@

Set-Content -Path "login.html" -Value $loginHtml

# 4. Agregar CSS login a styles.css
Write-Host "`n📄 Actualizando css/styles.css..." -ForegroundColor Cyan

$loginCss = @'

/* Login/Signup Styles */
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
}

.login-box h1 {
    text-align: center;
    margin-bottom: 10px;
    font-size: 32px;
}

.login-box p {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
}

.login-box input {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    box-sizing: border-box;
}

.login-box button {
    width: 100%;
    padding: 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

.login-box button:hover {
    background: #5568d3;
}

.switch-mode {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
}

.switch-mode a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
}

.error {
    padding: 10px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 6px;
    color: #c33;
    margin-top: 15px;
    text-align: center;
}

.success {
    padding: 10px;
    background: #efe;
    border: 1px solid #cfc;
    border-radius: 6px;
    color: #3c3;
    margin-top: 15px;
    text-align: center;
}
'@

Add-Content -Path "css/styles.css" -Value $loginCss

# 5. Actualizar package.json
Write-Host "`n📄 Actualizando package.json..." -ForegroundColor Cyan

$packageJson = @'
{
  "name": "sales-coach-ai",
  "version": "2.0.0",
  "description": "Sistema Operativo Comercial Inteligente",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.20.1"
  },
  "devDependencies": {
    "vercel": "^33.0.0"
  }
}
'@

Set-Content -Path "package.json" -Value $packageJson

# 6. Crear .env.local.example
Write-Host "`n📄 Creando .env.local.example..." -ForegroundColor Cyan

$envExample = @'
# Copiar este archivo a .env.local y completar con tus credenciales

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
'@

Set-Content -Path ".env.local.example" -Value $envExample

Write-Host "`n✅ Actualización completa!" -ForegroundColor Green
Write-Host "`n📝 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Crear archivo .env.local con tus credenciales Supabase"
Write-Host "2. Agregar credenciales en Vercel (Settings → Environment Variables)"
Write-Host "3. git add ."
Write-Host "4. git commit -m 'feat: Supabase integration'"
Write-Host "5. git push origin main"
Write-Host "6. vercel --prod"
Write-Host "`n🚀 Ver instrucciones completas en INSTRUCCIONES_DEPLOY.md" -ForegroundColor Cyan
