'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AVAILABLE_CENTERS } from '../../components/providers/CenterContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false); // Ocultar login por email por defecto
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useSupabaseSession();
  const supabase = createClient();

  // Helper function to get default center slug
  const getDefaultCenterSlug = () => {
    try {
      // Try to get from localStorage first
      const savedCenter = localStorage.getItem('selectedCenter');
      if (savedCenter) {
        const centerData = JSON.parse(savedCenter);
        return centerData.slug;
      }
      
      // Otherwise use the default center
      const defaultCenter = AVAILABLE_CENTERS.find(center => center.isDefault);
      return defaultCenter?.slug || AVAILABLE_CENTERS[0]?.slug;
    } catch (error) {
      console.error('Error getting default center:', error);
      // Fallback to first center if available
      return AVAILABLE_CENTERS[0]?.slug || 'centro-educacion-continua';
    }
  };

  useEffect(() => {
    console.log('[Login] Estado de sesión:', { loading, hasSession: !!session, sessionUser: session?.user?.email });
    
    // Si ya está autenticado, redireccionar al dashboard específico del centro
    if (!loading && session) {
      const centerSlug = getDefaultCenterSlug();
      console.log('[Login] Usuario ya autenticado, redirigiendo a:', `/center/${centerSlug}/dashboard`);
      router.push(`/center/${centerSlug}/dashboard`);
    }
    
    // Si hay error en la URL
    const errorParam = searchParams?.get('error');
    const errorMessage = searchParams?.get('message');
    const errorDescription = searchParams?.get('description');
    
    if (errorParam) {
      console.log('[Login] ⚠️ Error detectado en URL:', {
        error: errorParam,
        message: errorMessage,
        description: errorDescription
      });
      
      const errorMessages: Record<string, string> = {
        'auth_failed': `Error al autenticar con Google${errorMessage ? ': ' + errorMessage : ''}`,
        'invalid_domain': `Solo se permiten correos con dominio @unicartagena.edu.co${searchParams?.get('email') ? ' (recibido: ' + searchParams.get('email') + ')' : ''}`,
        'no_code': 'No se recibió código de autenticación de Google. Por favor intente de nuevo.',
        'no_session': 'No se pudo crear la sesión después de autenticar. Por favor intente de nuevo.',
      };
      
      const displayError = errorMessages[errorParam] ||
        (errorDescription ? decodeURIComponent(errorDescription) : 'Hubo un error al iniciar sesión. Por favor intente de nuevo.');
      
      setError(displayError);
      console.error('[Login] ❌ Error mostrado al usuario:', displayError);
    }
  }, [session, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validación del dominio de correo
      if (!email.endsWith('@unicartagena.edu.co')) {
        throw new Error('Solo se permiten correos con dominio @unicartagena.edu.co');
      }
      
      // Autenticación con Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        setError('Credenciales incorrectas. Intente de nuevo.');
      } else if (data.session) {
        const centerSlug = getDefaultCenterSlug();
        router.push(`/center/${centerSlug}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    console.log('========================================');
    console.log('[Login] 🚀 Iniciando autenticación con Google');
    console.log('[Login] Origin:', window.location.origin);
    console.log('[Login] Redirect URL:', `${window.location.origin}/auth/callback`);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'unicartagena.edu.co', // Restricción de dominio
          },
        },
      });

      console.log('[Login] Resultado de signInWithOAuth:', {
        hasData: !!data,
        data,
        error: signInError ? {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        } : null
      });

      if (signInError) {
        console.error('[Login] ❌ Error al iniciar OAuth:', signInError);
        setError('Error al iniciar sesión con Google. Intente de nuevo.');
        setIsLoading(false);
      } else {
        console.log('[Login] ✅ OAuth iniciado correctamente, redirigiendo a Google...');
      }
      // No necesitamos setIsLoading(false) aquí porque se redirigirá
    } catch (err: any) {
      console.error('[Login] ❌ Excepción al iniciar OAuth:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
      setIsLoading(false);
    }
    console.log('========================================');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-white flex flex-col md:flex-row">
      {/* Left side - Logo and description */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16">
        <div className="flex flex-col items-center mb-8">
          <div className="w-80 h-80 mb-6 relative">
            <Image
              src="/images/logo-oficial.png"
              alt="Universidad de Cartagena Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-amber-700 text-center mb-2">SIEP</h1>
          <h2 className="text-xl font-medium text-amber-600 text-center mb-6">
            Sistema Institucional de Extensión y Proyectos
          </h2>
        </div>
        
        <div className="max-w-md text-center bg-amber-100/50 p-6 rounded-lg border border-amber-200 shadow-sm">
          <p className="text-amber-800 font-medium mb-4">
            Plataforma integral para gestión, seguimiento y evaluación de proyectos y programas de extensión y proyección social.
          </p>
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <span className="text-sm text-amber-700">Universidad de Cartagena</span>
              <span className="mx-2 text-amber-400">•</span>
              <span className="text-sm text-amber-700">Vicerrectoría de Extensión</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 w-full max-w-md">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full shadow-inner"></div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 rounded-l-3xl shadow-xl">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-700">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Accede con tu cuenta institucional de Google
            </p>
          </div>

          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex">
                <svg className="w-5 h-5 inline mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd"></path>
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Google Sign In Button - Principal */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 border-2 border-amber-500 rounded-lg shadow-md bg-white text-base font-semibold text-gray-700 hover:bg-amber-50 hover:border-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
            </button>
          </div>

          {/* Divider con opción para mostrar login por email */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <button
                type="button"
                onClick={() => setShowEmailLogin(!showEmailLogin)}
                className="px-3 bg-white text-gray-500 hover:text-amber-600 focus:outline-none"
              >
                {showEmailLogin ? 'Ocultar login alternativo' : 'Mostrar login alternativo'}
              </button>
            </div>
          </div>

          {/* Formulario de email/password - Oculto por defecto */}
          {showEmailLogin && (
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <span className="w-1 h-4 bg-amber-500 mr-2 rounded-full inline-block"></span>
                      Correo electrónico
                    </div>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="correo@unicartagena.edu.co"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <span className="w-1 h-4 bg-amber-500 mr-2 rounded-full inline-block"></span>
                      Contraseña
                    </div>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-amber-600 hover:text-amber-800">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <svg className="animate-spin h-5 w-5 text-amber-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión con Email"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Universidad de Cartagena. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-b-2 border-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-700">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}