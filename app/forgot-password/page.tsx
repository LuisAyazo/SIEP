'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validación del dominio de correo
      if (!email.endsWith('@unicartagena.edu.co')) {
        throw new Error('Solo se permiten correos con dominio @unicartagena.edu.co');
      }
      
      // Aquí iría la lógica real para enviar el correo de recuperación
      // Por ahora, simulamos la acción
      setTimeout(() => {
        setSent(true);
        setIsLoading(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Columna izquierda: Branding y presentación */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-secondary via-secondary to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <div className="absolute inset-0 z-0">
          <div className="absolute w-full h-full">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
        </div>
        
        {/* Logo con brillo */}
        <div className="absolute top-10 left-10 z-20">
          <Image 
            src="/images/logo-oficial.png" 
            alt="Universidad de Cartagena" 
            width={180} 
            height={72} 
            priority
            className="drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]"
          />
        </div>
        
        <div className="relative z-20 flex flex-col justify-center items-start w-full p-12 text-white">
          <div className="max-w-md pl-6 border-l-4 border-primary">
            <h1 className="text-4xl font-bold mb-2">Sistema de Gestión</h1>
            <h2 className="text-3xl font-bold mb-6 text-primary">Proyectos Académicos</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Plataforma integral para gestión, seguimiento y evaluación de proyectos y programas de extensión y proyección social.
            </p>
            
            <div className="mt-12 flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Universidad de Cartagena</p>
                <p className="text-xs text-primary">Vicerrectoría de Extensión</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha: Formulario de recuperación */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gray-50 relative">
        {/* Fondo discreto con el logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image 
            src="/images/logo-oficial.png" 
            alt="Background Logo" 
            width={500} 
            height={200}
            className="mx-auto"
          />
        </div>
        
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl relative z-10" style={{ borderTop: '4px solid #FFA500' }}>
          {/* Header para móviles */}
          <div className="md:hidden text-center mb-6">
            <Image 
              src="/images/logo-oficial.png" 
              alt="Universidad de Cartagena" 
              width={160} 
              height={64} 
              priority 
              className="mx-auto"
            />
            <div className="mt-4 mb-6 text-center">
              <h2 className="text-xl font-bold text-secondary">Sistema de Gestión</h2>
              <p className="text-primary font-semibold">Proyectos Académicos</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-center text-2xl font-extrabold text-secondary">
              Recuperar contraseña
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
            <div className="flex items-center justify-center mt-3">
              <div className="h-1 w-10 bg-primary rounded-full"></div>
            </div>
          </div>
          
          {!sent ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border-l-4 border-red-500">
                  <span className="font-medium">Error: </span>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      <span className="w-1 h-4 bg-primary mr-2 rounded-full inline-block"></span>
                      Correo electrónico institucional
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
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
                      className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 bg-white"
                      placeholder="usuario@unicartagena.edu.co"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 shadow-lg hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(to right, #FF8C00, #FFA500)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    padding: '0.75rem 1rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : "Enviar enlace de recuperación"}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-secondary">¡Correo enviado!</h3>
              <div className="mt-3 text-sm text-gray-600">
                <p>Hemos enviado un enlace de recuperación a:</p>
                <p className="font-medium mt-1">{email}</p>
                <p className="mt-3">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-white hover:bg-gray-50 border-primary transition duration-150"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-xs text-gray-400 text-center max-w-md">
          © {new Date().getFullYear()} Universidad de Cartagena. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}