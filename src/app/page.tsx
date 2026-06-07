"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Author } from "@prisma/client";

export default function AuthorsDashboard() {
  const [authors, setAuthors] = useState<(Author & { _count?: { books: number } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    nationality: "",
    birthYear: "",
  });

  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/authors");
      if (res.ok) {
        const data = await res.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : "/api/authors";
    const method = editingAuthor ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingAuthor(null);
        setFormData({ name: "", email: "", bio: "", nationality: "", birthYear: "" });
        fetchAuthors();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar el autor");
      }
    } catch (error) {
      console.error("Error saving author:", error);
      alert("Error inesperado al guardar el autor");
    }
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      email: author.email,
      bio: author.bio || "",
      nationality: author.nationality || "",
      birthYear: author.birthYear ? author.birthYear.toString() : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este autor? Sus libros también podrían eliminarse o quedar huérfanos.")) return;

    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAuthors();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar el autor");
      }
    } catch (error) {
      console.error("Error deleting author:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Autores</h1>
        <button
          onClick={() => {
            setEditingAuthor(null);
            setFormData({ name: "", email: "", bio: "", nationality: "", birthYear: "" });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          Añadir Autor
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 truncate">{author.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{author.email}</p>
                
                <div className="flex justify-between items-center text-sm mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div className="text-center">
                    <span className="block font-bold text-lg text-blue-600">{author._count?.books || 0}</span>
                    <span className="text-zinc-500 text-xs uppercase tracking-wider">Libros</span>
                  </div>
                  {author.nationality && (
                    <div className="text-center">
                      <span className="block font-medium truncate max-w-[80px]">{author.nationality}</span>
                      <span className="text-zinc-500 text-xs uppercase tracking-wider">Origen</span>
                    </div>
                  )}
                  {author.birthYear && (
                    <div className="text-center">
                      <span className="block font-medium">{author.birthYear}</span>
                      <span className="text-zinc-500 text-xs uppercase tracking-wider">Año</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2">
                  <Link 
                    href={`/authors/${author.id}`}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-center py-2 rounded-md font-medium text-sm transition-colors"
                  >
                    Ver Detalles
                  </Link>
                  <button 
                    onClick={() => handleEdit(author)}
                    className="p-2 text-zinc-500 hover:text-blue-600 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(author.id)}
                    className="p-2 text-zinc-500 hover:text-red-600 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full my-8 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">{editingAuthor ? "Editar Autor" : "Nuevo Autor"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nacionalidad</label>
                <input 
                  type="text" 
                  name="nationality" 
                  value={formData.nationality} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Año de Nacimiento</label>
                <input 
                  type="number" 
                  name="birthYear" 
                  value={formData.birthYear} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Biografía</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange} 
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingAuthor ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
