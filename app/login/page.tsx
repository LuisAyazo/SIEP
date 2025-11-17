'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { AVAILABLE_CENTERS } from '../../components/providers/CenterContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    // Si ya está autenticado, redireccionar al dashboard específico del centro
    if (!loading && session) {
      const centerSlug = getDefaultCenterSlug();
      router.push(`/center/${centerSlug}/dashboard`);
    }
    
    // Si hay error en la URL
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError('Hubo un error al iniciar sesión. Por favor intente de nuevo.');
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
              Accede con tus credenciales institucionales
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

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                    className="appearance-none block w-full pl-10 pr-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                  "Iniciar sesión"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Universidad de Cartagena. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}