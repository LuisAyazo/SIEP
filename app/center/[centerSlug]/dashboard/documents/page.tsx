'use client';

import React, { useState, useRef, useEffect } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import DocumentIcon from '@/components/DocumentIcon';
import { motion, AnimatePresence } from 'framer-motion';

// Mock documents data with directories
const initialDocumentData = [
  { 
    id: '1', 
    name: 'Informe Semestral 2025-I.pdf', 
    type: 'file',
    fileType: 'pdf',
    createdAt: '2025-04-01', 
    author: 'Juan Pérez', 
    size: '2.4 MB',
    path: '/Informes/',
    category: 'Informes',
    tags: ['semestral', 'académico']
  },
  { 
    id: '2', 
    name: 'Presupuesto Proyecto Extensión.xlsx', 
    type: 'file',
    fileType: 'xlsx',
    createdAt: '2025-03-28', 
    author: 'María López', 
    size: '1.8 MB',
    path: '/Finanzas/',
    category: 'Finanzas',
    tags: ['presupuesto', 'proyecto']
  },
  { 
    id: '3', 
    name: 'Convenio Universidad-Empresa.docx', 
    type: 'file',
    fileType: 'docx',
    createdAt: '2025-03-15', 
    author: 'Carlos Rodríguez', 
    size: '3.5 MB',
    path: '/Convenios/',
    category: 'Legal',
    tags: ['convenio', 'empresarial']
  },
  { 
    id: '4', 
    name: 'Formato de Inscripción.pdf', 
    type: 'file',
    fileType: 'pdf',
    createdAt: '2025-03-10', 
    author: 'Ana Martínez', 
    size: '1.2 MB',
    path: '/Formularios/',
    category: 'Formularios',
    tags: ['inscripción', 'estudiantes']
  },
  { 
    id: '5', 
    name: 'Plan de Trabajo 2025.docx', 
    type: 'file',
    fileType: 'docx',
    createdAt: '2025-02-20', 
    author: 'Luis Gómez', 
    size: '2.1 MB',
    path: '/Planificación/',
    category: 'Planificación',
    tags: ['plan', 'anual']
  },
  { 
    id: 'dir1', 
    name: 'Informes', 
    type: 'directory',
    createdAt: '2025-01-10', 
    author: 'Admin Sistema', 
    size: '--',
    path: '/',
    category: 'Carpeta'
  },
  { 
    id: 'dir2', 
    name: 'Finanzas', 
    type: 'directory',
    createdAt: '2025-01-10', 
    author: 'Admin Sistema', 
    size: '--',
    path: '/',
    category: 'Carpeta'
  },
  { 
    id: 'dir3', 
    name: 'Convenios', 
    type: 'directory',
    createdAt: '2025-02-05', 
    author: 'Carlos Rodríguez', 
    size: '--',
    path: '/',
    category: 'Carpeta'
  },
  { 
    id: 'dir4', 
    name: 'Formularios', 
    type: 'directory',
    createdAt: '2025-02-08', 
    author: 'Ana Martínez', 
    size: '--',
    path: '/',
    category: 'Carpeta'
  },
  { 
    id: 'dir5', 
    name: 'Planificación', 
    type: 'directory',
    createdAt: '2025-01-15', 
    author: 'María López', 
    size: '--',
    path: '/',
    category: 'Carpeta'
  }
];

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [documents, setDocuments] = useState(initialDocumentData);
  const [currentPath, setCurrentPath] = useState('/');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'directory'>('file');
  const [newItemName, setNewItemName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDragging, setIsDragging] = useState(false);
  
  // Categorías disponibles
  const categories = ['Todos', 'Informes', 'Finanzas', 'Legal', 'Formularios', 'Planificación', 'Carpeta'];

  // Handle directory creation
  const handleCreateDirectory = () => {
    if (!newItemName.trim()) return;
    
    const newDirectory = {
      id: `dir${Date.now()}`,
      name: newItemName.trim(),
      type: 'directory',
      createdAt: new Date().toISOString().split('T')[0],
      author: 'Usuario Actual',
      size: '--',
      path: currentPath,
      category: 'Carpeta'
    };
    
    setDocuments([...documents, newDirectory]);
    setShowCreateModal(false);
    setNewItemName('');
  };

  // Handle file upload
  const handleFileUpload = (files?: FileList) => {
    const fileList = files || fileInputRef.current?.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      setUploadingFile(true);
      
      setTimeout(() => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = '';
        let category = 'Otros';
        
        switch(fileExtension) {
          case 'pdf': 
            fileType = 'pdf'; 
            category = 'Informes';
            break;
          case 'doc':
          case 'docx': 
            fileType = 'docx'; 
            category = 'Formularios';
            break;
          case 'xls':
          case 'xlsx': 
            fileType = 'xlsx'; 
            category = 'Finanzas';
            break;
          default: 
            fileType = fileExtension;
        }
        
        const newFile = {
          id: `file${Date.now()}`,
          name: file.name,
          type: 'file',
          fileType: fileType,
          createdAt: new Date().toISOString().split('T')[0],
          author: 'Usuario Actual',
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          path: currentPath,
          category: category,
          tags: []
        };
        
        setDocuments([...documents, newFile]);
        setUploadingFile(false);
        setShowCreateModal(false);
        setNewItemName('');
        setIsDragging(false);
      }, 1500);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  // Sort functions
  const toggleSort = (sortField: 'name' | 'date' | 'size') => {
    if (sortBy === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortField);
      setSortOrder('asc');
    }
  };
  
  // Sort documents
  const sortDocuments = (docs: any[]) => {
    return [...docs].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        if (a.type === 'directory' && b.type !== 'directory') {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (a.type !== 'directory' && b.type === 'directory') {
          return sortOrder === 'asc' ? 1 : -1;
        }
        if (a.type === 'directory' && b.type === 'directory') {
          return 0;
        }
        const sizeA = parseFloat(a.size);
        const sizeB = parseFloat(b.size);
        return sortOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      }
    });
  };

  // Navigate to directory
  const navigateToDirectory = (dirName: string) => {
    if (dirName === '..') {
      const pathParts = currentPath.split('/').filter(p => p);
      if (pathParts.length > 0) {
        pathParts.pop();
        const newPath = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '/';
        setCurrentPath(newPath);
      } else {
        setCurrentPath('/');
      }
    } else {
      setCurrentPath(`${currentPath}${dirName}/`);
    }
    setSelectedDoc(null);
  };

  // Handle document click
  const handleDocClick = (doc: any) => {
    if (doc.type === 'directory') {
      navigateToDirectory(doc.name);
    } else {
      setSelectedDoc(doc);
    }
  };

  // Handle document deletion
  const handleDelete = (id: string) => {
    if(confirm('¿Está seguro que desea eliminar este elemento?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc(null);
      }
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (doc.path !== currentPath) return false;
    
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== 'Todos') {
      matchesCategory = doc.category === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });
  
  const sortedDocuments = sortDocuments(filteredDocuments);
  
  // Calculate stats
  const docStats = {
    total: filteredDocuments.length,
    files: filteredDocuments.filter(doc => doc.type === 'file').length,
    folders: filteredDocuments.filter(doc => doc.type === 'directory').length,
    totalSize: filteredDocuments
      .filter(doc => doc.type === 'file')
      .reduce((acc, doc) => acc + parseFloat(doc.size || '0'), 0)
      .toFixed(2)
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    const paths = currentPath.split('/').filter(p => p);
    
    return (
      <nav className="flex items-center flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setCurrentPath('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </button>
        
        {paths.map((path, index) => (
          <React.Fragment key={path}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <button 
              onClick={() => {
                const targetPath = '/' + paths.slice(0, index + 1).join('/') + '/';
                setCurrentPath(targetPath);
              }}
              className="px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              {path}
            </button>
          </React.Fragment>
        ))}
      </nav>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    }
  };

  return (
    <PermissionGuard 
      resource={RESOURCES.DOCUMENTS} 
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div 
        className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50/30"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-12 border-4 border-dashed border-blue-500">
                <svg className="w-24 h-24 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p className="text-2xl font-bold text-blue-600">Suelta aquí para subir</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                Gestor Documental
              </h1>
              <p className="text-gray-600 mt-2">
                Administra y organiza todos tus documentos institucionales
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {setShowCreateModal(true); setModalType('directory')}}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-all font-medium shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Nueva Carpeta
              </button>
              <button
                onClick={() => {setShowCreateModal(true); setModalType('file')}}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Subir Documento
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            {/* Stats Cards */}
            <div className="space-y-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Elementos</p>
                    <p className="text-3xl font-bold mt-1">{docStats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-amber-600 text-xs font-medium">Archivos</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{docStats.files}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-green-600 text-xs font-medium">Carpetas</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{docStats.folders}</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-purple-600 text-xs font-medium">Espacio Usado</p>
                <p className="text-xl font-bold text-purple-700 mt-1">{docStats.totalSize} MB</p>
                <div className="mt-2 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </div>

            {/* Categories Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categorías
              </h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                      selectedCategory === cat
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                    {cat !== 'Todos' && (
                      <span className="float-right text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                        {documents.filter(d => d.category === cat && d.path === currentPath).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentos Recientes
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Favoritos
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartidos
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              {renderBreadcrumb()}
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Buscar documentos..." 
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Sort */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => toggleSort('name')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'name' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                    title="Ordenar por nombre"
                  >
                    Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => toggleSort('date')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'date' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                    title="Ordenar por fecha"
                  >
                    Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
            </div>

            {/* Back Button */}
            {currentPath !== '/' && (
              <div className="px-8 py-3 bg-blue-50 border-b border-blue-100">
                <button
                  onClick={() => navigateToDirectory('..')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver
                </button>
              </div>
            )}

            {/* Documents Area */}
            <div className="flex-1 overflow-y-auto p-8">
              {sortedDocuments.length > 0 ? (
                <>
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentPath}
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                      >
                        {sortedDocuments.map((doc) => (
                          <motion.div
                            key={doc.id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, translateY: -4 }}
                            className={`group bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              selectedDoc?.id === doc.id 
                                ? 'border-blue-500 shadow-lg shadow-blue-100' 
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                            onClick={() => handleDocClick(doc)}
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                                <DocumentIcon 
                                  fileName={doc.name} 
                                  isDirectory={doc.type === 'directory'} 
                                  size={48} 
                                  view="grid"
                                />
                              </div>
                              <p className="text-sm font-medium text-center truncate w-full" title={doc.name}>
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.type === 'directory' ? 'Carpeta' : doc.size}
                              </p>
                              
                              {/* Actions on hover */}
                              {doc.type === 'file' && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(doc.id);
                                    }}
                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* List View */}
                  {viewMode === 'list' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Autor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tamaño</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <AnimatePresence mode="wait">
                            {sortedDocuments.map((doc) => (
                              <motion.tr 
                                key={doc.id}
                                variants={itemVariants}
                                className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                                  selectedDoc?.id === doc.id ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => handleDocClick(doc)}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <DocumentIcon 
                                      fileName={doc.name} 
                                      isDirectory={doc.type === 'directory'} 
                                      size={24} 
                                      view="list"
                                    />
                                    <span className="font-medium text-gray-900">{doc.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    doc.category === 'Informes' ? 'bg-blue-100 text-blue-700' :
                                    doc.category === 'Finanzas' ? 'bg-green-100 text-green-700' :
                                    doc.category === 'Legal' ? 'bg-purple-100 text-purple-700' :
                                    doc.category === 'Formularios' ? 'bg-amber-100 text-amber-700' :
                                    doc.category === 'Planificación' ? 'bg-pink-100 text-pink-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {doc.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doc.createdAt}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doc.author}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doc.size}</td>
                                <td className="px-6 py-4 text-right">
                                  {doc.type === 'file' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay documentos</h3>
                  <p className="text-gray-500 mb-6">Arrastra archivos aquí o haz clic en "Subir Documento"</p>
                  <button
                    onClick={() => {setShowCreateModal(true); setModalType('file')}}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Subir Primer Documento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                  <h3 className="text-xl font-bold">
                    {modalType === 'directory' ? 'Nueva Carpeta' : 'Subir Documento'}
                  </h3>
                </div>
                
                <div className="p-6">
                  {modalType === 'directory' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de la carpeta
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mi nueva carpeta"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateDirectory}
                          disabled={!newItemName.trim()}
                          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Crear Carpeta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label
                        htmlFor="fileUpload"
                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          uploadingFile 
                            ? 'border-blue-300 bg-blue-50 opacity-60' 
                            : 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/50'
                        }`}
                      >
                        {uploadingFile ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm font-medium text-blue-700">Subiendo documento...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <svg className="w-16 h-16 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                            <p className="text-sm font-medium text-blue-700 mb-1">
                              Haz clic o arrastra archivos
                            </p>
                            <p className="text-xs text-gray-500">PDF, Word, Excel (Max 10MB)</p>
                          </div>
                        )}
                        <input 
                          id="fileUpload"
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          disabled={uploadingFile}
                          onChange={() => handleFileUpload()}
                        />
                      </label>
                      
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Details Panel */}
        <AnimatePresence>
          {selectedDoc && selectedDoc.type === 'file' && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-40 overflow-y-auto border-l border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Detalles</h3>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="text-center mb-6 pb-6 border-b border-gray-200">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <DocumentIcon 
                      fileName={selectedDoc.name} 
                      isDirectory={false} 
                      size={64} 
                      view="grid"
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 break-all mb-2">{selectedDoc.name}</h4>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    selectedDoc.category === 'Informes' ? 'bg-blue-100 text-blue-700' :
                    selectedDoc.category === 'Finanzas' ? 'bg-green-100 text-green-700' :
                    selectedDoc.category === 'Legal' ? 'bg-purple-100 text-purple-700' :
                    selectedDoc.category === 'Formularios' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedDoc.category}
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Tamaño</p>
                    <p className="text-sm text-gray-900">{selectedDoc.size}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Fecha de creación</p>
                    <p className="text-sm text-gray-900">{selectedDoc.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Autor</p>
                    <p className="text-sm text-gray-900">{selectedDoc.author}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Ubicación</p>
                    <p className="text-sm text-gray-900">{selectedDoc.path}</p>
                  </div>
                  {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Etiquetas</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoc.tags.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Documento
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all font-medium border border-amber-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedDoc.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all font-medium border border-red-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PermissionGuard>
  );
}
