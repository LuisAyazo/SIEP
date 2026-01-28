'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        {/* Logo animado */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Image
              src="/images/logo-universidad-transparente.png"
              alt="Logo Universidad"
              width={80}
              height={80}
              className="rounded-sm border border-gray-200 dark:border-gray-600 dark:invert animate-pulse"
            />
            {/* Spinner alrededor del logo */}
            <div className="absolute inset-0 -m-2">
              <div className="h-full w-full rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
            </div>
          </div>
        </div>
        
        {/* Mensaje */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Por favor espera un momento
        </p>
        
        {/* Barra de progreso indeterminada */}
        <div className="mt-6 w-64 mx-auto">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
          width: 25%;
        }
      `}</style>
    </div>
  );
}
